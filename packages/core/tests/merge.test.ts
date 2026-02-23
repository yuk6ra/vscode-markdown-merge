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

    // All # should become ##
    expect(result).toContain("## Alpha");
    expect(result).toContain("## Beta");
    expect(result).toContain("## Gamma");
    expect(result).not.toMatch(/^# Alpha/m);
  });
});
