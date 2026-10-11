import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { consumeToken, getCurrentUser } from "@/lib/auth";
import { AuthCard } from "@/components/AuthCard";
import { resendVerification } from "../auth-actions";

export const metadata = { title: "Verify your email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; sent?: string }> }) {
  const { token, sent } = await searchParams;
  if (token) {
    const userId = await consumeToken(token, "verify_email");
    if (userId) {
      await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
      return (
        <AuthCard title="Email verified" intro="Thank you — your account is ready. You can now book stays and cars, and send inquiries.">
          <Link className="btn btn-accent" href="/account">Go to my account</Link>
        </AuthCard>
      );
    }
  }
  const user = await getCurrentUser();
  if (user?.emailVerifiedAt) {
    return (
      <AuthCard title="Email already verified">
        <Link className="btn btn-accent" href="/account">Go to my account</Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title={token ? "Link expired" : "Check your email"}
      intro={
        token
          ? "This verification link is invalid or has expired. Request a new one below."
          : `We sent a verification link to ${user?.email ?? "your email address"}. Please click it to activate your account. You need a verified account to book or send inquiries.`
      }
    >
      {sent && <p className="alert alert-ok" role="status">A new link has been sent.</p>}
      {user ? (
        <form action={resendVerification}><button className="btn btn-line">Resend verification email</button></form>
      ) : (
        <Link className="btn btn-line" href="/login?next=/verify-email">Sign in to resend the link</Link>
      )}
    </AuthCard>
  );
}
