import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";

const SESSION_COOKIE = "tf_session";
const SESSION_DAYS = 30;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Minimum strength: 8+ characters with at least one letter and one number. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "Password must contain at least one letter and one number.";
  return null;
}

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
});

export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireVerifiedUser(next = "/account") {
  const user = await requireUser(next);
  if (!user.emailVerifiedAt) redirect("/verify-email?pending=1");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}

/** Issue a single-use emailed token (verification or password reset). Returns the raw token. */
export async function issueToken(userId: string, type: "verify_email" | "reset_password") {
  const token = newToken();
  const hours = type === "verify_email" ? 48 : 1;
  await db.insert(schema.authTokens).values({
    id: sha256(token),
    userId,
    type,
    expiresAt: new Date(Date.now() + hours * 3_600_000),
  });
  return token;
}

/** Consume a token; returns the user id when it is valid, unused and unexpired. */
export async function consumeToken(token: string, type: "verify_email" | "reset_password") {
  const [row] = await db
    .update(schema.authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.authTokens.id, sha256(token)),
        eq(schema.authTokens.type, type),
        isNull(schema.authTokens.usedAt),
        gt(schema.authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: schema.authTokens.userId });
  return row?.userId ?? null;
}
