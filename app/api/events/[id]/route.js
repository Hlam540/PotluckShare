import pool, { ensureSchema } from "@/lib/db";
import { sanitizeEventPayload, toIsoString } from "@/lib/events";

export async function GET(request, { params }) {
  await ensureSchema();
  try {
    const result = await pool.query(
      "SELECT id, name, categories, created_at, updated_at FROM events WHERE id = $1",
      [params.id]
    );
    if (result.rowCount === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    const row = result.rows[0];
    return Response.json({
      id: row.id,
      name: row.name,
      categories: row.categories ?? [],
      createdAt: toIsoString(row.created_at),
      updatedAt: toIsoString(row.updated_at)
    });
  } catch (err) {
    console.error("Failed to load event:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  await ensureSchema();
  const body = await request.json();
  try {
    const existing = await pool.query(
      "SELECT created_at FROM events WHERE id = $1",
      [params.id]
    );
    if (existing.rowCount === 0) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    const { name, categories } = sanitizeEventPayload(body);
    const categoriesJson = JSON.stringify(categories ?? []);
    const updatedAt = new Date();
    await pool.query(
      `UPDATE events
       SET name = $2, categories = $3::jsonb, updated_at = $4
       WHERE id = $1`,
      [params.id, name, categoriesJson, updatedAt]
    );

    return Response.json({
      id: params.id,
      name,
      categories,
      createdAt: toIsoString(existing.rows[0].created_at),
      updatedAt: updatedAt.toISOString()
    });
  } catch (err) {
    console.error("Failed to update event:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
