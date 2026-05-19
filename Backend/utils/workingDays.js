export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Normalize admin/customer input to full weekday names (Sunday = index 0). */
export const normalizeWorkingDaysToNames = (arr) => {
  if (!Array.isArray(arr)) return [];

  const normalized = arr
    .map((d) => {
      if (typeof d === "number") {
        return DAY_NAMES[d] || null;
      }

      if (typeof d === "string") {
        const trimmed = d.trim();
        if (/^\d+$/.test(trimmed)) {
          const idx = Number(trimmed);
          return DAY_NAMES[idx] || null;
        }

        const lower = trimmed.toLowerCase();
        const exact = DAY_NAMES.find((n) => n.toLowerCase() === lower);
        if (exact) return exact;

        const short = DAY_NAMES.find((n) =>
          n.toLowerCase().startsWith(lower.slice(0, 3))
        );
        if (short) return short;

        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      }

      return null;
    })
    .filter(Boolean);

  return Array.from(new Set(normalized));
};
