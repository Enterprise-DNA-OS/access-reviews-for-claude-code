import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';

export const commands={
 help:[], people:[], applications:[], 'access-register':[], campaigns:[], campaign:['campaign'], 'application-progress':[], 'reviewer-progress':[], 'review-history':[],
 'review-queue':[], 'stale-access':[], leavers:[], 'privileged-access':[], removals:[], 'reviewer-load':[], compliance:[], attention:[], 'weekly-review':[], activity:['id'],
 'add-person':['email','name','department','status','ended','actor'], 'set-person':['person','status','ended','department','actor'],
 'add-application':['name','owner','actor'], 'set-application':['application','owner','actor'],
 'add-access':['person','application','entitlement','account','privileged','actor'],
 'classify-access':['grant','privileged','actor'],
 'observe':['grant','status','observed','last-used','evidence','actor'],
 'start-campaign':['name','due','reviewer','actor'],
 'assign-review':['review','reviewer','actor'], 'decide':['review','decision','reason','actor'],
 'verify-removal':['review','checked','evidence','actor'], 'close-campaign':['campaign','actor'],
 log:['id','note','actor'], import:['file','map','campaign','due','actor','dry-run'], export:['out'], 'draft-review':['campaign']
};
const tables=['people','applications','entitlements','grants','campaigns','reviews','removal_checks','source_rows','activity'];
const need=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}`);return o[k].trim();};
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Expected a real ISO date');return v;}
const today=()=>new Date().toISOString().slice(0,10);
const past=(v)=>{v=date(v);if(v>today())throw Error('Evidence dates cannot be in the future');return v;};
const email=v=>{v=String(v).trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))throw Error('Expected an email address');return v;};
const choice=(v,allowed)=>{if(!allowed.includes(v))throw Error(`Expected one of: ${allowed.join(', ')}`);return v;};
const bool=v=>v==='true'?true:v==='false'?false:v==='unknown'?null:(()=>{throw Error('Expected true, false or unknown');})();
export async function resolve(db,table,term){
 const label={people:"email || ' ' || name",applications:'name',campaigns:'name',grants:'account',reviews:'reviewer_email'}[table];
 if(!label)throw Error('Unsupported record type');
 if(!String(term||'').trim())throw Error('A record reference is required');
 const rows=await db.query(`select * from access.${table} where id::text=$1 or starts_with(id::text,lower($1)) or position(lower($1) in lower(${label}))>0 order by id`,[term]);
 const exact=rows.filter(r=>r.id===term||[r.email,r.name,r.account].some(v=>String(v||'').toLowerCase()===term.toLowerCase()));
 const found=exact.length?exact:rows;
 if(found.length!==1)throw Error(found.length?`Ambiguous ${table}:\n${found.map(r=>`${r.id} ${r.name||r.email||r.account||r.reviewer_email}`).join('\n')}`:`No matching ${table}: ${term}`);
 return found[0];
}
const canonical=v=>JSON.stringify(Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))));
async function audit(db,actor,action,subject,detail){await db.query('insert into access.activity(actor,action,subject_id,detail) values($1,$2,$3,$4)',[actor,action,subject,JSON.stringify(detail)]);}
async function openReview(db,o){const r=await resolve(db,'reviews',need(o,'review'));const [c]=await db.query('select * from access.campaigns where id=$1',[r.campaign_id]);if(c.status!=='open')throw Error('Campaign is closed');return r;}
function parse(args){const [cmd='help',...rest]=args; if(!(cmd in commands))throw Error(`Unknown command ${cmd}`);const o={},pos=[];for(const a of rest){if(!a.startsWith('--')){pos.push(a);continue;}const ix=a.indexOf('=');const k=a.slice(2,ix<0?undefined:ix);if(![...commands[cmd],'json'].includes(k))throw Error(`Unknown option --${k}`);if(k in o)throw Error(`Duplicate option --${k}`);o[k]=ix<0?true:a.slice(ix+1);if(['json','dry-run'].includes(k)?o[k]!==true:typeof o[k]!=='string')throw Error(`Invalid value for --${k}`);}if(pos.length&&(cmd!=='import'||pos.length!==1||pos[0]!=='conductorone'))throw Error('Unexpected arguments. Use import conductorone for a vendor CSV.');if(cmd==='import'&&pos[0]!=='conductorone')throw Error('Use import conductorone');return {cmd,o};}
export async function run(db,args){
 const {cmd,o}=parse(args);
 if(cmd==='help')return Object.entries(commands).map(([command,options])=>({command,options:options.map(x=>`--${x}`).join(' ')}));
 const read={
 people:'select * from access.people order by email',applications:'select * from access.applications order by name',
 'access-register':'select id,email,application,entitlement,account,privileged,person_status,observed_status,observed_on,last_used_on from access.register order by email,application',
 campaigns:'select * from access.campaign_summary order by due_on,name',
 'review-queue':"select id,email,application,entitlement,reviewer_email,decision,overdue_days from access.review_queue where campaign_status='open' and (decision='pending' or (decision='keep' and not keep_valid)) order by overdue_days desc,email",
 'stale-access':"select email,application,account,last_used_on,observed_on from access.register where observed_status<>'removed' and (last_used_on is null or last_used_on<current_date-45 or observed_on is null or observed_on<current_date-30) order by email",
 leavers:"select email,application,entitlement,ended_on,observed_status from access.register where person_status='left' and observed_status<>'removed' order by ended_on,email",
 'privileged-access':"select email,application,entitlement,privileged,person_status,observed_on from access.register where privileged is distinct from false and observed_status<>'removed' order by application,email",
 removals:"select id,email,application,entitlement,decided_at,removal_verified from access.review_queue where decision='remove' order by removal_verified,email",
 'reviewer-load':"select reviewer_email,count(*)::int pending,count(*) filter(where overdue_days>0)::int overdue from access.review_queue where campaign_status='open' and decision='pending' group by reviewer_email order by pending desc,reviewer_email",
  'application-progress':"select campaign,application,count(*)::int total,count(*) filter(where decision='pending')::int pending,count(*) filter(where decision='keep')::int kept,count(*) filter(where decision='remove')::int removal_decisions,count(*) filter(where removal_verified)::int removals_verified from access.review_queue group by campaign,application order by campaign,application",
 'reviewer-progress':"select r.reviewer_email,count(*)::int assigned,count(*) filter(where r.decision<>'pending')::int decided,round(100.0*count(*) filter(where r.decision='keep')/nullif(count(*) filter(where r.decision<>'pending'),0),1) keep_percent,round(avg(extract(epoch from (r.decided_at-r.created_at))/3600) filter(where r.decided_at>=r.created_at),1) average_elapsed_hours from access.reviews r group by reviewer_email order by reviewer_email",
 'review-history':"select decided_at::date as review_date,count(*)::int decisions,count(*) filter(where decision='keep')::int kept,count(*) filter(where decision='remove')::int removal_decisions from access.reviews where decided_at is not null group by decided_at::date order by review_date",
 compliance:'select f.rule,g.email,g.application,g.entitlement,f.finding from access.compliance_findings f join access.register g on g.id=f.id order by f.rule,g.email',
 attention:"select email,application,string_agg(distinct finding,'; ' order by finding) findings from access.compliance_findings f join access.register g on g.id=f.id group by email,application order by email"
 };
 if(read[cmd])return db.query(read[cmd]);
 if(cmd==='weekly-review')return {campaigns:await run(db,['campaigns']),reviews:await run(db,['review-queue']),removals:await run(db,['removals']),findings:await run(db,['compliance'])};
 if(cmd==='campaign'){const c=await resolve(db,'campaigns',need(o,'campaign'));return {campaign:c,reviews:await db.query('select * from access.review_queue where campaign_id=$1 order by email',[c.id])};}
 if(cmd==='activity')return db.query('select * from access.activity where ($1::uuid is null or subject_id=$1::uuid) order by created_at,id',[o.id||null]);
 if(cmd==='export'){
 const out=path.resolve(o.out||path.join(REPO_ROOT,'exports',`access-${randomUUID()}.json`));const data={format:'access-review-export-v1',exported_at:new Date().toISOString(),records:{}};
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of tables)data.records[t]=await db.query(`select * from access.${t} order by id`);}finally{await db.exec('ROLLBACK');}
 fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});return {file:out,counts:Object.fromEntries(Object.entries(data.records).map(([k,v])=>[k,v.length]))};
 }
 if(cmd==='draft-review'){
 const c=await run(db,['campaign',`--campaign=${need(o,'campaign')}`]);const out=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts',`review-${c.campaign.id}-${randomUUID()}.md`);fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});
 fs.writeFileSync(out,`# Access review: ${c.campaign.name}\n\nInternal draft. Nothing has been sent. Removal decisions do not revoke access.\n\n${human(c.reviews.map(r=>({email:r.email,application:r.application,decision:r.decision,verified:r.removal_verified})))}\n`,{mode:0o600,flag:'wx'});return {file:out};
 }
 const actor=email(need(o,'actor'));
 await db.exec('BEGIN');
 try{
 // Serialize the local operator workflow, including imports and campaign closure.
 await db.exec('LOCK TABLE access.people,access.applications,access.entitlements,access.grants,access.campaigns,access.reviews,access.removal_checks,access.source_rows IN SHARE ROW EXCLUSIVE MODE');
 let result,subject=null;
 if(cmd==='add-person'){
 const status=choice(o.status||'unknown',['active','left','unknown']);const ended=o.ended?past(o.ended):null;if(status==='left'&&!ended)throw Error('Departed people need --ended');
 [result]=await db.query('insert into access.people(email,name,department,status,ended_on) values($1,$2,$3,$4,$5) returning *',[email(need(o,'email')),need(o,'name'),o.department||'',status,ended]);subject=result.id;
 }else if(cmd==='set-person'){
 const p=await resolve(db,'people',need(o,'person'));const status=choice(o.status||p.status,['active','left','unknown']);const ended=o.ended?past(o.ended):status==='left'?p.ended_on:null;
 if(status==='left'&&!ended)throw Error('Departed people need --ended');
 [result]=await db.query('update access.people set status=$2,ended_on=$3,department=$4 where id=$1 returning *',[p.id,status,ended,o.department??p.department]);subject=p.id;
 }else if(cmd==='add-application'){
 [result]=await db.query('insert into access.applications(name,owner_email) values($1,$2) returning *',[need(o,'name'),email(need(o,'owner'))]);subject=result.id;
 }else if(cmd==='set-application'){
 const a=await resolve(db,'applications',need(o,'application'));[result]=await db.query('update access.applications set owner_email=$2 where id=$1 returning *',[a.id,email(need(o,'owner'))]);subject=a.id;
 }else if(cmd==='add-access'){
 const p=await resolve(db,'people',need(o,'person'));const a=await resolve(db,'applications',need(o,'application'));const name=need(o,'entitlement');const privileged=bool(o.privileged||'unknown');
 let [e]=await db.query('select * from access.entitlements where application_id=$1 and name=$2',[a.id,name]);
 if(e&&e.privileged!==privileged)throw Error('Existing entitlement classification differs. Use classify-access.');
 if(!e)[e]=await db.query('insert into access.entitlements(application_id,name,privileged) values($1,$2,$3) returning *',[a.id,name,privileged]);
 [result]=await db.query('insert into access.grants(person_id,entitlement_id,account) values($1,$2,$3) returning *',[p.id,e.id,need(o,'account')]);subject=result.id;
 }else if(cmd==='classify-access'){
 const g=await resolve(db,'grants',need(o,'grant'));[result]=await db.query('update access.entitlements set privileged=$2 where id=$1 returning *',[g.entitlement_id,bool(need(o,'privileged'))]);subject=g.id;
 }else if(cmd==='observe'){
 const g=await resolve(db,'grants',need(o,'grant'));const observed=past(need(o,'observed'));if(g.observed_on&&observed<g.observed_on)throw Error('Observation predates the current record');
 const status=choice(need(o,'status'),['present','removed','unknown']);const used=o['last-used']?past(o['last-used']):null;if(used&&used>observed)throw Error('Last use cannot follow observation');
 [result]=await db.query('update access.grants set observed_status=$2,observed_on=$3,last_used_on=$4,evidence_ref=$5 where id=$1 returning *',[g.id,status,observed,used,need(o,'evidence')]);subject=g.id;
 }else if(cmd==='start-campaign'){
 const due=date(need(o,'due'));if(due<today())throw Error('New campaign due date is in the past');const reviewer=email(need(o,'reviewer'));
 [result]=await db.query('insert into access.campaigns(name,due_on) values($1,$2) returning *',[need(o,'name'),due]);
 const rows=await db.query("select * from access.register where observed_status<>'removed'");if(!rows.length)throw Error('No access records to review');
 if(rows.some(g=>g.email===reviewer))throw Error('Reviewer cannot review their own access');
 for(const g of rows)await db.query('insert into access.reviews(campaign_id,grant_id,reviewer_email,snapshot) values($1,$2,$3,$4)',[result.id,g.id,reviewer,JSON.stringify(g.snapshot)]);subject=result.id;result={...result,reviews:rows.length};
 }else if(cmd==='assign-review'){
 const r=await openReview(db,o);if(r.decision!=='pending')throw Error('Decided reviews cannot be reassigned');const reviewer=email(need(o,'reviewer'));const [g]=await db.query('select * from access.register where id=$1',[r.grant_id]);if(g.email===reviewer)throw Error('Self review is not allowed');
 [result]=await db.query('update access.reviews set reviewer_email=$2 where id=$1 returning *',[r.id,reviewer]);subject=r.id;
 }else if(cmd==='decide'){
 const r=await openReview(db,o);if(r.decision!=='pending')throw Error('Review already decided. Start a new campaign for another decision.');if(r.reviewer_email!==actor)throw Error('Actor must be the assigned reviewer');
 const [g]=await db.query('select * from access.register where id=$1',[r.grant_id]);if(g.email===actor)throw Error('Self review is not allowed');
 const decision=choice(need(o,'decision'),['keep','remove']);
 if(decision==='keep'&&(g.person_status!=='active'||g.observed_status!=='present'||!g.observed_on||g.observed_on<new Date(Date.now()-30*86400000).toISOString().slice(0,10)||g.privileged===null||!g.owner_email))throw Error('Keep needs active person, known privilege, owner and current evidence of access');
 [result]=await db.query('update access.reviews set decision=$2,rationale=$3,decided_at=now(),snapshot=$4 where id=$1 returning *',[r.id,decision,need(o,'reason'),JSON.stringify(g.snapshot)]);subject=r.id;
 }else if(cmd==='verify-removal'){
 const r=await openReview(db,o);if(r.decision!=='remove')throw Error('A remove decision is required');const checked=past(need(o,'checked'));if(checked<new Date(r.decided_at).toISOString().slice(0,10))throw Error('Removal check predates decision');
 const [g]=await db.query('select * from access.grants where id=$1',[r.grant_id]);if(g.observed_on&&checked<g.observed_on)throw Error('Removal check predates current observation');
 [result]=await db.query('insert into access.removal_checks(review_id,verifier_email,evidence_ref,checked_on) values($1,$2,$3,$4) returning *',[r.id,actor,need(o,'evidence'),checked]);
 await db.query("update access.grants set observed_status='removed',observed_on=$2,evidence_ref=$3 where id=$1",[r.grant_id,checked,o.evidence]);subject=r.id;
 }else if(cmd==='close-campaign'){
 const c=await resolve(db,'campaigns',need(o,'campaign'));if(c.status!=='open')throw Error('Campaign already closed');const [s]=await db.query('select * from access.campaign_summary where id=$1',[c.id]);
 if(!s.total||s.pending||s.invalid_keeps||s.removals_unverified)throw Error('Campaign has pending, invalid keep or unverified removal decisions');
 [result]=await db.query("update access.campaigns set status='closed',closed_at=now() where id=$1 returning *",[c.id]);subject=c.id;
 }else if(cmd==='log'){
 subject=need(o,'id');const found=await db.query('select id from access.grants where id=$1 union all select id from access.campaigns where id=$1 union all select id from access.reviews where id=$1',[subject]);if(!found.length)throw Error('No matching grant, campaign or review');result={note:need(o,'note')};
 }else if(cmd==='import')result=await importCsv(db,o);
 else throw Error(`Not implemented: ${cmd}`);
 await audit(db,actor,cmd,subject,cmd==='import'?result:o);
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
async function importCsv(db,o){
 const rows=parseCsv(fs.readFileSync(need(o,'file'),'utf8'));if(!rows.length)throw Error('CSV contains no rows');
 const map=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 const defaults={id:'Task ID',email:'User Email',name:'User Name',application:'Application',entitlement:'Entitlement',account:'Account',reviewer:'Reviewer Email'};
 for(const k of Object.keys(map))if(!(k in defaults))throw Error(`Unknown mapping ${k}`);
 const headings={...defaults,...map};for(const [k,h] of Object.entries(headings))if(typeof h!=='string'||!h.trim())throw Error(`Invalid mapping ${k}`);
 for(const k of ['id','email','application','entitlement'])if(!Object.keys(rows[0]).some(h=>h.toLowerCase()===headings[k].toLowerCase()))throw Error(`Missing column ${headings[k]}. Supply --map for this export.`);
 const name=need(o,'campaign'),due=date(need(o,'due'));let [c]=await db.query('select * from access.campaigns where name=$1',[name]);if(c&&c.status!=='open')throw Error('Import campaign is closed');if(c&&c.due_on!==due)throw Error('Campaign due date differs');
 if(!c)[c]=await db.query('insert into access.campaigns(name,due_on) values($1,$2) returning *',[name,due]);
 const seen=new Set();let added=0,skipped=0;
 for(const row of rows){
 const get=k=>pick(row,headings[k]).trim();const sourceId=get('id');if(!sourceId)throw Error('Every row needs a task ID');const key=`conductorone:${sourceId}`;
 if(seen.has(key))throw Error(`Duplicate task ID ${sourceId}`);seen.add(key);
 const [old]=await db.query('select * from access.source_rows where source_key=$1',[key]);
 if(old){const [review]=await db.query('select campaign_id from access.reviews where id=$1',[old.review_id]);if(review.campaign_id!==c.id||canonical(old.payload)!==canonical(row))throw Error(`Changed source task ${sourceId}. Reconcile without overwriting decisions.`);skipped++;continue;}
 const who=email(get('email'));const app=get('application'),ent=get('entitlement');if(!app||!ent)throw Error('Application and entitlement are required');
 let [p]=await db.query('select * from access.people where email=$1',[who]);if(!p)[p]=await db.query('insert into access.people(email,name) values($1,$2) returning *',[who,get('name')||who]);
 let [a]=await db.query('select * from access.applications where lower(name)=lower($1)',[app]);if(!a)[a]=await db.query('insert into access.applications(name) values($1) returning *',[app]);
 let [e]=await db.query('select * from access.entitlements where application_id=$1 and name=$2',[a.id,ent]);if(!e)[e]=await db.query('insert into access.entitlements(application_id,name) values($1,$2) returning *',[a.id,ent]);
 const account=get('account')||who;let [g]=await db.query('select * from access.grants where person_id=$1 and entitlement_id=$2 and account=$3',[p.id,e.id,account]);if(!g)[g]=await db.query('insert into access.grants(person_id,entitlement_id,account) values($1,$2,$3) returning *',[p.id,e.id,account]);
 const [reg]=await db.query('select snapshot from access.register where id=$1',[g.id]);const reviewer=get('reviewer')?email(get('reviewer')):'';
 const [review]=await db.query('insert into access.reviews(campaign_id,grant_id,reviewer_email,snapshot) values($1,$2,$3,$4) returning *',[c.id,g.id,reviewer===who?'':reviewer,JSON.stringify(reg.snapshot)]);
 await db.query('insert into access.source_rows(source_key,review_id,payload) values($1,$2,$3)',[key,review.id,JSON.stringify(row)]);added++;
 }
 return {added,skipped,campaign:c.name,dry_run:!!o['dry-run'],sha256:createHash('sha256').update(fs.readFileSync(o.file)).digest('hex'),note:'Source outcomes retained as history. Local reviews start pending; access remains unknown until observed.'};
}
export function human(value){
 if(!Array.isArray(value))return Object.entries(value).map(([k,v])=>`${k}:\n${typeof v==='object'&&v!==null?human(v):v}`).join('\n');
 if(!value.length)return 'No records.';const keys=Object.keys(value[0]);const str=v=>v===null?'unknown':v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):String(v??'');
 const widths=keys.map(k=>Math.min(70,Math.max(k.length,...value.map(r=>str(r[k]).length))));const line=r=>keys.map((k,i)=>str(r[k]).replace(/\s+/g,' ').slice(0,widths[i]).padEnd(widths[i])).join('  ');
 return [line(Object.fromEntries(keys.map(k=>[k,k.replaceAll('_',' ')]))),widths.map(w=>'-'.repeat(w)).join('  '),...value.map(line)].join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
