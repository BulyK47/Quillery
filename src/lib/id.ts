// Collision-free id generator. Date.now() alone collides when two items are
// created in the same millisecond (duplicate + create, rapid actions, etc.),
// which breaks React keys and merge-by-id. randomUUID where available, with a
// time+random fallback for any non-secure context.
export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
