# import

Read docs/replace-conductorone.md. Inspect actual headings and supply a mapping when needed. Run the test import first and compare its count. Import for real only when the operator asks to import. Imported outcomes remain historical.

Run:

```bash
npm run access -- import conductorone --file=imports/tasks.csv --campaign="<campaign>" --due=<YYYY-MM-DD> --actor=<operator-email> --dry-run
```

Replace placeholders from the operator request. Every command accepts --json. List candidates and stop when a reference is ambiguous. Never invent evidence or actor identity. Present the result in plain language. Drafts stay local. Nothing sends or changes another application's access.
