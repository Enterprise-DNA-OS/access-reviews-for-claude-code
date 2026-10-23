insert into access.people(id,email,name,department,status,ended_on) values
('10000000-0000-4000-8000-000000000001','aria@example.test','Aria Chen','Operations','active',null),
('10000000-0000-4000-8000-000000000002','tama@example.test','Tama Wilson','Finance','left',current_date-12),
('10000000-0000-4000-8000-000000000003','lee@example.test','Lee Morgan','Support','active',null),
('10000000-0000-4000-8000-000000000004','lee.contractor@example.test','Lee Patel','Contractors','unknown',null)
on conflict do nothing;
insert into access.applications(id,name,owner_email) values
('20000000-0000-4000-8000-000000000001','Ledger','owner@example.test'),
('20000000-0000-4000-8000-000000000002','Support Desk','manager@example.test'),
('20000000-0000-4000-8000-000000000003','Legacy Archive','') on conflict do nothing;
insert into access.entitlements(id,application_id,name,privileged) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Administrator',true),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Agent',false),
('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','Reader',null) on conflict do nothing;
insert into access.grants(id,person_id,entitlement_id,account,observed_status,observed_on,last_used_on,evidence_ref) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','aria-admin','present',current_date-2,current_date-3,'demo://ledger-export'),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','tama-admin','present',current_date-2,current_date-20,'demo://ledger-export'),
('40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','lee','present',current_date-2,current_date-70,'demo://support-export'),
('40000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003','lee-contract','unknown',null,null,'') on conflict do nothing;
insert into access.campaigns(id,name,due_on) values('50000000-0000-4000-8000-000000000001','Quarterly access certification',current_date-4) on conflict do nothing;
insert into access.reviews(id,campaign_id,grant_id,reviewer_email,snapshot,decision,rationale,decided_at)
select ('60000000-0000-4000-8000-'||right(g.id::text,12))::uuid,'50000000-0000-4000-8000-000000000001',g.id,'owner@example.test',g.snapshot,
case when g.email='tama@example.test' then 'remove' else 'pending' end,
case when g.email='tama@example.test' then 'Employment ended. Application owner must remove and verify access.' else '' end,
case when g.email='tama@example.test' then now()-interval '3 days' else null end
from access.register g where g.id::text like '40000000-%' on conflict do nothing;
