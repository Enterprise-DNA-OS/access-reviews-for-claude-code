# Command guide

Use npm run access -- followed by a command below. Every command accepts --json. Flags use --name=value. Actor email records an assertion, not authentication. All mutation commands require --actor. Names match without case, IDs accept unique prefixes and ambiguous references fail with candidates.

| Command | Options |
|---|---|
| help | None |
| people | None |
| applications | None |
| access-register | None |
| campaigns | None |
| campaign | --campaign |
| application-progress | None |
| reviewer-progress | None |
| review-history | None |
| review-queue | None |
| stale-access | None |
| leavers | None |
| privileged-access | None |
| removals | None |
| reviewer-load | None |
| compliance | None |
| attention | None |
| weekly-review | None |
| activity | --id |
| add-person | --email, --name, --department, --status, --ended, --actor |
| set-person | --person, --status, --ended, --department, --actor |
| add-application | --name, --owner, --actor |
| set-application | --application, --owner, --actor |
| add-access | --person, --application, --entitlement, --account, --privileged, --actor |
| classify-access | --grant, --privileged, --actor |
| observe | --grant, --status, --observed, --last-used, --evidence, --actor |
| start-campaign | --name, --due, --reviewer, --actor |
| assign-review | --review, --reviewer, --actor |
| decide | --review, --decision, --reason, --actor |
| verify-removal | --review, --checked, --evidence, --actor |
| close-campaign | --campaign, --actor |
| log | --id, --note, --actor |
| import | --file, --map, --campaign, --due, --actor, --dry-run |
| export | --out |
| draft-review | --campaign |

Status values: people use active, left or unknown; observed access uses present, removed or unknown. Privilege takes true, false or unknown. Decisions are keep or remove. Evidence dates cannot be in the future. Dates use YYYY-MM-DD. Missing last use stays unknown. An observation replaces the current evidence, so include last-used when known. A new campaign covers every non-removed grant.

Source imports keep their original values. A file mapping changes column selection, not source history. Exports create a new file and refuse to overwrite an existing one. Read docs/replace-conductorone.md before importing.
