import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { setUserRole } from "../actions";

export default async function AdminUsers() {
  const me = await requireAdmin();
  const rows = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(500);
  return (
    <>
      <h1 className="display" style={{ fontSize: 32 }}>Customers &amp; admins</h1>
      <p className="muted">To add a staff member, ask them to create a normal account on the website, then make them an admin here.</p>
      <section className="box table-wrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Verified</th><th>Joined</th><th>Role</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.emailVerifiedAt ? "Yes" : <span className="muted">No</span>}</td>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(u.createdAt)}</td>
                <td>
                  {u.id === me.id ? <span className="pill pill-info">Admin (you)</span> : (
                    <form action={setUserRole} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <input type="hidden" name="id" value={u.id} />
                      <span className={`pill ${u.role === "admin" ? "pill-info" : "pill-grey"}`}>{u.role}</span>
                      <button name="role" value={u.role === "admin" ? "customer" : "admin"} className="btn btn-line btn-sm">{u.role === "admin" ? "Remove admin" : "Make admin"}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
