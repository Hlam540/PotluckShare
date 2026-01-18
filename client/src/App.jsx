import React, { useEffect, useMemo, useState } from "react";

const apiBase = "/api";

const getEventIdFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "event" && parts[1]) {
    return parts[1];
  }
  return null;
};

const uid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const emptyEvent = {
  id: "",
  name: "",
  categories: []
};

export default function App() {
  const [eventId, setEventId] = useState(getEventIdFromPath());
  const [event, setEvent] = useState(emptyEvent);
  const [loading, setLoading] = useState(Boolean(eventId));
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [eventNameInput, setEventNameInput] = useState("");
  const [renameInput, setRenameInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [itemDrafts, setItemDrafts] = useState({});

  useEffect(() => {
    const handlePopState = () => {
      setEventId(getEventIdFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!eventId) {
      setEvent(emptyEvent);
      setLoading(false);
      setError("");
      return;
    }
    loadEvent(eventId);
  }, [eventId]);

  const totalItems = useMemo(() => {
    if (!event?.categories?.length) return 0;
    return event.categories.reduce((sum, category) => sum + category.items.length, 0);
  }, [event]);

  const loadEvent = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/events/${id}`);
      if (!res.ok) {
        throw new Error("Event not found");
      }
      const data = await res.json();
      setEvent(data);
      setRenameInput(data.name ?? "");
    } catch (err) {
      setError("We could not load this event. Check the link or create a new one.");
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!eventNameInput.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: eventNameInput.trim() })
      });
      if (!res.ok) throw new Error("Failed to create event");
      const data = await res.json();
      navigateToEvent(data.id);
      setEvent(data);
      setRenameInput(data.name ?? "");
      setEventNameInput("");
    } catch (err) {
      setError("Something went wrong creating the event.");
    } finally {
      setCreating(false);
    }
  };

  const navigateToEvent = (id) => {
    window.history.pushState({}, "", `/event/${id}`);
    setEventId(id);
  };

  const saveEvent = async (nextEvent) => {
    setEvent(nextEvent);
    setError("");
    try {
      const res = await fetch(`${apiBase}/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextEvent)
      });
      if (!res.ok) throw new Error("Failed to update event");
      const data = await res.json();
      setEvent(data);
      return data;
    } catch (err) {
      setError("Changes could not be saved. Try again.");
      return nextEvent;
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameInput.trim()) return;
    await saveEvent({ ...event, name: renameInput.trim() });
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;
    const newCategory = { id: uid(), name: categoryInput.trim(), items: [] };
    setCategoryInput("");
    await saveEvent({ ...event, categories: [...event.categories, newCategory] });
  };

  const removeCategory = async (categoryId) => {
    const next = event.categories.filter((category) => category.id !== categoryId);
    await saveEvent({ ...event, categories: next });
  };

  const updateDraft = (categoryId, field, value) => {
    setItemDrafts((drafts) => ({
      ...drafts,
      [categoryId]: { ...drafts[categoryId], [field]: value }
    }));
  };

  const addItem = async (categoryId, e) => {
    e.preventDefault();
    const draft = itemDrafts[categoryId] || {};
    if (!draft.label?.trim() || !draft.person?.trim()) return;
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: [
          ...category.items,
          { id: uid(), label: draft.label.trim(), person: draft.person.trim() }
        ]
      };
    });
    setItemDrafts((drafts) => ({ ...drafts, [categoryId]: { label: "", person: "" } }));
    await saveEvent({ ...event, categories: nextCategories });
  };

  const removeItem = async (categoryId, itemId) => {
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: category.items.filter((item) => item.id !== itemId)
      };
    });
    await saveEvent({ ...event, categories: nextCategories });
  };

  const copyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copied to clipboard.");
    } catch (err) {
      window.prompt("Copy this link:", link);
    }
  };

  if (!eventId) {
    return (
      <div className="page">
        <header className="hero">
          <p className="eyebrow">PotluckShare</p>
          <h1>One link. One list. Everyone brings something.</h1>
          <p className="subtitle">
            Create a potluck event, share the link, and let your friends add what they will
            bring. No accounts, no friction.
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
          <div className="card">
            <h3>Fast on mobile</h3>
            <p>Simple layout, big touch targets, and clean typography.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="event-header">
        <div>
          <p className="eyebrow">PotluckShare</p>
          <h1>{event?.name || "Loading..."}</h1>
          <p className="subtitle">
            {totalItems} items claimed so far. Share the link and fill the list.
          </p>
        </div>
        <div className="event-actions">
          <button className="button" type="button" onClick={copyLink}>
            Copy link
          </button>
        </div>
      </header>

      {loading && <p className="status">Loading event...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <>
          <section className="panel">
            <div className="panel-row">
              <div>
                <h2>Edit event name</h2>
                <p className="muted">Everyone can update the title for this potluck.</p>
              </div>
              <form className="form-inline" onSubmit={handleRename}>
                <input
                  className="input"
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                />
                <button className="button button-primary" type="submit">
                  Save
                </button>
              </form>
            </div>
          </section>

          <section className="panel">
            <div className="panel-row">
              <div>
                <h2>Categories</h2>
                <p className="muted">Add sections like mains, sides, drinks, or dessert.</p>
              </div>
              <form className="form-inline" onSubmit={addCategory}>
                <input
                  className="input"
                  type="text"
                  placeholder="New category"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
                <button className="button button-primary" type="submit">
                  Add category
                </button>
              </form>
            </div>
          </section>

          <section className="category-grid">
            {event.categories.length === 0 && (
              <div className="empty card">
                <h3>No categories yet</h3>
                <p>Add your first category to start collecting dishes.</p>
              </div>
            )}
            {event.categories.map((category) => {
              const draft = itemDrafts[category.id] || { label: "", person: "" };
              return (
                <div className="card category-card" key={category.id}>
                  <div className="category-header">
                    <h3>{category.name}</h3>
                    <button
                      className="button button-ghost"
                      type="button"
                      onClick={() => removeCategory(category.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <ul className="item-list">
                    {category.items.map((item) => (
                      <li className="item-row" key={item.id}>
                        <div>
                          <p className="item-label">{item.label}</p>
                          <p className="item-person">Bringing: {item.person}</p>
                        </div>
                        <button
                          className="button button-ghost"
                          type="button"
                          onClick={() => removeItem(category.id, item.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    {category.items.length === 0 && (
                      <li className="item-row empty-row">
                        <p>No dishes yet. Be the first to claim one.</p>
                      </li>
                    )}
                  </ul>
                  <form className="item-form" onSubmit={(e) => addItem(category.id, e)}>
                    <input
                      className="input"
                      type="text"
                      placeholder="Dish or item"
                      value={draft.label}
                      onChange={(e) => updateDraft(category.id, "label", e.target.value)}
                    />
                    <input
                      className="input"
                      type="text"
                      placeholder="Your name"
                      value={draft.person}
                      onChange={(e) => updateDraft(category.id, "person", e.target.value)}
                    />
                    <button className="button button-primary" type="submit">
                      Add
                    </button>
                  </form>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
