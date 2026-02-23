import path from "node:path";
import { describe, expect, it } from "vitest";
import { discover } from "../src/discover.js";
import { orderFiles } from "../src/order.js";

const FIXTURES = path.join(import.meta.dirname, "fixtures");

describe("orderFiles", () => {
  describe("filename strategy", () => {
    it("sorts files alphabetically by relativePath", async () => {
      const files = await discover(path.join(FIXTURES, "basic"));
      const ordered = await orderFiles(files, "filename", path.join(FIXTURES, "basic"));
      const names = ordered.map((f) => f.relativePath);
      expect(names).toEqual([
        "hardware-requirements.md",
        path.join("materials", "seq.md"),
        "project-schedule.md",
      ]);
    });
  });

  describe("index strategy", () => {
    it("orders files according to index.json", async () => {
      const dir = path.join(FIXTURES, "with-index");
      const files = await discover(dir);
      const ordered = await orderFiles(files, "index", dir);
      const names = ordered.map((f) => f.relativePath);
      expect(names).toEqual(["gamma.md", "alpha.md", "beta.md"]);
    });

    it("throws when index.json is missing", async () => {
      const dir = path.join(FIXTURES, "basic");
      const files = await discover(dir);
      await expect(
        orderFiles(files, "index", dir),
      ).rejects.toThrow("index.json not found");
    });
  });

  describe("created strategy", () => {
    it("returns all files (order depends on filesystem)", async () => {
      const files = await discover(path.join(FIXTURES, "basic"));
      const ordered = await orderFiles(files, "created", path.join(FIXTURES, "basic"));
      expect(ordered).toHaveLength(files.length);
    });
  });
});
