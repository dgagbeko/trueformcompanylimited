"use client";
import { useFormAction } from "@/components/useFormAction";
import { modifyMyBooking, type FormState } from "@/app/(site)/actions";

export function ModifyBooking({ id, start, end, today }: { id: string; start: string; end: string; today: string }) {
  const [state, onSubmit, pending] = useFormAction(modifyMyBooking);
  return (
    <details>
      <summary className="btn btn-line btn-sm" style={{ display: "inline-flex" }}>Change dates</summary>
      <form onSubmit={onSubmit} className="row" style={{ marginTop: 12, alignItems: "flex-end" }}>
        <input type="hidden" name="id" value={id} />
        <div className="field" style={{ flexBasis: 150 }}><label htmlFor={`s-${id}`}>From</label><input id={`s-${id}`} name="start" type="date" min={today} defaultValue={start} required /></div>
        <div className="field" style={{ flexBasis: 150 }}><label htmlFor={`e-${id}`}>To</label><input id={`e-${id}`} name="end" type="date" min={today} defaultValue={end} required /></div>
        <button className="btn btn-ink btn-sm" disabled={pending}>{pending ? "Saving…" : "Save dates"}</button>
        {state?.error && <p className="alert alert-error" role="alert" style={{ flexBasis: "100%" }}>{state.error}</p>}
        {state?.ok && <p className="alert alert-ok" role="status" style={{ flexBasis: "100%" }}>{state.ok}</p>}
      </form>
    </details>
  );
}
