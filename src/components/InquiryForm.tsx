"use client";
import { useFormAction } from "@/components/useFormAction";
import { sendInquiry, type FormState } from "@/app/(site)/actions";

export function InquiryForm({ listingId, slug, phone }: { listingId: string; slug: string; phone: string }) {
  const [state, onSubmit, pending] = useFormAction(sendInquiry);
  if (state?.ok) return <p className="alert alert-ok" role="status">{state.ok}</p>;
  return (
    <form onSubmit={onSubmit} className="stack">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" defaultValue={phone} required /></div>
      <div className="field"><label htmlFor="message">Message</label><textarea id="message" name="message" required defaultValue="I would like to arrange a site visit." /></div>
      {state?.error && <p className="alert alert-error" role="alert">{state.error}</p>}
      <button className="btn btn-ink" disabled={pending}>{pending ? "Sending…" : "Send inquiry"}</button>
    </form>
  );
}
