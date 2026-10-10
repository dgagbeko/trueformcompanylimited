"use client";
import { useFormAction } from "@/components/useFormAction";
import type { FormState } from "@/app/(site)/actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string; defaultValue?: string; required?: boolean; hint?: string };

/** Generic form bound to a server action, showing its error/success message. */
export function ActionForm({
  action,
  fields,
  submit,
  hidden,
  hideOnSuccess,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  submit: string;
  hidden?: Record<string, string>;
  hideOnSuccess?: boolean;
}) {
  const [state, onSubmit, pending] = useFormAction(action);
  if (hideOnSuccess && state?.ok) return <p className="alert alert-ok" role="status">{state.ok}</p>;
  return (
    <form onSubmit={onSubmit} className="stack">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div className="field" key={f.name}>
          <label htmlFor={f.name}>{f.label}</label>
          {f.type === "textarea" ? (
            <textarea id={f.name} name={f.name} defaultValue={f.defaultValue} required={f.required ?? true} />
          ) : (
            <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} defaultValue={f.defaultValue} required={f.required ?? true} />
          )}
          {f.hint && <span className="hint">{f.hint}</span>}
        </div>
      ))}
      {state?.error && <p className="alert alert-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="alert alert-ok" role="status">{state.ok}</p>}
      <button className="btn btn-gold" disabled={pending}>{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
