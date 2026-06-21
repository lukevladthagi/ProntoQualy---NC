# Previous-Step Best-Effort Repair Checklist

Pass 09 is non-deterministic and must not block the migration, but it is
allowed to opportunistically repair issues left by deterministic passes 01-08
before the app reaches the user.

Treat this file as a checklist, not as a reason to stop route conversion.
Fix what is clear and low-risk. Leave notes for anything ambiguous.

## Earlier Pass Notes

- tailwind.config: Unknown theme namespace "keyframes" — skipped. v4 may not support it as a @theme key.
- tailwind.config: Unknown theme namespace "animation" — skipped. v4 may not support it as a @theme key.
- tailwind.config: Config has 1 plugin(s) — these aren't ported automatically. Common Tailwind v3 plugins (typography, forms, container-queries, aspect-ratio) ship as v4-compatible packages; add them as @plugin directives in global.css.
- rewrite-routes: emitted 7 app/ route shells.
- strip-mocha-build: merged 2 runtime dep(s) from user package.json; pinned 1 dep(s); normalized 0 dep range(s); sanitized 0 malformed dep descriptor(s); dropped 0 unparseable dep descriptor(s).
- rewrite-imports: rewrote 38 file(s).
- sqlite-to-pg: 16 tables, 13 indexes, 21 inserts; skipped 5 _mocha_migrations rows.
- asset-rewrite: 0 file(s) updated; 0 per-url + 0 base-host substitution(s); old=https://unknown.mochausercontent.com/ new=https://dtvoeevhaseb5.cloudfront.net/uploads/mocha-import/a6a84538-8a7b-475c-9c60-de5df7bb6adf/
- seed-users: 0 users in export.

## Best-Effort Checks

- Run `yarn workspace web typecheck` and fix clear TypeScript errors in
  generated app files under `apps/web/src/**`. Do not spend time on
  `apps/web/legacy/**` reference files.
- If typecheck/build reports missing modules, scan the app for imports and
  add or rewrite the dependency only when the usage is real.
- Inspect `apps/web/db/init.sql` and `apps/web/db/data.sql` for obvious
  SQLite syntax that would fail in Postgres, such as `AUTOINCREMENT`,
  trigger `BEGIN ... END` bodies, SQLite-only functions, or invalid
  transaction fragments.
- If a `DATABASE_URL` is available, you may run the mocha-import apply-db
  command against the generated output and fix clear SQL errors. If no
  database is available, perform static SQL cleanup only.
- Keep all repairs conservative: preserve migrated data and user-visible
  behavior, avoid broad rewrites, and prefer adding a note over guessing.
