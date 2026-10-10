import { AuthCard } from "@/components/AuthCard";
import { ActionForm } from "@/components/AuthForm";
import { resetPassword } from "../auth-actions";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <AuthCard title="Choose a new password">
      <ActionForm
        action={resetPassword}
        hidden={{ token }}
        submit="Save new password"
        fields={[
          { name: "password", label: "New password", type: "password", autoComplete: "new-password", hint: "At least 8 characters, with a letter and a number." },
          { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
        ]}
      />
    </AuthCard>
  );
}
