import fs from "node:fs/promises";
import path from "node:path";
import { discover } from "./discover.js";
import { orderFiles } from "./order.js";
import { rewritePaths } from "./paths.js";
import { extractTitle, generateToc, slugify, uniqueAnchors } from "./toc.js";
import type { FileEntry, MergeOptions, TocEntry } from "./types.js";

const DEFAULT_SEPARATOR = "\n---\n\n";

/** Internal node representing either a directory heading or a file section. */
interface MergeNode {
  type: "directory" | "file";
  /** Depth relative to inputDir (0 = immediate child). */
  depth: number;
  /** Directory name (for dir nodes) or relativePath (for file nodes). */
  name: string;
  /** Present when type === "file". */
  file?: FileEntry;
}

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

/** Count directory depth from a relativePath. "file.md" → 0, "sub/file.md" → 1 */
function getFileDepth(relativePath: string): number {
  const dir = path.dirname(relativePath);
  if (dir === ".") return 0;
  return dir.split(path.sep).length;
}

/** Convert a directory name like "with-index" to "With Index". */
function formatDirName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Preserve the original file order and inject directory heading nodes
 * as each new directory is first encountered.
 * This respects the user's ordering strategy (filename, created, index).
 */
function groupByDirectory(ordered: FileEntry[]): MergeNode[] {
  const nodes: MergeNode[] = [];
  const seenDirs = new Set<string>();

  for (const file of ordered) {
    const dirPath = path.dirname(file.relativePath);

    if (dirPath !== ".") {
      // Emit directory heading nodes for each unseen ancestor
      const parts = dirPath.split(path.sep);
      let accumulated = "";
      for (let i = 0; i < parts.length; i++) {
        accumulated = accumulated
          ? accumulated + path.sep + parts[i]
          : parts[i];
        if (!seenDirs.has(accumulated)) {
          seenDirs.add(accumulated);
          nodes.push({
            type: "directory",
            depth: i,
            name: parts[i],
          });
        }
      }
    }

    const fileDepth = getFileDepth(file.relativePath);
    nodes.push({
      type: "file",
      depth: fileDepth,
      name: file.relativePath,
      file,
    });
  }

  return nodes;
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
  const resolvedOutput = outputPath ? path.resolve(outputPath) : undefined;
  const outputDir = resolvedOutput
    ? path.dirname(resolvedOutput)
    : resolvedInputDir;

  // Auto-ignore the output file if it falls inside inputDir
  const effectiveIgnore = [...ignore];
  if (resolvedOutput && resolvedOutput.startsWith(resolvedInputDir + path.sep)) {
    const outputRelative = path.relative(resolvedInputDir, resolvedOutput);
    effectiveIgnore.push(outputRelative);
  }

  // Discover and order files
  const files = await discover(resolvedInputDir, recursive, effectiveIgnore);
  if (files.length === 0) {
    throw new Error(`No .md files found in ${resolvedInputDir}`);
  }

  const ordered = await orderFiles(files, order, resolvedInputDir);

  // Determine if subdirectories exist
  const hasSubdirs = ordered.some((f) => getFileDepth(f.relativePath) > 0);

  // Build merge nodes (grouped if subdirs exist, flat otherwise)
  const mergeNodes: MergeNode[] = hasSubdirs
    ? groupByDirectory(ordered)
    : ordered.map((f) => ({ type: "file" as const, depth: 0, name: f.relativePath, file: f }));

  // Process each node
  const sections: string[] = [];
  const tocEntries: TocEntry[] = [];

  for (const node of mergeNodes) {
    if (node.type === "directory") {
      // Directory heading
      const dirTitle = formatDirName(node.name);
      const dirAnchor = slugify(dirTitle);
      const level = Math.min(node.depth + 1 + headingOffset, 6);
      const hashes = "#".repeat(level);

      tocEntries.push({
        title: dirTitle,
        anchor: dirAnchor,
        sourceFile: node.name + "/",
        depth: node.depth,
        isDirectory: true,
      });

      sections.push(`<a id="${dirAnchor}"></a>\n\n${hashes} ${dirTitle}`);
    } else {
      // File section
      const file = node.file!;
      let content = await fs.readFile(file.absolutePath, "utf-8");

      // Rewrite relative paths
      const sourceDir = path.dirname(file.absolutePath);
      content = rewritePaths(content, sourceDir, outputDir);

      // Extract title BEFORE offsetting (so H1 regex still matches)
      const title = extractTitle(content, file.relativePath);

      // Apply per-file heading offset: depth-based + global
      const totalOffset = node.depth + headingOffset;
      if (totalOffset > 0) {
        content = offsetHeadings(content, totalOffset);
      }

      const anchor = slugify(title);
      tocEntries.push({
        title,
        anchor,
        sourceFile: file.relativePath,
        depth: node.depth,
      });

      sections.push(`<a id="${anchor}"></a>\n\n${content}`);
    }
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
  if (resolvedOutput) {
    await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
    await fs.writeFile(resolvedOutput, result, "utf-8");
  }

  return result;
}
