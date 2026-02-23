import { describe, expect, it } from "vitest";
import { rewritePaths } from "../src/paths.js";

describe("rewritePaths", () => {
  it("rewrites Markdown image paths", () => {
    const content = "![alt](./images/diagram.png)";
    const result = rewritePaths(content, "/project/docs/sub", "/project/docs");
    expect(result).toBe("![alt](sub/images/diagram.png)");
  });

  it("rewrites Markdown link paths", () => {
    const content = "[link](./other.md)";
    const result = rewritePaths(content, "/project/docs/sub", "/project/docs");
    expect(result).toBe("[link](sub/other.md)");
  });

  it("rewrites HTML img src", () => {
    const content = '<img src="./photo.jpg">';
    const result = rewritePaths(content, "/project/docs/sub", "/project/docs");
    expect(result).toBe('<img src="sub/photo.jpg">');
  });

  it("rewrites HTML a href", () => {
    const content = '<a href="./page.md">link</a>';
    const result = rewritePaths(content, "/project/docs/sub", "/project/docs");
    expect(result).toBe('<a href="sub/page.md">link</a>');
  });

  it("skips absolute URLs", () => {
    const content = "![img](https://example.com/photo.jpg)";
    const result = rewritePaths(content, "/project/sub", "/project");
    expect(result).toBe("![img](https://example.com/photo.jpg)");
  });

  it("skips anchor-only links", () => {
    const content = "[section](#heading)";
    const result = rewritePaths(content, "/project/sub", "/project");
    expect(result).toBe("[section](#heading)");
  });

  it("preserves fragment in links", () => {
    const content = "[link](./page.md#section)";
    const result = rewritePaths(content, "/project/docs/sub", "/project/docs");
    expect(result).toBe("[link](sub/page.md#section)");
  });

  it("returns unchanged content when sourceDir equals outputDir", () => {
    const content = "![img](./photo.jpg)";
    const result = rewritePaths(content, "/project/docs", "/project/docs");
    expect(result).toBe(content);
  });

  it("skips data URIs", () => {
    const content = "![img](data:image/png;base64,abc)";
    const result = rewritePaths(content, "/project/sub", "/project");
    expect(result).toBe("![img](data:image/png;base64,abc)");
  });
});
