import path from "node:path";
import { describe, expect, it } from "vitest";
import { merge } from "../src/merge.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures");

describe("merge", () => {
  it("merges files with TOC and separators", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "basic"),
      order: "filename",
      toc: true,
    });

    // Should start with TOC
    expect(result).toMatch(/^# Table of Contents/);

    // Should contain TOC entries
    expect(result).toContain("[Hardware Requirements]");
    expect(result).toContain("[Project Schedule]");
    expect(result).toContain("[Sequence Diagram]");

    // Should contain file content
    expect(result).toContain("## Server Specifications");
    expect(result).toContain("## Phase 1");
    expect(result).toContain("![Sequence]");

    // Should have anchors
    expect(result).toContain('<a id="hardware-requirements"></a>');
    expect(result).toContain('<a id="project-schedule"></a>');

    // Should have separators
    expect(result).toContain("---");

    // Subdirectory should produce a directory heading
    expect(result).toContain("# Materials");
    expect(result).toContain('<a id="materials"></a>');
  });

  it("merges without TOC when toc=false", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "basic"),
      toc: false,
    });

    expect(result).not.toContain("# Table of Contents");
    expect(result).toContain("# Hardware Requirements");
  });

  it("respects index.json ordering", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "with-index"),
      order: "index",
      toc: true,
    });

    const gammaPos = result.indexOf("Gamma content");
    const alphaPos = result.indexOf("Alpha content");
    const betaPos = result.indexOf("Beta content");

    expect(gammaPos).toBeLessThan(alphaPos);
    expect(alphaPos).toBeLessThan(betaPos);
  });

  it("throws for empty directory", async () => {
    await expect(
      merge({ inputDir: path.join(FIXTURES, "empty") }),
    ).rejects.toThrow("No .md files found");
  });

  it("rewrites relative paths for subdirectory files", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "basic"),
      order: "filename",
    });

    // The image in materials/seq.md should be rewritten
    // from ./diagrams/sequence.svg to materials/diagrams/sequence.svg
    expect(result).toContain("materials/diagrams/sequence.svg");
  });

  it("offsets heading levels", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "with-index"),
      headingOffset: 1,
      toc: false,
    });

    // All # should become ## (flat dir, depth 0 + offset 1)
    expect(result).toContain("## Alpha");
    expect(result).toContain("## Beta");
    expect(result).toContain("## Gamma");
    expect(result).not.toMatch(/^# Alpha/m);
  });
});

describe("depth-based heading offset", () => {
  it("applies depth-based offset to nested files", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "nested"),
      toc: false,
    });

    // Root-level file: depth 0 → H1 unchanged
    expect(result).toMatch(/^# Introduction$/m);

    // Depth-1 file: H1 becomes H2
    expect(result).toMatch(/^## Overview$/m);
    expect(result).toMatch(/^## Summary$/m);

    // Depth-2 file: H1 becomes H3
    expect(result).toMatch(/^### Specification$/m);

    // H2 in depth-2 file becomes H4
    expect(result).toMatch(/^#### Requirements$/m);
  });

  it("inserts directory headings at correct levels", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "nested"),
      toc: false,
    });

    // Depth-0 directories → H1
    expect(result).toMatch(/^# Chapter 1$/m);
    expect(result).toMatch(/^# Chapter 2$/m);

    // Depth-1 directory → H2
    expect(result).toMatch(/^## Details$/m);
  });

  it("preserves sorted order (alphabetical)", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "nested"),
      toc: false,
    });

    // Alphabetically: chapter-1/ < chapter-2/ < intro.md
    const chapter1Pos = result.indexOf("# Chapter 1");
    const chapter2Pos = result.indexOf("# Chapter 2");
    const introPos = result.indexOf("# Introduction");

    expect(chapter1Pos).toBeLessThan(chapter2Pos);
    expect(chapter2Pos).toBeLessThan(introPos);
  });

  it("combines depth offset with global headingOffset", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "nested"),
      headingOffset: 1,
      toc: false,
    });

    // Dir heading: depth 0 + offset 1 = H2
    expect(result).toMatch(/^## Chapter 1$/m);

    // Depth-1 dir heading: depth 1 + offset 1 = H3
    expect(result).toMatch(/^### Details$/m);

    // Depth-1 file: depth 1 + offset 1 = H3
    expect(result).toMatch(/^### Overview$/m);

    // Root file: depth 0 + offset 1 = H2
    expect(result).toMatch(/^## Introduction$/m);
    expect(result).not.toMatch(/^# Introduction$/m);
  });

  it("flat directory has no behavior change", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "with-index"),
      order: "index",
      toc: false,
    });

    // All files at root — no depth offset, no directory headings
    expect(result).toMatch(/^# Gamma$/m);
    expect(result).toMatch(/^# Alpha$/m);
    expect(result).toMatch(/^# Beta$/m);
    expect(result).not.toContain("# With Index");
  });

  it("generates nested TOC for subdirectories", async () => {
    const result = await merge({
      inputDir: path.join(FIXTURES, "nested"),
      toc: true,
    });

    // Alphabetical order: chapter-1 first, then chapter-2, then intro
    expect(result).toContain("1. [Chapter 1]");
    expect(result).toContain("2. [Chapter 2]");
    expect(result).toContain("3. [Introduction]");

    // Indented file entries under directories
    expect(result).toMatch(/[ \t]+1\. \[Details\]/);
    expect(result).toMatch(/[ \t]+1\. \[Specification\]/);
    expect(result).toMatch(/[ \t]+2\. \[Overview\]/);
    expect(result).toMatch(/[ \t]+1\. \[Summary\]/);
  });
});
