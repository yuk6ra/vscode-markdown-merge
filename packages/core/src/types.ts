export type OrderStrategy = "filename" | "created" | "index";

export interface MergeOptions {
  /** Directory containing .md files */
  inputDir: string;
  /** Output file path. If undefined, returns string only */
  outputPath?: string;
  /** Ordering strategy (default: "filename") */
  order?: OrderStrategy;
  /** Generate table of contents (default: true) */
  toc?: boolean;
  /** Recurse into subdirectories (default: true) */
  recursive?: boolean;
  /** Separator between sections (default: "\n---\n\n") */
  separator?: string;
  /** Offset heading levels (e.g., 1 makes # become ##) */
  headingOffset?: number;
  /** Glob patterns to ignore (e.g., ["merged.md", "draft-*", "archive/**"]) */
  ignore?: string[];
}

export interface FileEntry {
  absolutePath: string;
  relativePath: string;
  stats: {
    birthtimeMs: number;
    mtimeMs: number;
  };
}

export interface IndexConfig {
  order: string[];
  exclude?: string[];
  recursive?: boolean;
  output?: string;
}

export interface TocEntry {
  title: string;
  anchor: string;
  sourceFile: string;
  /** Nesting depth (0 = top-level). Used for nested TOC indentation. */
  depth?: number;
  /** True if this entry represents a directory heading, not a file. */
  isDirectory?: boolean;
}
