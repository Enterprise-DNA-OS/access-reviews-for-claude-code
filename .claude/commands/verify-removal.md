# verify-removal

The operator must verify actual removal in the owning application and supply evidence. This command records that verification only. It does not revoke access.

Run:

```bash
npm run access -- verify-removal --review=<review-id> --checked=<YYYY-MM-DD> --evidence="<private-reference>" --actor=<operator-email>
```

Replace placeholders from the operator request. Every command accepts --json. List candidates and stop when a reference is ambiguous. Never invent evidence or actor identity. Present the result in plain language. Drafts stay local. Nothing sends or changes another application's access.
