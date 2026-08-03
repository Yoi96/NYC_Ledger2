export function parseDateComponents(dateStr?: string): { year: string; month: string; day: string } {
  if (!dateStr) return { year: "", month: "", day: "" };

  const cleanStr = dateStr.split("T")[0].trim();

  // Check if hyphen formatted (e.g. YYYY-MM-DD or MM-DD-YYYY or M-D-YY)
  if (cleanStr.includes("-")) {
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return {
          year: parts[0],
          month: parts[1].padStart(2, "0"),
          day: parts[2].padStart(2, "0"),
        };
      } else if (parts[2].length === 4) {
        // MM-DD-YYYY
        return {
          year: parts[2],
          month: parts[0].padStart(2, "0"),
          day: parts[1].padStart(2, "0"),
        };
      } else if (parts[2].length <= 2) {
        // MM-DD-YY
        let yr = parseInt(parts[2], 10);
        if (!isNaN(yr)) {
          yr = yr < 100 ? (yr > 50 ? 1900 + yr : 2000 + yr) : yr;
          return {
            year: yr.toString(),
            month: parts[0].padStart(2, "0"),
            day: parts[1].padStart(2, "0"),
          };
        }
      }
    }
  }

  // Check if slash formatted (e.g. MM/DD/YYYY or YYYY/MM/DD or M/D/YY)
  if (cleanStr.includes("/")) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        // MM/DD/YYYY
        return {
          year: parts[2],
          month: parts[0].padStart(2, "0"),
          day: parts[1].padStart(2, "0"),
        };
      } else if (parts[0].length === 4) {
        // YYYY/MM/DD
        return {
          year: parts[0],
          month: parts[1].padStart(2, "0"),
          day: parts[2].padStart(2, "0"),
        };
      } else if (parts[2].length <= 2) {
        // MM/DD/YY
        let yr = parseInt(parts[2], 10);
        if (!isNaN(yr)) {
          yr = yr < 100 ? (yr > 50 ? 1900 + yr : 2000 + yr) : yr;
          return {
            year: yr.toString(),
            month: parts[0].padStart(2, "0"),
            day: parts[1].padStart(2, "0"),
          };
        }
      }
    }
  }

  // Fallback JavaScript Date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear().toString();
    const m = (parsed.getMonth() + 1).toString().padStart(2, "0");
    const d = parsed.getDate().toString().padStart(2, "0");
    return { year: y, month: m, day: d };
  }

  return { year: "", month: "", day: "" };
}

export function getNormalizedYYYYMM(dateStr?: string): string {
  const { year, month } = parseDateComponents(dateStr);
  if (year && month) {
    return `${year}-${month}`;
  }
  return "";
}

export function getNormalizedYYYY(dateStr?: string): string {
  const { year } = parseDateComponents(dateStr);
  return year || "";
}

export function getNormalizedYYYYMMDD(dateStr?: string): string {
  const { year, month, day } = parseDateComponents(dateStr);
  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }
  return dateStr || "";
}

export function formatDateMMDDYYYY(dateStr?: string): string {
  const { year, month, day } = parseDateComponents(dateStr);
  if (year && month && day) {
    return `${month}/${day}/${year}`;
  }
  return dateStr || "";
}

export function formatDateMMDDYY(dateStr?: string): string {
  const { year, month, day } = parseDateComponents(dateStr);
  if (year && month && day) {
    return `${month}/${day}/${year.slice(-2)}`;
  }
  return dateStr || "";
}

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

const MONTH_SHORT = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec"
];

export function matchesDateSearch(dateStr?: string, searchLower?: string): boolean {
  if (!dateStr || !searchLower) return false;
  const search = searchLower.trim();
  if (!search) return false;

  const { year, month, day } = parseDateComponents(dateStr);
  if (!year || !month || !day) return false;

  const monthInt = parseInt(month, 10);
  const dayInt = parseInt(day, 10);

  const mName = MONTH_NAMES[monthInt - 1] || "";
  const mShort = MONTH_SHORT[monthInt - 1] || "";

  // Variants of date
  const variants = [
    `${year}-${month}-${day}`, // 2026-08-02
    `${month}/${day}/${year}`, // 08/02/2026
    `${monthInt}/${dayInt}/${year}`, // 8/2/2026
    `${monthInt}/${dayInt}`, // 8/2
    `${month}/${day}`, // 08/02
    `${month}-${day}`, // 08-02
    `${monthInt}-${dayInt}`, // 8-2
    `${year}/${month}/${day}`, // 2026/08/02
    `${year}.${month}.${day}`, // 2026.08.02
    `${mName} ${dayInt}`, // august 2
    `${mShort} ${dayInt}`, // aug 2
    `${mName} ${dayInt}, ${year}`, // august 2, 2026
    `${mShort} ${dayInt}, ${year}`, // aug 2, 2026
    `${mName}`, // august
    `${mShort}`, // aug
    year, // 2026
  ];

  return variants.some((v) => v.toLowerCase().includes(search));
}


