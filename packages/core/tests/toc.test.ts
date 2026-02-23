import { describe, expect, it } from "vitest";
import {
  extractTitle,
  generateToc,
  slugify,
  uniqueAnchors,
} from "../src/toc.js";
import type { TocEntry } from "../src/types.js";

describe("extractTitle", () => {
  it("extracts H1 title from content", () => {
    expect(extractTitle("# My Title\n\nSome text", "file.md")).toBe(
      "My Title",
    );
  });

  it("falls back to filename when no H1 exists", () => {
    expect(extractTitle("Some text without heading", "my-file.md")).toBe(
      "My File",
    );
  });

  it("handles filenames with underscores", () => {
    expect(extractTitle("no heading", "project_schedule.md")).toBe(
      "Project Schedule",
    );
  });

  it("handles nested file paths", () => {
    expect(extractTitle("no heading", "materials/seq.md")).toBe("Seq");
  });
});

describe("slugify", () => {
  it("converts title to URL-safe slug", () => {
    expect(slugify("Hardware Requirements")).toBe("hardware-requirements");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("foo   bar")).toBe("foo-bar");
  });
});

describe("uniqueAnchors", () => {
  it("appends suffix for duplicate anchors", () => {
    const entries: TocEntry[] = [
      { title: "Intro", anchor: "intro", sourceFile: "a.md" },
      { title: "Intro", anchor: "intro", sourceFile: "b.md" },
      { title: "Intro", anchor: "intro", sourceFile: "c.md" },
    ];
    const result = uniqueAnchors(entries);
    expect(result.map((e) => e.anchor)).toEqual([
      "intro",
      "intro-1",
      "intro-2",
    ]);
  });

  it("leaves unique anchors unchanged", () => {
    const entries: TocEntry[] = [
      { title: "A", anchor: "a", sourceFile: "a.md" },
      { title: "B", anchor: "b", sourceFile: "b.md" },
    ];
    const result = uniqueAnchors(entries);
    expect(result.map((e) => e.anchor)).toEqual(["a", "b"]);
  });
});

describe("generateToc", () => {
  it("generates numbered list with anchor links", () => {
    const entries: TocEntry[] = [
      { title: "Alpha", anchor: "alpha", sourceFile: "alpha.md" },
      { title: "Beta", anchor: "beta", sourceFile: "beta.md" },
    ];
    const toc = generateToc(entries);
    expect(toc).toContain("# Table of Contents");
    expect(toc).toContain("1. [Alpha](#alpha)");
    expect(toc).toContain("2. [Beta](#beta)");
  });

  it("generates flat list when all entries have depth 0", () => {
    const entries: TocEntry[] = [
      { title: "A", anchor: "a", sourceFile: "a.md", depth: 0 },
      { title: "B", anchor: "b", sourceFile: "b.md", depth: 0 },
    ];
    const toc = generateToc(entries);
    expect(toc).toContain("1. [A](#a)");
    expect(toc).toContain("2. [B](#b)");
    // No indentation (only spaces/tabs, not newlines)
    expect(toc).not.toMatch(/^[ \t]+\d+\./m);
  });

  it("generates nested list with depth-aware indentation", () => {
    const entries: TocEntry[] = [
      { title: "Dir A", anchor: "dir-a", sourceFile: "dir-a/", depth: 0, isDirectory: true },
      { title: "File 1", anchor: "file-1", sourceFile: "dir-a/file-1.md", depth: 1 },
      { title: "File 2", anchor: "file-2", sourceFile: "dir-a/file-2.md", depth: 1 },
      { title: "Dir B", anchor: "dir-b", sourceFile: "dir-b/", depth: 0, isDirectory: true },
      { title: "File 3", anchor: "file-3", sourceFile: "dir-b/file-3.md", depth: 1 },
    ];
    const toc = generateToc(entries);
    expect(toc).toContain("1. [Dir A](#dir-a)");
    expect(toc).toContain("   1. [File 1](#file-1)");
    expect(toc).toContain("   2. [File 2](#file-2)");
    expect(toc).toContain("2. [Dir B](#dir-b)");
    expect(toc).toContain("   1. [File 3](#file-3)");
  });

  it("resets numbering when going back up in depth", () => {
    const entries: TocEntry[] = [
      { title: "A", anchor: "a", sourceFile: "a/", depth: 0, isDirectory: true },
      { title: "A1", anchor: "a1", sourceFile: "a/a1.md", depth: 1 },
      { title: "A2", anchor: "a2", sourceFile: "a/a2.md", depth: 1 },
      { title: "B", anchor: "b", sourceFile: "b/", depth: 0, isDirectory: true },
      { title: "B1", anchor: "b1", sourceFile: "b/b1.md", depth: 1 },
    ];
    const toc = generateToc(entries);
    // B1 should be numbered 1 (reset), not 3
    expect(toc).toContain("   1. [B1](#b1)");
  });

  it("handles entries without depth field (backward compat)", () => {
    const entries: TocEntry[] = [
      { title: "Alpha", anchor: "alpha", sourceFile: "alpha.md" },
      { title: "Beta", anchor: "beta", sourceFile: "beta.md" },
    ];
    const toc = generateToc(entries);
    expect(toc).toContain("1. [Alpha](#alpha)");
    expect(toc).toContain("2. [Beta](#beta)");
  });
});
