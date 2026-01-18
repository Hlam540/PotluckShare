import express from "express";
import cors from "cors";
import { Pool } from "pg";

const app = express();
app.use(cors());
app.use(express.json({ limit: "200kb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const createId = () =>
  `${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;

const sanitizeEventPayload = (payload) => {
  const name =
    typeof payload?.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : "Untitled Potluck";
  const categories = Array.isArray(payload?.categories)
    ? payload.categories.map((category) => ({
        id: typeof category?.id === "string" ? category.id : createId(),
        name:
          typeof category?.name === "string" && category.name.trim()
            ? category.name.trim()
            : "Category",
        items: Array.isArray(category?.items)
          ? category.items.map((item) => ({
              id: typeof item?.id === "string" ? item.id : createId(),
              label:
                typeof item?.label === "string" && item.label.trim()
                  ? item.label.trim()
                  : "Item",
              person:
                typeof item?.person === "string" && item.person.trim()
                  ? item.person.trim()
                  : "Someone"
            }))
          : []
      }))
    : [];

  return { name, categories };
};

const toIsoString = (value) => {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
};

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categories JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);
};

const handleServerError = (res, err) => {
  console.error("PotluckShare API error:", err);
  res.status(500).json({ error: "Server error" });
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/events", async (req, res) => {
  const id = createId();
  const { name, categories } = sanitizeEventPayload({
    name: req.body?.name,
    categories: []
  });
  const now = new Date();
  try {
    await pool.query(
      `INSERT INTO events (id, name, categories, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, categories, now, now]
    );
    res.status(201).json({
      id,
      name,
      categories,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, categories, created_at, updated_at FROM events WHERE id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      categories: row.categories ?? [],
      createdAt: toIsoString(row.created_at),
      updatedAt: toIsoString(row.updated_at)
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

app.put("/api/events/:id", async (req, res) => {
  try {
    const existing = await pool.query(
      "SELECT created_at FROM events WHERE id = $1",
      [req.params.id]
    );
    if (existing.rowCount === 0) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const { name, categories } = sanitizeEventPayload(req.body);
    const updatedAt = new Date();
    await pool.query(
      `UPDATE events
       SET name = $2, categories = $3, updated_at = $4
       WHERE id = $1`,
      [req.params.id, name, categories, updatedAt]
    );

    res.json({
      id: req.params.id,
      name,
      categories,
      createdAt: toIsoString(existing.rows[0].created_at),
      updatedAt: updatedAt.toISOString()
    });
  } catch (err) {
    handleServerError(res, err);
  }
});

const port = process.env.PORT || 3001;
initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`PotluckShare API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
