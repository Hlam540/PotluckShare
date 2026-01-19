"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const emptyEvent = {
  id: "",
  name: "",
  categories: []
};

const uid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export default function EventPage() {
  const params = useParams();
  const eventId = params?.id;
  const [event, setEvent] = useState(emptyEvent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renameInput, setRenameInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [itemDrafts, setItemDrafts] = useState({});
  const [claimDrafts, setClaimDrafts] = useState({});
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [personDraft, setPersonDraft] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemLabelDraft, setItemLabelDraft] = useState("");

  useEffect(() => {
    if (!eventId) return;
    loadEvent(eventId);
  }, [eventId]);

  const totalItems = useMemo(() => {
    if (!event?.categories?.length) return 0;
    return event.categories.reduce((sum, category) => sum + category.items.length, 0);
  }, [event]);

  const unclaimedItems = useMemo(() => {
    if (!event?.categories?.length) return 0;
    return event.categories.reduce(
      (sum, category) =>
        sum + category.items.filter((item) => !item.person?.trim()).length,
      0
    );
  }, [event]);

  const loadEvent = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        throw new Error("Event not found");
      }
      const data = await res.json();
      const normalized = {
        ...data,
        categories: Array.isArray(data?.categories) ? data.categories : []
      };
      setEvent(normalized);
      setRenameInput(normalized.name ?? "");
      setEditingTitle(false);
    } catch (err) {
      setError("We could not load this event. Check the link or create a new one.");
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async (nextEvent) => {
    setEvent(nextEvent);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
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
    setEditingTitle(false);
  };

  const cancelRename = () => {
    setRenameInput(event?.name ?? "");
    setEditingTitle(false);
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;
    const newCategory = { id: uid(), name: categoryInput.trim(), items: [] };
    setCategoryInput("");
    await saveEvent({ ...event, categories: [...event.categories, newCategory] });
  };

  const removeCategory = async (categoryId) => {
    if (!window.confirm("Remove this category and all of its items?")) return;
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
    if (!draft.label?.trim()) return;
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: [
          ...category.items,
          {
            id: uid(),
            label: draft.label.trim(),
            person: draft.person?.trim() ?? ""
          }
        ]
      };
    });
    setItemDrafts((drafts) => ({ ...drafts, [categoryId]: { label: "", person: "" } }));
    await saveEvent({ ...event, categories: nextCategories });
  };

  const removeItem = async (categoryId, itemId) => {
    if (!window.confirm("Remove this item?")) return;
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: category.items.filter((item) => item.id !== itemId)
      };
    });
    await saveEvent({ ...event, categories: nextCategories });
  };

  const updateClaimDraft = (itemId, value) => {
    setClaimDrafts((drafts) => ({ ...drafts, [itemId]: value }));
  };

  const claimItem = async (categoryId, itemId, e) => {
    e.preventDefault();
    const name = claimDrafts[itemId]?.trim();
    if (!name) return;
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, person: name } : item
        )
      };
    });
    setClaimDrafts((drafts) => ({ ...drafts, [itemId]: "" }));
    await saveEvent({ ...event, categories: nextCategories });
  };

  const startEditPerson = (item) => {
    setEditingPersonId(item.id);
    setPersonDraft(item.person ?? "");
  };

  const cancelEditPerson = () => {
    setEditingPersonId(null);
    setPersonDraft("");
  };

  const savePerson = async (categoryId, itemId, e) => {
    e.preventDefault();
    const nextName = personDraft?.trim() ?? "";
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, person: nextName } : item
        )
      };
    });
    setEditingPersonId(null);
    setPersonDraft("");
    await saveEvent({ ...event, categories: nextCategories });
  };

  const startEditItemLabel = (item) => {
    setEditingItemId(item.id);
    setItemLabelDraft(item.label ?? "");
  };

  const cancelEditItemLabel = () => {
    setEditingItemId(null);
    setItemLabelDraft("");
  };

  const saveItemLabel = async (categoryId, itemId, e) => {
    e.preventDefault();
    if (!itemLabelDraft.trim()) return;
    const nextCategories = event.categories.map((category) => {
      if (category.id !== categoryId) return category;
      return {
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, label: itemLabelDraft.trim() } : item
        )
      };
    });
    setEditingItemId(null);
    setItemLabelDraft("");
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

  return (
    <div className="page">
      <header className="event-header">
        <div>
          <p className="eyebrow">PotluckShare</p>
          {editingTitle ? (
            <form className="title-edit" onSubmit={handleRename}>
              <input
                className="input title-input"
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                autoFocus
              />
              <div className="title-actions">
                <button className="button button-primary" type="submit">
                  Save
                </button>
                <button className="button button-ghost" type="button" onClick={cancelRename}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              className="title-button"
              type="button"
              onClick={() => setEditingTitle(true)}
            >
              <h1>{event?.name || "Loading..."}</h1>
              <span className="title-hint">Click to edit</span>
            </button>
          )}
          <p className="subtitle">
            {unclaimedItems} items not claimed yet. Share the link and fill the list.
          </p>
        </div>
        <div className="event-actions">
          <Link className="button button-ghost" href="/">
            Create new event
          </Link>
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
                        <div className="item-info">
                          {editingItemId === item.id ? (
                            <form
                              className="claim-form"
                              onSubmit={(e) => saveItemLabel(category.id, item.id, e)}
                            >
                              <input
                                className="input input-compact"
                                type="text"
                                placeholder="Dish name"
                                value={itemLabelDraft}
                                onChange={(e) => setItemLabelDraft(e.target.value)}
                                autoFocus
                              />
                              <button className="button button-primary" type="submit">
                                Save
                              </button>
                              <button
                                className="button button-ghost"
                                type="button"
                                onClick={cancelEditItemLabel}
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <button
                              className="label-button"
                              type="button"
                              onClick={() => startEditItemLabel(item)}
                            >
                              <span className="item-label">{item.label}</span>
                              <span className="label-hint">Click to edit</span>
                            </button>
                          )}
                          {item.person?.trim() ? (
                            editingPersonId === item.id ? (
                              <form
                                className="claim-form"
                                onSubmit={(e) => savePerson(category.id, item.id, e)}
                              >
                                <input
                                  className="input input-compact"
                                  type="text"
                                  placeholder="Your name"
                                  value={personDraft}
                                  onChange={(e) => setPersonDraft(e.target.value)}
                                  autoFocus
                                />
                                <button className="button button-primary" type="submit">
                                  Save
                                </button>
                                <button
                                  className="button button-ghost"
                                  type="button"
                                  onClick={cancelEditPerson}
                                >
                                  Cancel
                                </button>
                              </form>
                            ) : (
                              <button
                                className="person-button"
                                type="button"
                                onClick={() => startEditPerson(item)}
                              >
                                <span className="item-person">Bringer: {item.person}</span>
                                <span className="person-hint">Click to edit</span>
                              </button>
                            )
                          ) : (
                            <form
                              className="claim-form"
                              onSubmit={(e) => claimItem(category.id, item.id, e)}
                            >
                              <input
                                className="input input-compact"
                                type="text"
                                placeholder="Claim with name"
                                value={claimDrafts[item.id] ?? ""}
                                onChange={(e) => updateClaimDraft(item.id, e.target.value)}
                              />
                              <button className="button button-primary" type="submit">
                                Claim
                              </button>
                            </form>
                          )}
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
                      placeholder="Name (optional)"
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
