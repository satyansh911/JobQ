/**
 * Rewrite the host in locally-stored upload URLs.
 *
 * The local-disk storage driver saves an ABSOLUTE url (`${SELF_URL}/uploads/x`)
 * into the database at upload time. Move the stack to a different host and
 * every one of those rows still points at the old one, so logos, avatars and
 * résumés 404 even though the files are present.
 *
 * Cloudinary-hosted rows are untouched — their URLs are already absolute and
 * correct wherever the app runs.
 *
 *   node scripts/rebase-upload-urls.mjs <old-origin> <new-origin>
 *   node scripts/rebase-upload-urls.mjs http://localhost:5001 http://16.4.10.59:5001
 *
 * Add --dry-run to see the counts without writing.
 *
 * The real fix is to store a relative path and resolve it at render time;
 * this script exists because the rows already in the database are absolute.
 */
import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2).filter((a) => a !== "--dry-run");
const [oldOrigin, newOrigin = ""] = args;
const dryRun = process.argv.includes("--dry-run");

// An empty new origin is meaningful: it makes the stored URLs relative
// (/uploads/x), which is what a proxying frontend needs.
if (!oldOrigin || args.length < 2) {
  console.error("usage: node scripts/rebase-upload-urls.mjs <old-origin> <new-origin> [--dry-run]");
  console.error('pass "" as <new-origin> to make the URLs relative');
  process.exit(1);
}
if (!process.env.DB_URL) {
  console.error("DB_URL is not set. Source it from one of the services' .env files.");
  process.exit(1);
}

const sql = neon(process.env.DB_URL);

// column -> table, for every place an upload URL can land
const TARGETS = [
  ["companies", "logo"],
  ["users", "profile_pic"],
  ["users", "resume"],
  ["applications", "resume"],
];

const pattern = `${oldOrigin}/uploads/%`;
let total = 0;

for (const [table, column] of TARGETS) {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM ${sql.unsafe(table)}
    WHERE ${sql.unsafe(column)} LIKE ${pattern}
  `;

  if (count === 0) {
    console.log(`  ${table}.${column}: nothing to do`);
    continue;
  }

  if (dryRun) {
    console.log(`  ${table}.${column}: ${count} row(s) would change`);
  } else {
    await sql`
      UPDATE ${sql.unsafe(table)}
      SET ${sql.unsafe(column)} = REPLACE(${sql.unsafe(column)}, ${oldOrigin}, ${newOrigin})
      WHERE ${sql.unsafe(column)} LIKE ${pattern}
    `;
    console.log(`  ${table}.${column}: ${count} row(s) rewritten`);
  }
  total += count;
}

console.log(
  dryRun
    ? `\n${total} row(s) would be rewritten. Re-run without --dry-run to apply.`
    : `\n${total} row(s) rewritten: ${oldOrigin} -> ${newOrigin || "(relative)"}`
);
