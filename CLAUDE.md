# Access Reviews: operating instructions

Run the CLI before answering. The operator runs account certification, follows removals and prepares evidence. Data in the seed is fictional. Read the current access record and review before proposing a decision.

The one CLI is npm run access -- <command>. Read docs/cli.md for options. Every command accepts --json. Names match without case and IDs accept unique prefixes. If ambiguous, show candidates and stop. All mutations require the operator's actor email. Never invent an identity or source evidence.

Use the matching recipe in .claude/commands: review-queue, leavers, stale-access, removals and weekly-review for the weekly work; compliance for selected control checks; campaign for the full review; import for ConductorOne task CSV; export for an interchange copy; draft-review for a local meeting note; customise for fields and rules; new-view for read-only snapshots. The same recipes serve Claude Code, Codex, OpenCode and Cursor.

Keep requires an active person, known privilege classification, an owner and current access evidence. Self-review fails. A changed record or expired evidence invalidates the current keep assessment. Remove is an internal decision, never actual revocation. Verify removal only after the operator supplies checked evidence from the real application. A campaign closes only when every decision and evidence check is complete. Never bypass these gates.

Read docs/compliance.md before describing a finding. CIS checks and local policy checks have distinct labels. A finding is not a legal conclusion or proof of system compliance. The operator chooses applicable standards. Source imports retain historical outcomes without trusting them as current decisions. Read docs/replace-conductorone.md and inspect actual headings first.

Local PGlite supports one process at a time. DATABASE_URL selects Postgres. Tables are in the private access schema with no public grants. This is an owner-operated database, not a multi-user permission boundary. Actor names are assertions, not authentication. A shared deployment requires authenticated operators, least-privilege roles and private evidence storage. Do not expose the owner database connection as an API.

Never send messages, change account access in another system, publish, or handle credentials. Keep business files in ignored imports/, exports/, drafts/, views/ and docs-out/. Keep evidence out of fixtures/. Tests use a temporary database. TEST_DATABASE_URL must be fresh and disposable. Run npm test after changes. Apply changes through forward migrations and test backups before production migration.

Omni by Enterprise DNA builds and runs your version: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=conductorone&utm_medium=instructions
