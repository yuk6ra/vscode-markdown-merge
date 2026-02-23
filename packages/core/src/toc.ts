import type { TocEntry } from "./types.js";

/**
 * Extract the title from Markdown content.
 * Uses the first H1 heading, or falls back to the filename.
 */
export function extractTitle(content: string, relativePath: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  // Fallback: use filename without extension, convert to title case
  const basename = relativePath.replace(/.*\//, "").replace(/\.md$/i, "");
  return basename
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate a URL-safe anchor slug from a title.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensure anchor uniqueness by appending -1, -2, etc. for duplicates.
 */
export function uniqueAnchors(entries: TocEntry[]): TocEntry[] {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const count = seen.get(entry.anchor) ?? 0;
    seen.set(entry.anchor, count + 1);
    if (count > 0) {
      return { ...entry, anchor: `${entry.anchor}-${count}` };
    }
    return entry;
  });
}

/**
 * Generate a Markdown table of contents from TOC entries.
 * Supports nested indentation when entries have a depth field.
 */
export function generateToc(entries: TocEntry[]): string {
  const lines = ["# Table of Contents", ""];
  const counters: number[] = [];

  for (const entry of entries) {
    const depth = entry.depth ?? 0;

    // Ensure counters array covers this depth
    while (counters.length <= depth) {
      counters.push(0);
    }
    // Reset deeper counters when going back up
    counters.length = depth + 1;
    counters[depth]++;

    const indent = "   ".repeat(depth);
    lines.push(
      `${indent}${counters[depth]}. [${entry.title}](#${entry.anchor})`,
    );
  }
  return lines.join("\n");
}
