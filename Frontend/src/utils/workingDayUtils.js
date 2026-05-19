export const JS_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Map stored working day (name, number, or numeric string) to JS getDay() index (0 = Sunday). */
export const parseWorkingDayToIndex = (value) => {
  if (typeof value === "number" && value >= 0 && value <= 6) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const index = Number(trimmed);
      return index >= 0 && index <= 6 ? index : null;
    }

    const lower = trimmed.toLowerCase();
    const exactIndex = JS_DAY_NAMES.findIndex((name) => name.toLowerCase() === lower);
    if (exactIndex >= 0) return exactIndex;

    const shortIndex = JS_DAY_NAMES.findIndex((name) =>
      name.toLowerCase().startsWith(lower.slice(0, 3))
    );
    if (shortIndex >= 0) return shortIndex;
  }

  return null;
};

export const isWorkingDay = (workingDays, dayOfWeek) => {
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    return true;
  }

  return workingDays.some((day) => parseWorkingDayToIndex(day) === dayOfWeek);
};

export const formatLocalDateStr = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDateStr = (dateStr) => {
  if (!dateStr) {
    return new Date();
  }

  const [year, month, day] = String(dateStr).split("-").map(Number);
  return new Date(year, month - 1, day);
};
