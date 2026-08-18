import type { ClassifySessionInput, MatchScope } from "./types";

// Consultants' folders/filenames use underscores, hyphens, and dots as word
// separators far more often than spaces — normalize both sides the same way
// so a pattern like "internal meeting" matches "Internal_Meeting_Notes.docx".
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_\-.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function textForScope(
  input: ClassifySessionInput,
  scope: MatchScope,
): string | null {
  switch (scope) {
    case "filename":
      return input.fileName;
    case "path":
      return input.filePath ?? input.fileName;
    case "window_title":
      return input.windowTitle;
    default:
      return null;
  }
}

export function matchesPattern(haystack: string | null, pattern: string): boolean {
  if (!haystack) return false;
  return normalizeText(haystack).includes(normalizeText(pattern));
}
