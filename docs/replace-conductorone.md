# Move an access-review register from ConductorOne

ConductorOne now uses the C1 name. Sources checked 23 October 2026: [manage campaigns](https://www.c1.ai/docs/product/admin/manage-campaigns) and the [official c1i tool](https://github.com/ConductorOne/c1i).

## Export from the vendor

Open the campaign Tasks tab and choose Generate CSV. Download the prepared task report from the downloads centre. The campaign Reports > Generate report workflow produces an Excel workbook, which is a different export. The official c1i tool also supports CSV report generation. Preserve the originals and their source campaign.

The public help documents the export routes, but does not promise a fixed task CSV header set. Inspect your file before importing. The included fixture uses representative headings and fictional rows, not a captured customer export. An export missing individual user email, application or entitlement fields needs a different report or explicit enrichment from your source register before import. Do not invent those values.

## One import command

Use a fresh business database, without seeding fictional records. Run npm run migrate first.

```bash
npm run access -- import conductorone --file=imports/tasks.csv --campaign="October certification" --due=2026-11-30 --actor=operator@example.com --dry-run
npm run access -- import conductorone --file=imports/tasks.csv --campaign="October certification" --due=2026-11-30 --actor=operator@example.com
```

Choose your actual next due date. The test run validates the entire file and rolls back every change. The real run is atomic. Every source field is preserved. A repeat identical task is skipped. A changed task, duplicate ID, conflicting grant or invalid row fails the whole import. Source task IDs must be unique across imports. Import each campaign into its own local campaign.

| Logical field | Representative heading | Meaning |
|---|---|---|
| id | Task ID | Required stable source task identifier. |
| email | User Email | Required individual identity. |
| application | Application | Required application name. |
| entitlement | Entitlement | Required entitlement name. |
| account | Account | Optional account identifier, defaults to user email. |
| name | User Name | Optional display name, defaults to email. |
| reviewer | Reviewer Email | Optional single reviewer email. Missing or self-review assignments need reassignment. |

For your actual headings, write a mapping file and add --map=imports/columns.json to the same command:

```json
{"id":"ID","email":"User email","name":"User display name","application":"App","entitlement":"Access","account":"Account identifier","reviewer":"Assigned reviewer email"}
```

This is an example mapping, not a claim about the vendor's fixed headings. Keys omitted from the mapping use the representative defaults. Required columns and values are checked before anything is committed.

## What carries over

People, applications, entitlements, account references, reviewer assignments and every original source column are retained. Imported local reviews start pending. Vendor outcomes such as Certified or Revoked remain in the source payload and do not certify current access or prove removal. New people have unknown employment status. New entitlements have unknown privilege. New grants have unknown observed access.

Set person status and application owner, classify privilege, record current application evidence, then decide. The importer never changes a previously known person's status or overwrites a live grant from a historical task. It does not migrate connectors, SSO, policies, files, messages, every event log, or multi-step approval routing. Map those separately for a managed installation.

## Reconcile before cutover

Compare row counts, source IDs and a sample of original records. Confirm each account identifier and entitlement with its application owner. Reconcile all historical outcomes against current evidence. Run both review processes alongside one another, produce the certification pack and reconcile removals. Test database and evidence restoration before changing subscriptions. A JSON export is an interchange copy, not an automatic restore tool.

Omni by Enterprise DNA maps your records and builds the connections your operation needs. One setup fee, then a retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=conductorone&utm_medium=replace-guide).
