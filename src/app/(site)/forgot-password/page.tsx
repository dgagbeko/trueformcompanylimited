import { AuthCard } from "@/components/AuthCard";
import { ActionForm } from "@/components/AuthForm";
import { forgotPassword } from "../auth-actions";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <AuthCard title="Reset your password" intro="Enter your account email and we will send you a secure reset link.">
      <ActionForm action={forgotPassword} submit="Send reset link" hideOnSuccess fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]} />
    </AuthCard>
  );
}
