import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { ActionForm } from "@/components/AuthForm";
import { register } from "../auth-actions";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard title="Create your account" intro={<>Already registered? <Link href="/login">Sign in</Link></>}>
      <ActionForm
        action={register}
        submit="Create account"
        fields={[
          { name: "fullName", label: "Full name", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 8 characters, with a letter and a number." },
          { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
      />
      <span className="hint">By creating an account you agree to our <Link href="/terms">terms</Link> and <Link href="/privacy">privacy policy</Link>.</span>
    </AuthCard>
  );
}
