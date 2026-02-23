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
});
