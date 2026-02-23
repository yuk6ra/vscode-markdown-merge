# Markdown Merge

Merge multiple Markdown files from a directory into a single document with auto-generated table of contents and relative path correction.

## Features

- **Directory merging** -- Select a folder and merge all `.md` files into one document
- **File ordering** -- Sort by filename, creation date, or custom order via `index.json`
- **Auto-generated TOC** -- Inserts a table of contents with anchor links at the top
- **Path correction** -- Rewrites relative paths (images, links) so they work after merging
- **Ignore patterns** -- Exclude files using glob patterns (`--ignore "draft-*" "archive/**"`)

## Installation

### VSCode Extension

Search for **"Markdown Merge"** in the Extensions panel, or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yuk6ra.mdmerge-vscode).

### CLI

```bash
npm install -g mdmerge
```

## Usage

### VSCode

1. Right-click a folder in the Explorer
2. Select **"Merge All Markdown"**
3. Choose an ordering strategy (filename / created / index)
4. Choose where to save the output

### CLI

```bash
# Basic usage (filename order, with TOC)
mdmerge ./docs

# Save to a file
mdmerge ./docs -o merged.md

# Use index.json for custom ordering
mdmerge ./docs -o merged.md --order index

# Ignore specific files
mdmerge ./docs -o merged.md --ignore "merged.md" "draft-*"

# Disable TOC and offset headings by 1 level
mdmerge ./docs -o merged.md --no-toc --heading-offset 1
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <file>` | Output file path | stdout |
| `--order <strategy>` | `filename`, `created`, or `index` | `filename` |
| `--no-toc` | Disable table of contents | `false` |
| `--no-recursive` | Do not recurse into subdirectories | `false` |
| `--separator <string>` | Section separator | `\n---\n\n` |
| `--heading-offset <n>` | Offset heading levels | `0` |
| `--ignore <patterns...>` | Glob patterns to exclude | none |

## Configuration

### index.json

Place an `index.json` in the target directory to control file order:

```json
{
  "order": [
    "README.md",
    "project-schedule.md",
    "sequence.md",
    "materials/seq.md",
    "hardware-requirements.md"
  ],
  "exclude": ["draft.md"]
}
```

Files listed in `order` appear first in that order. Unlisted files are appended alphabetically.

## Example

Given this directory:

```
docs/
├── hardware-requirements.md
├── materials/
│   └── seq.md
└── project-schedule.md
```

Running `mdmerge ./docs` produces:

```markdown
# Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Sequence Diagram](#sequence-diagram)
3. [Project Schedule](#project-schedule)

---

# Hardware Requirements
...

---

# Sequence Diagram
![Sequence](materials/diagrams/sequence.svg)  <!-- path auto-corrected -->
...

---

# Project Schedule
...
```

## Project Structure

This is a monorepo with three packages:

```
packages/
├── core/     # @mdmerge/core -- Pure merge logic (discover, order, paths, toc)
├── cli/      # mdmerge -- CLI wrapper using commander
└── vscode/   # mdmerge-vscode -- VSCode extension
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build --workspaces

# Run tests (36 tests)
npm run test --workspace=packages/core
```

## License

[MIT](LICENSE)
