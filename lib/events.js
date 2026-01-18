export const createId = () =>
  `${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-4)}`;

export const sanitizeEventPayload = (payload) => {
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

export const toIsoString = (value) => {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
};
