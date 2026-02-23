import fs from "node:fs/promises";
import path from "node:path";
import type { FileEntry } from "./types.js";

/**
 * Match a file path against a glob-like pattern.
 * Supports: * (any chars except /), ** (any path), ? (single char)
 */
function matchPattern(filePath: string, pattern: string): boolean {
  // Normalize separators
  const normalized = filePath.split(path.sep).join("/");
  const normalizedPattern = pattern.split(path.sep).join("/");

  // Convert glob pattern to regex
  const regexStr = normalizedPattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "\0")
    .replace(/\*/g, "[^/]*")
    .replace(/\0/g, ".*")
    .replace(/\?/g, "[^/]");

  return new RegExp(`^${regexStr}$`).test(normalized);
}

/**
 * Check if a file path matches any of the ignore patterns.
 */
export function isIgnored(relativePath: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) =>
      matchPattern(relativePath, pattern) ||
      matchPattern(relativePath, `**/${pattern}`),
  );
}

/**
 * Recursively discover all .md files in a directory.
 */
export async function discover(
  dir: string,
  recursive: boolean = true,
  ignore: string[] = [],
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  await walk(dir, dir, recursive, ignore, entries);
  return entries;
}

async function walk(
  baseDir: string,
  currentDir: string,
  recursive: boolean,
  ignore: string[],
  result: FileEntry[],
): Promise<void> {
  const items = await fs.readdir(currentDir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(currentDir, item.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (item.isDirectory() && recursive) {
      if (ignore.length === 0 || !isIgnored(relativePath + "/", ignore)) {
        await walk(baseDir, fullPath, recursive, ignore, result);
      }
    } else if (item.isFile() && item.name.endsWith(".md")) {
      if (ignore.length > 0 && isIgnored(relativePath, ignore)) {
        continue;
      }
      const stat = await fs.stat(fullPath);
      result.push({
        absolutePath: fullPath,
        relativePath,
        stats: {
          birthtimeMs: stat.birthtimeMs,
          mtimeMs: stat.mtimeMs,
        },
      });
    }
  }
}
