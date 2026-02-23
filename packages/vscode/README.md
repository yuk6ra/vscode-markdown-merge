# Markdown Merge

Merge all Markdown files in a folder into a single document -- right from the Explorer context menu.

## How to Use

1. **Right-click** a folder in the Explorer sidebar
2. Select **"Merge All Markdown"**
3. Choose how to order files:
   - **filename** -- Alphabetical sort
   - **created** -- By file creation date
   - **index** -- Custom order via `index.json`
4. Choose where to save the merged file
5. The merged document opens in the editor

## What It Does

- **Merges** all `.md` files from the selected folder (including subdirectories)
- **Generates a Table of Contents** with anchor links at the top
- **Fixes relative paths** so images and links still work after merging
- **Preserves structure** with separators between each file's content

## Custom Ordering with index.json

Place an `index.json` in your folder to control the merge order:

```json
{
  "order": [
    "introduction.md",
    "architecture.md",
    "api-reference.md"
  ]
}
```

Then choose the **"index"** strategy when prompted.

## Output Example

```markdown
# Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)

---

# Introduction
...

---

# Architecture
...
```

## CLI

This extension is powered by `@mdmerge/core`. A CLI tool is also available:

```bash
npm install -g mdmerge
mdmerge ./docs -o merged.md
```

See the [full documentation](https://github.com/yuk6ra/vscode-markdown-merge) for CLI options.

## Links

- [GitHub Repository](https://github.com/yuk6ra/vscode-markdown-merge)
- [Report Issues](https://github.com/yuk6ra/vscode-markdown-merge/issues)
- [Changelog](CHANGELOG.md)

## License

[MIT](https://github.com/yuk6ra/vscode-markdown-merge/blob/main/LICENSE)
