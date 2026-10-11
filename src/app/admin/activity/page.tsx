import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export default async function AdminActivity() {
  const rows = await db
    .select({ a: schema.auditLog, name: schema.users.fullName })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.auditLog.userId, schema.users.id))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(300);
  return (
    <>
      <h1 className="display" style={{ fontSize: 32 }}>Activity log</h1>
      <section className="box table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Item</th></tr></thead>
          <tbody>
            {rows.map(({ a, name }) => (
              <tr key={a.id}>
                <td style={{ whiteSpace: "nowrap" }}>{a.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Accra" })}</td>
                <td>{name ?? "—"}</td>
                <td>{a.action}</td>
                <td className="muted">{a.entity}{a.entityId ? ` ${a.entityId.slice(0, 8)}` : ""}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="muted">No activity yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
