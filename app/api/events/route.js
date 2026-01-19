import pool, { ensureSchema } from "@/lib/db";
import { createId, sanitizeEventPayload } from "@/lib/events";

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const { name, categories } = sanitizeEventPayload({
    name: body?.name,
    categories: []
  });
  const categoriesJson = JSON.stringify(categories ?? []);
  const id = createId();
  const now = new Date();

  try {
    await pool.query(
      `INSERT INTO events (id, name, categories, created_at, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [id, name, categoriesJson, now, now]
    );
    return Response.json(
      {
        id,
        name,
        categories,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create event:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
