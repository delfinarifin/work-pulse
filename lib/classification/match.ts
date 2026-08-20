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
    // Falls back to windowTitle when fileName is null — every seeded
    // keyword mapping is scoped to 'filename', but the desktop agent
    // often can't extract a clean file name from a window title (Windows
    // hides file extensions by default, so "SCS Bookkeeping 2026 - Excel"
    // has no ".xlsx" to detect). Without this fallback, every agent-only
    // capture with no fileName never matches any keyword at all, even
    // though the real signal is sitting right there in the window title.
    // Manual Log Activity always supplies fileName, so this never
    // changes behavior there.
    case "filename":
      return input.fileName ?? input.windowTitle;
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
