import { ActionForm } from "@/components/AuthForm";
import { getSettings } from "@/lib/settings";
import { sendContact } from "../actions";

export const metadata = { title: "Contact us" };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="wrap with-aside" style={{ padding: "56px 24px 88px" }}>
      <div className="main stack">
        <h1 className="serif" style={{ fontSize: 40 }}>Contact us</h1>
        <p className="muted" style={{ lineHeight: 1.6 }}>Questions about a booking, a property or insurance? Send us a message and our team will respond.</p>
        <div className="stack" style={{ gap: 8 }}>
          {s.supportPhone && <span><b>Phone:</b> <a href={`tel:${s.supportPhone.replace(/\s/g, "")}`}>{s.supportPhone}</a></span>}
          {s.supportEmail && <span><b>Email:</b> <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a></span>}
          {s.officeAddress && <span><b>Office:</b> {s.officeAddress}</span>}
        </div>
      </div>
      <div className="aside panel">
        <ActionForm
          action={sendContact}
          submit="Send message"
          hideOnSuccess
          fields={[
            { name: "name", label: "Your name" },
            { name: "email", label: "Email", type: "email" },
            { name: "message", label: "Message", type: "textarea" },
          ]}
        />
      </div>
    </div>
  );
}
