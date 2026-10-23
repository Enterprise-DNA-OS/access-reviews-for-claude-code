# Make it yours

Read CLAUDE.md, the migration and docs/compliance.md. Translate the requested field or rule into a numbered forward migration under supabase/migrations. Preserve existing decisions and imported payloads. Update the CLI, documents, views and relevant regression tests. Apply it to a temporary seeded database, run npm test, then migrate the operator database after recording a backup location. Explain changed rules and their source. Never weaken a control merely to get a decision through.
