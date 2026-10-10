import { db, schema } from "@/db";

export async function audit(userId: string | null, action: string, entity: string, entityId?: string) {
  await db.insert(schema.auditLog).values({ userId, action, entity, entityId: entityId ?? null });
}
