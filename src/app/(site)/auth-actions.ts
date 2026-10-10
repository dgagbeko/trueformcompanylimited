"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  consumeToken,
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  issueToken,
  passwordProblem,
  verifyPassword,
} from "@/lib/auth";
import { appUrl, sendEmail } from "@/lib/email";
import type { FormState } from "./actions";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Only allow redirects to local paths after login. */
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/account");

async function sendVerification(userId: string, email: string, name: string) {
  const token = await issueToken(userId, "verify_email");
  await sendEmail(
    email,
    "Verify your email address",
    [`Hello ${name},`, "Welcome to TrueForm Excellence. Please confirm your email address to start booking and sending inquiries.", "This link expires in 48 hours."],
    { label: "Verify my email", url: `${appUrl()}/verify-email?token=${token}` },
  );
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({
      fullName: z.string().min(2, "Please enter your full name.").max(120),
      email: z.email("Please enter a valid email address."),
      phone: z.string().min(6, "Please enter your phone number.").max(30),
      password: z.string(),
    })
    .safeParse({ fullName: str(fd, "fullName"), email: str(fd, "email").toLowerCase(), phone: str(fd, "phone"), password: String(fd.get("password") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const problem = passwordProblem(parsed.data.password);
  if (problem) return { error: problem };
  if (parsed.data.password !== String(fd.get("confirm") ?? "")) return { error: "Passwords do not match." };

  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (existing.length) return { error: "An account with this email already exists. Try signing in instead." };

  const [user] = await db
    .insert(schema.users)
    .values({ fullName: parsed.data.fullName, email: parsed.data.email, phone: parsed.data.phone, passwordHash: await hashPassword(parsed.data.password) })
    .returning();
  await sendVerification(user.id, user.email, user.fullName);
  await createSession(user.id);
  redirect("/verify-email?pending=1");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  // Same message either way so the form does not reveal which emails are registered.
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Incorrect email or password." };
  await createSession(user.id);
  redirect(safeNext(str(fd, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function resendVerification() {
  const user = await getCurrentUser();
  if (user && !user.emailVerifiedAt) await sendVerification(user.id, user.email, user.fullName);
  redirect("/verify-email?pending=1&sent=1");
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (user) {
    const token = await issueToken(user.id, "reset_password");
    await sendEmail(
      user.email,
      "Reset your password",
      [`Hello ${user.fullName},`, "We received a request to reset your password. This link expires in 1 hour.", "If you did not ask for this, you can ignore this email."],
      { label: "Choose a new password", url: `${appUrl()}/reset-password?token=${token}` },
    );
  }
  return { ok: "If an account exists for that email, we have sent a reset link." };
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (password !== String(fd.get("confirm") ?? "")) return { error: "Passwords do not match." };
  const userId = await consumeToken(str(fd, "token"), "reset_password");
  if (!userId) return { error: "This reset link is invalid or has expired. Please request a new one." };
  await db.update(schema.users).set({ passwordHash: await hashPassword(password) }).where(eq(schema.users.id, userId));
  // Sign out every other device, then sign in here.
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await createSession(userId);
  redirect("/account?ok=password-reset");
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const fullName = str(fd, "fullName");
  const phone = str(fd, "phone");
  if (fullName.length < 2 || phone.length < 6) return { error: "Please enter your name and phone number." };
  await db.update(schema.users).set({ fullName, phone }).where(eq(schema.users.id, user.id));

  const newPassword = String(fd.get("newPassword") ?? "");
  if (newPassword) {
    if (!(await verifyPassword(String(fd.get("currentPassword") ?? ""), user.passwordHash))) return { error: "Your current password is incorrect." };
    const problem = passwordProblem(newPassword);
    if (problem) return { error: problem };
    await db.update(schema.users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(schema.users.id, user.id));
  }
  return { ok: "Profile saved." };
}
