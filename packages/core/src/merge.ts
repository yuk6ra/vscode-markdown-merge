import fs from "node:fs/promises";
import path from "node:path";
import { discover } from "./discover.js";
import { orderFiles } from "./order.js";
import { rewritePaths } from "./paths.js";
import { extractTitle, generateToc, slugify, uniqueAnchors } from "./toc.js";
import type { MergeOptions, TocEntry } from "./types.js";

const DEFAULT_SEPARATOR = "\n---\n\n";

/**
 * Offset heading levels in Markdown content.
 * e.g., offset=1 turns # into ##, ## into ###, etc.
 */
function offsetHeadings(content: string, offset: number): string {
  if (offset <= 0) return content;
  return content.replace(/^(#{1,6})\s/gm, (_match, hashes: string) => {
    const newLevel = Math.min(hashes.length + offset, 6);
    return "#".repeat(newLevel) + " ";
  });
}

/**
 * Merge multiple Markdown files from a directory into a single document.
 */
export async function merge(options: MergeOptions): Promise<string> {
  const {
    inputDir,
    outputPath,
    order = "filename",
    toc = true,
    recursive = true,
    separator = DEFAULT_SEPARATOR,
    headingOffset = 0,
    ignore = [],
  } = options;

  const resolvedInputDir = path.resolve(inputDir);
  const outputDir = outputPath
    ? path.dirname(path.resolve(outputPath))
    : resolvedInputDir;

  // Discover and order files
  const files = await discover(resolvedInputDir, recursive, ignore);
  if (files.length === 0) {
    throw new Error(`No .md files found in ${resolvedInputDir}`);
  }

  const ordered = await orderFiles(files, order, resolvedInputDir);

  // Process each file
  const sections: string[] = [];
  const tocEntries: TocEntry[] = [];

  for (const file of ordered) {
    let content = await fs.readFile(file.absolutePath, "utf-8");

    // Rewrite relative paths
    const sourceDir = path.dirname(file.absolutePath);
    content = rewritePaths(content, sourceDir, outputDir);

    // Offset headings
    if (headingOffset > 0) {
      content = offsetHeadings(content, headingOffset);
    }

    // Extract title and create TOC entry
    const title = extractTitle(content, file.relativePath);
    const anchor = slugify(title);
    tocEntries.push({ title, anchor, sourceFile: file.relativePath });

    sections.push(`<a id="${anchor}"></a>\n\n${content}`);
  }

  // Ensure unique anchors
  const uniqueTocEntries = uniqueAnchors(tocEntries);

  // Update section anchors to match unique entries
  for (let i = 0; i < uniqueTocEntries.length; i++) {
    if (uniqueTocEntries[i].anchor !== tocEntries[i].anchor) {
      sections[i] = sections[i].replace(
        `<a id="${tocEntries[i].anchor}"></a>`,
        `<a id="${uniqueTocEntries[i].anchor}"></a>`,
      );
    }
  }

  // Build final document
  let result = "";
  if (toc) {
    result += generateToc(uniqueTocEntries) + "\n\n";
  }
  result += sections.join(separator);

  // Write to file if outputPath specified
  if (outputPath) {
    const resolvedOutput = path.resolve(outputPath);
    await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
    await fs.writeFile(resolvedOutput, result, "utf-8");
  }

  return result;
}
