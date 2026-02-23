import path from "node:path";
import { describe, expect, it } from "vitest";
import { discover } from "../src/discover.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures");

describe("discover", () => {
  it("finds all .md files recursively", async () => {
    const files = await discover(path.join(FIXTURES, "basic"));
    const names = files.map((f) => f.relativePath).sort();
    expect(names).toEqual([
      "hardware-requirements.md",
      path.join("materials", "seq.md"),
      "project-schedule.md",
    ]);
  });

  it("finds only top-level files when recursive=false", async () => {
    const files = await discover(path.join(FIXTURES, "basic"), false);
    const names = files.map((f) => f.relativePath).sort();
    expect(names).toEqual([
      "hardware-requirements.md",
      "project-schedule.md",
    ]);
  });

  it("returns empty array for empty directory", async () => {
    const files = await discover(path.join(FIXTURES, "empty"));
    expect(files).toEqual([]);
  });

  it("ignores files matching a pattern", async () => {
    const files = await discover(path.join(FIXTURES, "basic"), true, [
      "project-schedule.md",
    ]);
    const names = files.map((f) => f.relativePath).sort();
    expect(names).toEqual([
      "hardware-requirements.md",
      path.join("materials", "seq.md"),
    ]);
  });

  it("ignores files matching a glob pattern", async () => {
    const files = await discover(path.join(FIXTURES, "basic"), true, [
      "hardware-*",
    ]);
    const names = files.map((f) => f.relativePath).sort();
    expect(names).toEqual([
      path.join("materials", "seq.md"),
      "project-schedule.md",
    ]);
  });

  it("ignores subdirectory files with ** pattern", async () => {
    const files = await discover(path.join(FIXTURES, "basic"), true, [
      "materials/**",
    ]);
    const names = files.map((f) => f.relativePath).sort();
    expect(names).toEqual([
      "hardware-requirements.md",
      "project-schedule.md",
    ]);
  });

  it("includes stats for each file", async () => {
    const files = await discover(path.join(FIXTURES, "basic"));
    for (const file of files) {
      expect(file.stats.birthtimeMs).toBeGreaterThan(0);
      expect(file.stats.mtimeMs).toBeGreaterThan(0);
      expect(path.isAbsolute(file.absolutePath)).toBe(true);
    }
  });
});
