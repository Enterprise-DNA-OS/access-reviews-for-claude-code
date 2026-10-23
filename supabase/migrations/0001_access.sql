create schema access;
revoke all on schema access from public;
create function access.touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table access.people (
 id uuid primary key default gen_random_uuid(), email text not null unique check(email=lower(email) and position('@' in email)>1),
 name text not null check(length(trim(name))>0), department text not null default '', status text not null default 'unknown' check(status in ('active','left','unknown')),
 ended_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(status<>'left' or ended_on is not null)
);
create table access.applications (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), owner_email text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index application_name on access.applications(lower(name));
create table access.entitlements (
 id uuid primary key default gen_random_uuid(), application_id uuid not null references access.applications(id), name text not null,
 privileged boolean, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(application_id,name)
);
create table access.grants (
 id uuid primary key default gen_random_uuid(), person_id uuid not null references access.people(id), entitlement_id uuid not null references access.entitlements(id),
 account text not null, observed_status text not null default 'unknown' check(observed_status in ('present','removed','unknown')),
 observed_on date, last_used_on date, evidence_ref text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(person_id,entitlement_id,account),
 check(last_used_on is null or observed_on is null or last_used_on<=observed_on),
 check(observed_status='unknown' or (observed_on is not null and length(trim(evidence_ref))>0))
);
create index grants_entitlement on access.grants(entitlement_id);
create table access.campaigns (
 id uuid primary key default gen_random_uuid(), name text not null unique, due_on date not null,
 status text not null default 'open' check(status in ('open','closed')), closed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table access.reviews (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references access.campaigns(id), grant_id uuid not null references access.grants(id),
 reviewer_email text not null default '', decision text not null default 'pending' check(decision in ('pending','keep','remove')),
 rationale text not null default '', decided_at timestamptz, snapshot jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(campaign_id,grant_id),
 check(decision='pending' or (decided_at is not null and length(trim(reviewer_email))>0 and length(trim(rationale))>0))
);
create index reviews_grant on access.reviews(grant_id);
create index reviews_pending on access.reviews(reviewer_email) where decision='pending';
create table access.removal_checks (
 id uuid primary key default gen_random_uuid(), review_id uuid not null unique references access.reviews(id), verifier_email text not null,
 evidence_ref text not null check(length(trim(evidence_ref))>0), checked_on date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table access.source_rows (
 id uuid primary key default gen_random_uuid(), source_key text not null unique, review_id uuid not null references access.reviews(id), payload jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index source_review on access.source_rows(review_id);
create table access.activity (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null, subject_id uuid, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index activity_subject on access.activity(subject_id,created_at);
do $$ declare n text; begin
 foreach n in array array['people','applications','entitlements','grants','campaigns','reviews','removal_checks','source_rows','activity'] loop
 execute format('create trigger touch before update on access.%I for each row execute function access.touch()',n);
 execute format('alter table access.%I enable row level security',n);
 end loop;
end $$;
create view access.register as
select g.id,p.email,p.name,p.department,p.status person_status,p.ended_on,a.name application,a.owner_email,e.name entitlement,e.privileged,g.account,
 g.observed_status,g.observed_on,g.last_used_on,g.evidence_ref,
 jsonb_build_object('email',p.email,'person_status',p.status,'ended_on',p.ended_on,'application',a.name,'owner',a.owner_email,'entitlement',e.name,'privileged',e.privileged,'account',g.account,'status',g.observed_status,'observed',g.observed_on,'last_used',g.last_used_on,'evidence',g.evidence_ref) snapshot
from access.grants g join access.people p on p.id=g.person_id join access.entitlements e on e.id=g.entitlement_id join access.applications a on a.id=e.application_id;
create view access.review_queue as
select r.id,r.campaign_id,c.name campaign,c.status campaign_status,c.due_on,r.grant_id,g.email,g.application,g.entitlement,g.privileged,r.reviewer_email,r.decision,r.rationale,r.decided_at,
 (r.snapshot=g.snapshot) snapshot_current,
 (r.decision='keep' and r.snapshot=g.snapshot and g.person_status='active' and g.observed_status='present' and g.observed_on>=current_date-30 and g.privileged is not null and g.owner_email<>'') keep_valid,
 (r.decision='remove' and v.id is not null and g.observed_status='removed' and g.evidence_ref=v.evidence_ref and g.observed_on=v.checked_on and v.checked_on>=r.decided_at::date) removal_verified,
 case when r.decision='pending' and c.due_on<current_date then current_date-c.due_on else 0 end overdue_days
from access.reviews r join access.campaigns c on c.id=r.campaign_id join access.register g on g.id=r.grant_id left join access.removal_checks v on v.review_id=r.id;
create view access.campaign_summary as
select c.id,c.name,c.status,c.due_on,count(q.id)::int total,
 count(q.id) filter(where q.decision='pending')::int pending,
 count(q.id) filter(where q.decision='keep' and q.keep_valid)::int valid_keeps,
 count(q.id) filter(where q.decision='keep' and not q.keep_valid)::int invalid_keeps,
 count(q.id) filter(where q.decision='remove' and not q.removal_verified)::int removals_unverified,
 count(q.id) filter(where q.removal_verified)::int removals_verified
from access.campaigns c left join access.review_queue q on q.campaign_id=c.id group by c.id;
create view access.compliance_findings as
select id,'CIS-5.1' rule,'Account holder status unknown' finding from access.register where person_status='unknown' and observed_status<>'removed'
union all select id,'CIS-6.2','Departed person still has recorded access' from access.register where person_status='left' and observed_status<>'removed'
union all select id,'CIS-5.3','Recorded account inactivity exceeds 45 days' from access.register where last_used_on<current_date-45 and observed_status='present'
union all select id,'LOCAL-FRESHNESS','No current access evidence within 30 days' from access.register where observed_status<>'removed' and (observed_on is null or observed_on<current_date-30)
union all select id,'LOCAL-CLASSIFICATION','Privilege classification missing' from access.register where privileged is null and observed_status<>'removed'
union all select id,'LOCAL-OWNER','Application owner missing' from access.register where owner_email='' and observed_status<>'removed'
union all select id,'CIS-5.1','No valid access certification in the last three months' from access.register g where observed_status<>'removed' and not exists(select 1 from access.review_queue q where q.grant_id=g.id and q.keep_valid and q.decided_at >= current_date-interval '3 months')
union all select grant_id,'LOCAL-INDEPENDENCE','Reviewer is account holder' from access.review_queue where reviewer_email=email and campaign_status='open';
revoke all on all tables in schema access from public;
revoke all on all functions in schema access from public;
