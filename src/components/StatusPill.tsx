const MAP: Record<string, [string, string]> = {
  pending_payment: ["Payment pending", "pill-warn"],
  confirmed: ["Confirmed", "pill-ok"],
  cancelled: ["Cancelled", "pill-grey"],
  completed: ["Completed", "pill-info"],
  new: ["New", "pill-info"],
  in_discussion: ["In discussion", "pill-info"],
  deposit_paid: ["Deposit paid", "pill-ok"],
  closed: ["Closed", "pill-grey"],
  quoted: ["Quoted", "pill-ok"],
  pending: ["Pending", "pill-warn"],
  success: ["Paid", "pill-ok"],
  failed: ["Failed", "pill-bad"],
  refunded: ["Refunded", "pill-grey"],
  draft: ["Draft", "pill-grey"],
  published: ["Published", "pill-ok"],
  unavailable: ["Unavailable", "pill-grey"],
  reserved: ["Reserved", "pill-warn"],
  sold: ["Sold", "pill-bad"],
};

export function StatusPill({ status }: { status: string }) {
  const [label, cls] = MAP[status] ?? [status, "pill-grey"];
  return <span className={`pill ${cls}`}>{label}</span>;
}
