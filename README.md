# Access Reviews for Claude Code

Know who still has access, which reviews are overdue, and whether a removal decision has evidence behind it. Keep the record in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT licensed. Start with fictional records and run a review. | Your approval rules, application mappings, evidence documents and business views. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=conductorone&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=conductorone&utm_medium=managed) |

For the operations or security owner who runs account certification. Works with Claude Code, Codex, OpenCode or Cursor. This base covers review records, evidence and paperwork. ConductorOne, now C1, is a broader identity governance platform. Live connectors, access enforcement and authenticated reviewer sign-in are separate implementation work. [Scope and selection evidence](docs/research.md).

## Quick start

Node 20 or later on Windows or Linux:

```bash
git clone https://github.com/Enterprise-DNA-OS/access-reviews-for-claude-code.git
cd access-reviews-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Local PGlite runs in .data/db, one process at a time. DATABASE_URL selects Postgres 15 or later with verified TLS for remote connections. The fictional seed includes a departed finance administrator whose removal is unverified, a dormant support account, an unclassified contractor account and overdue review tasks. Dates are relative to first seed. Repeating the seed preserves existing work.

For real records, select a fresh DATA_DIR or database, apply migrations without the seed and follow the [replacement guide](docs/replace-conductorone.md).

## Five weekly jobs

1. `/review-queue`: assign and finish overdue certification decisions.
2. `/leavers`: check access recorded against departed staff.
3. `/stale-access`: reconcile dormant accounts and missing evidence.
4. `/removals`: verify that agreed removals actually happened.
5. `/weekly-review`: combine decisions, removal evidence and control findings.

The one CLI has 35 commands and ships 37 slash recipes. Every command accepts --json. See [the command guide](docs/cli.md). Case-insensitive names and unique ID prefixes work. Ambiguous references list candidates and exit 1. A new campaign includes every recorded grant except those observed as removed.

## A decision is not an access change

Keep requires an active person, current evidence of access, an application owner and a known privilege classification. The actor must match the assigned reviewer and cannot be the account holder. The decision retains the snapshot considered. Changing the person, owner, privilege or access evidence invalidates the current keep assessment. Evidence older than 30 days also invalidates it.

Remove records a decision only. The application owner makes the change in that application, then the verifier records the evidence and date. A later observation that access is present invalidates removal verification. A campaign cannot close with pending decisions, invalid keeps or unverified removals. Completed campaigns retain their historical decisions while reports show current evidence validity separately.

Actor emails are operator assertions, not authenticated signatures. Evidence references are pointers, not inspected documents. No account changes, messages, automatic discovery or connector calls occur. Shared deployments require authenticated operators, restricted roles, private evidence storage and tested backups. The owner of a database can alter its history. [Control checks and sources](docs/compliance.md).

## Ten questions for your access review

These questions are answered by this build today. ConductorOne offers configurable reporting and analysis, so this is not a claim that it cannot answer them.

| Question | Command |
|---|---|
| Which reviews are overdue and who owns them? | review-queue |
| Which departed people still have recorded access? | leavers |
| Which accounts have no recent use or current evidence? | stale-access |
| Which removal decisions still lack verification? | removals |
| Which privileged accounts need attention? | privileged-access |
| Which applications have the most unfinished reviews? | application-progress |
| How many decisions has each reviewer made and how long did they take? | reviewer-progress |
| On which days were keep and removal decisions recorded? | review-history |
| Which control checks fail on the current records? | compliance |
| What evidence supports the decisions in this campaign? | campaign |

Reviewer elapsed time measures record creation to decision, not active work time. Imported histories start fresh local reviews. Missing dates and unknown classifications remain unknown.

## Your first hour: ten things to ask for

1. Put our business name and colours on the evidence pack.
2. Show overdue reviews with their responsible reviewer.
3. Find departed people still shown with administrator access.
4. Show every decision to remove access without verification.
5. Test our task export before importing it.
6. Map our actual report headings without losing original fields.
7. Record the evidence from the application owner.
8. Draft a review note for the weekly meeting.
9. Add a cost-centre field through `/customise`.
10. Add a read-only view for our risk committee through `/new-view`.

## Bring your review register across

```bash
npm run access -- import conductorone --file=imports/tasks.csv --campaign="Next certification" --due=2026-11-30 --actor=operator@example.com --dry-run
npm run access -- import conductorone --file=imports/tasks.csv --campaign="Next certification" --due=2026-11-30 --actor=operator@example.com
```

Choose your actual due date. Use the campaign Tasks CSV, not the separate Excel report. The public help does not specify fixed CSV headings. Inspect the file and use --map when needed. The included fixture is representative and fictional. Each task must identify a person, application, entitlement and stable source task ID. Every source column is preserved. Identical imports skip, changed tasks fail and any bad row rolls back the whole file.

Imported source decisions remain history. Local reviews start pending and new access records start unknown. No source label grants local approval or proves a removal. [Mappings and reconciliation](docs/replace-conductorone.md).

## Paperwork and read-only views

npm run docs produces a certification evidence pack and a removal worklist for each campaign. npm run view produces the weekly review and exception snapshots. Change brand.json for business name, logo and colours. Documents can be printed to PDF. Files stay local under ignored output directories. Nothing sends.

`/draft-review` writes a local meeting draft. `/customise` changes fields and policies through a migration and regression checks. `/new-view` adds a read-only question. [Why there is no front end](docs/why-no-front-end.md).

## Verification and backups

npm test creates a temporary database and exercises all 35 CLI commands, including self-review rejection, stale evidence, changed snapshots, regained access, closure gates, import rollback, repeat import, source preservation, CSV quoting, exports, drafts and HTML rendering. The suite also supports a fresh disposable TEST_DATABASE_URL. The repository workflow runs on Windows, Linux and Postgres 16.

The export command writes all nine record sets as JSON and refuses to overwrite an existing file. This is an interchange copy, not an automatic restore function. Back up the database and evidence separately and rehearse restoration. Keep business imports, exports, drafts and credentials out of Git.

MIT licence. Not affiliated with ConductorOne, C1, Workday or Anthropic. Hosting and coding-agent use have separate costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=conductorone&utm_medium=readme).
