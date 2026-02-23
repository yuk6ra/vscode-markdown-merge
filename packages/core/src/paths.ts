import path from "node:path";

/**
 * Rewrite relative paths in Markdown content so they resolve correctly
 * from the output file's location.
 */
export function rewritePaths(
  content: string,
  sourceDir: string,
  outputDir: string,
): string {
  if (sourceDir === outputDir) return content;

  const relativePrefix = path.relative(outputDir, sourceDir);
  if (!relativePrefix) return content;

  // Rewrite Markdown image syntax: ![alt](path)
  content = content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt: string, href: string) => {
      const rewritten = rewriteSinglePath(href, relativePrefix);
      return `![${alt}](${rewritten})`;
    },
  );

  // Rewrite Markdown link syntax: [text](path)
  // Negative lookbehind to skip images (already handled)
  content = content.replace(
    /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g,
    (match, text: string, href: string) => {
      const rewritten = rewriteSinglePath(href, relativePrefix);
      return `[${text}](${rewritten})`;
    },
  );

  // Rewrite HTML img src
  content = content.replace(
    /(<img\s[^>]*src=["'])([^"']+)(["'])/g,
    (match, prefix: string, src: string, suffix: string) => {
      return `${prefix}${rewriteSinglePath(src, relativePrefix)}${suffix}`;
    },
  );

  // Rewrite HTML a href
  content = content.replace(
    /(<a\s[^>]*href=["'])([^"']+)(["'])/g,
    (match, prefix: string, href: string, suffix: string) => {
      return `${prefix}${rewriteSinglePath(href, relativePrefix)}${suffix}`;
    },
  );

  return content;
}

function rewriteSinglePath(href: string, relativePrefix: string): string {
  // Skip absolute URLs, protocol-relative, and anchor-only links
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("#") ||
    href.startsWith("data:")
  ) {
    return href;
  }

  // Separate anchor fragment from path
  const hashIndex = href.indexOf("#");
  let filePart = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const fragment = hashIndex >= 0 ? href.slice(hashIndex) : "";

  if (!filePart) return href; // anchor-only after split

  // Join the relative prefix with the original path
  filePart = path.posix.join(
    relativePrefix.split(path.sep).join(path.posix.sep),
    filePart,
  );

  return filePart + fragment;
}
