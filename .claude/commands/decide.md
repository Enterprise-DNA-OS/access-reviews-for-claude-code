# decide

Read the current review and access record. Confirm the operator is the assigned reviewer. Never infer a keep decision. Explain any failing gate.

Run:

```bash
npm run access -- decide --review=<review-id> --decision=keep --reason="<rationale>" --actor=<assigned-reviewer-email>
```

Replace placeholders from the operator request. Every command accepts --json. List candidates and stop when a reference is ambiguous. Never invent evidence or actor identity. Present the result in plain language. Drafts stay local. Nothing sends or changes another application's access.
