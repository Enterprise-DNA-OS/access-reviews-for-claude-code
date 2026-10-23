# Verification on 23 October 2026

Local npm install, npm test and npm run demo passed on Linux with Node 22.23.1 and PGlite. The suite exercised all 35 CLI commands. npm run view and npm run docs produced both read-only snapshots and both document types. Brand lint passed for the README and prose documentation. Demo output was captured directly in docs/demo-runs.json.

The GitHub workflow was created for Windows, Linux and Postgres 16. [The first run](https://github.com/Enterprise-DNA-OS/access-reviews-for-claude-code/actions/runs/39889073580) could not start any job because GitHub reported failed account payments or a spending limit. No Windows or native PostgreSQL pass is claimed. These checks remain configured for a rerun after the account restriction is resolved.

The database uses PostgreSQL syntax supported by PGlite. Native PostgreSQL execution remains a separate, pending verification. Fixtures and captured outputs contain fictional records only.
