"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [eventNameInput, setEventNameInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const createEvent = async (e) => {
    e.preventDefault();
    if (!eventNameInput.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: eventNameInput.trim() })
      });
      if (!res.ok) throw new Error("Failed to create event");
      const data = await res.json();
      setEventNameInput("");
      router.push(`/event/${data.id}`);
    } catch (err) {
      setError("Something went wrong creating the event.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">PotluckShare</p>
        <h1>PotluckShare</h1>
        <p className="subtitle">
          Create a potluck event, share the link, and let your friends add what they will bring.
          No accounts, no friction.
        </p>
        <form className="form-inline" onSubmit={createEvent}>
          <input
            className="input"
            type="text"
            placeholder="Event name"
            value={eventNameInput}
            onChange={(e) => setEventNameInput(e.target.value)}
          />
          <button className="button button-primary" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create event"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </header>
      <section className="feature-grid">
        <div className="card">
          <h3>Share the link</h3>
          <p>Everyone uses the same link. Anyone can add or update items.</p>
        </div>
        <div className="card">
          <h3>Organize by category</h3>
          <p>Split the list into mains, sides, drinks, or whatever you need.</p>
        </div>
      </section>
    </div>
  );
}
