"use client";
import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/app/(site)/actions";

/**
 * Like useActionState, but submits via onSubmit so React does not reset the form
 * afterwards — what people typed stays in place when there is an error, and
 * edit forms keep showing the saved values.
 */
export function useFormAction(action: (s: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(action, undefined);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
