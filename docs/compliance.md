# Access controls and evidence checks

Checked 23 October 2026. These are record checks against selected CIS Controls and local policies. They do not certify compliance or inspect a connected system. No regulation is assumed to apply to every business. An operator chooses their control framework and validates the evidence.

| Check | Source and meaning | Implementation and boundary |
|---|---|---|
| CIS-5.1 | [CIS v8.1 account management assessment](https://cas.docs.cisecurity.org/en/latest/source/Controls5/) and [CIS navigator](https://www.cisecurity.org/controls/cis-controls-navigator/v8) describe account inventory and recurring authorization review at least quarterly. | Flags unknown account holders and access lacking a valid keep decision in the last three calendar months. This tracks entitlement review evidence, not every inventory field in the control. |
| CIS-5.3 | The same CIS source describes disabling dormant accounts after 45 days where supported. | Flags recorded last use older than 45 days. Missing last use is unknown and appears in stale-access. No account is disabled. |
| CIS-6.2 | [CIS v8.1 access control management assessment](https://cas.docs.cisecurity.org/en/latest/source/Controls6/) covers an access revocation process for termination, rights changes and role changes. | Flags departed people with access not recorded as removed. An operator records the actual removal evidence. This does not cover every joiner/mover/leaver requirement. |
| LOCAL-FRESHNESS | Local operating policy, not a statutory deadline. | Access evidence older than 30 days or absent needs review. Change the rule through a migration. |
| LOCAL-CLASSIFICATION | Local operating policy. | A privilege classification and application owner are required before keep. Unknown is distinct from false. |
| LOCAL-INDEPENDENCE | Local operating policy. | A reviewer cannot decide their own access. Actor email must match the assigned reviewer. |

A keep decision requires an active account holder, current evidence that access is present, a known privilege classification and an application owner. It stores the record snapshot considered. Changes to that snapshot invalidate the current keep assessment. Decisions cannot be silently overwritten. Start a new campaign to recertify.

A removal decision is only an instruction to the application owner. The owner removes access in the real application. A local verifier records the evidence reference and date after the decision. A later observation of present access invalidates that removal verification. Closing a campaign requires every decision and current evidence to be complete.

Evidence references are operator assertions. The program does not read the evidence files, authenticate actor emails, enforce access in other applications, monitor live accounts, send reminders, or replace a security assessment. The database owner can alter history. Shared deployment needs authenticated operators and restricted database roles. Keep evidence private and test backups.
