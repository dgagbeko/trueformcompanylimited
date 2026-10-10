/**
 * Create the first admin account (or promote an existing account):
 *   npm run admin:create -- "Full Name" email@example.com "+233 24 000 0000" "StrongPassw0rd"
 */
import "dotenv/config";
import postgres from "postgres";
import bcrypt from "bcryptjs";

async function main() {
  const [fullName, email, phone, password] = process.argv.slice(2);
  if (!fullName || !email || !phone || !password) {
    console.error('Usage: npm run admin:create -- "Full Name" email@example.com "+233..." "Password1"');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const hash = await bcrypt.hash(password, 12);
  await sql`
    insert into users (full_name, email, phone, password_hash, role, email_verified_at)
    values (${fullName}, ${email.toLowerCase()}, ${phone}, ${hash}, 'admin', now())
    on conflict (email) do update set role = 'admin', email_verified_at = coalesce(users.email_verified_at, now())`;
  console.log(`Admin ready: ${email.toLowerCase()} — sign in at /login, then open /admin`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
