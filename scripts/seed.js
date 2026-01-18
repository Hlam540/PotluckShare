import pool, { ensureSchema } from "../lib/db.js";
import { createId } from "../lib/events.js";

const seed = async () => {
  await ensureSchema();
  const id = createId();
  const now = new Date();
  const sample = [
    {
      id: createId(),
      name: "Mains",
      items: [
        { id: createId(), label: "BBQ sliders", person: "Kevin" },
        { id: createId(), label: "Veggie skewers", person: "Lina" }
      ]
    },
    {
      id: createId(),
      name: "Sides",
      items: [
        { id: createId(), label: "Pasta salad", person: "Ari" },
        { id: createId(), label: "Fruit tray", person: "Sam" }
      ]
    },
    {
      id: createId(),
      name: "Drinks",
      items: [{ id: createId(), label: "Sparkling water", person: "Jo" }]
    },
    {
      id: createId(),
      name: "Dessert",
      items: [{ id: createId(), label: "Brownies", person: "Mina" }]
    }
  ];

  await pool.query(
    `INSERT INTO events (id, name, categories, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, "Potluck Night", sample, now, now]
  );

  console.log("Seeded event:", id);
};

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
