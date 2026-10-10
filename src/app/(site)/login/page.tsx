import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ActionForm } from "@/components/AuthForm";
import { login } from "../auth-actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/account" } = await searchParams;
  return (
    <AuthCard title="Sign in" intro={<>New here? <Link href="/register">Create an account</Link></>}>
      <ActionForm
        action={login}
        hidden={{ next }}
        submit="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <Link href="/forgot-password" style={{ fontSize: 14 }}>Forgot your password?</Link>
    </AuthCard>
  );
}
