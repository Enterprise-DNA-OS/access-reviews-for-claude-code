# observe

Read the current records before changing or explaining them.

Run:

```bash
npm run access -- observe --grant=<grant-id> --status=present --observed=<YYYY-MM-DD> --last-used=<YYYY-MM-DD> --evidence="<private-reference>" --actor=<operator-email>
```

Replace placeholders from the operator request. Every command accepts --json. List candidates and stop when a reference is ambiguous. Never invent evidence or actor identity. Present the result in plain language. Drafts stay local. Nothing sends or changes another application's access.
