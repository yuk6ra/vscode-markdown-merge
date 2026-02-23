import fs from "node:fs/promises";
import path from "node:path";
import type { FileEntry, IndexConfig, OrderStrategy } from "./types.js";

/**
 * Order files according to the specified strategy.
 */
export async function orderFiles(
  files: FileEntry[],
  strategy: OrderStrategy = "filename",
  inputDir: string,
): Promise<FileEntry[]> {
  switch (strategy) {
    case "filename":
      return orderByFilename(files);
    case "created":
      return orderByCreated(files);
    case "index":
      return orderByIndex(files, inputDir);
  }
}

function orderByFilename(files: FileEntry[]): FileEntry[] {
  return [...files].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }),
  );
}

function orderByCreated(files: FileEntry[]): FileEntry[] {
  return [...files].sort((a, b) => a.stats.birthtimeMs - b.stats.birthtimeMs);
}

async function orderByIndex(
  files: FileEntry[],
  inputDir: string,
): Promise<FileEntry[]> {
  const indexPath = path.join(inputDir, "index.json");
  let config: IndexConfig;

  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    config = JSON.parse(raw) as IndexConfig;
  } catch {
    throw new Error(
      `index.json not found or invalid at ${indexPath}. Required for "index" ordering strategy.`,
    );
  }

  const fileMap = new Map(files.map((f) => [f.relativePath, f]));

  // Exclude files matching exclude patterns
  if (config.exclude) {
    for (const pattern of config.exclude) {
      fileMap.delete(pattern);
    }
  }

  const ordered: FileEntry[] = [];
  for (const filePath of config.order) {
    const normalized = path.normalize(filePath);
    const entry = fileMap.get(normalized);
    if (entry) {
      ordered.push(entry);
      fileMap.delete(normalized);
    }
  }

  // Append remaining files not listed in order (sorted by filename)
  const remaining = [...fileMap.values()].sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, undefined, { numeric: true }),
  );
  ordered.push(...remaining);

  return ordered;
}
