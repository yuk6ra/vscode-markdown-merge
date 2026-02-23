# Contributing

## Prerequisites

- Node.js 18+
- npm 9+
- VSCode (for extension development)

## Setup

```bash
git clone https://github.com/yuk6ra/vscode-markdown-merge.git
cd vscode-markdown-merge
npm install
```

## Project Structure

```
packages/
├── core/     # @mdmerge/core — Pure merge logic
├── cli/      # mdmerge — CLI wrapper
└── vscode/   # mdmerge-vscode — VSCode extension
```

## Build

Packages must be built in dependency order: **core** first, then cli / vscode.

```bash
# Build all (respects workspace order)
npm run build --workspaces

# Or build individually
npm run build --workspace=packages/core
npm run build --workspace=packages/cli
npm run build --workspace=packages/vscode
```

## Test

```bash
# Run all tests
npm run test --workspace=packages/core

# Watch mode
npx vitest --workspace=packages/core
```

### Test Fixtures

```
packages/core/tests/fixtures/
├── basic/         # Files with subdirectory (materials/)
├── empty/         # Empty directory — tests error handling
├── nested/        # Multi-level nesting — tests depth-based headings
└── with-index/    # Flat directory with index.json — tests custom ordering
```

To add a new fixture, create a directory under `fixtures/` with `.md` files, then add tests in the relevant `*.test.ts` file.

## Developing the CLI

After building, run the CLI locally without installing globally:

```bash
node packages/cli/dist/bin.js ./samplemd/hokkaido-trip
```

To save output:

```bash
node packages/cli/dist/bin.js ./samplemd/hokkaido-trip \
  -o ./samplemd/hokkaido-trip/merged.md \
  --ignore "merged.md"
```

> **Note:** Always use `--ignore "merged.md"` when outputting into the same directory, otherwise the merged file will include itself on the next run.

## Developing the VSCode Extension

1. Open the project in VSCode
2. Press **F5** to launch the Extension Development Host
3. In the new window, right-click a folder and select **"Merge All Markdown"**
4. After code changes, rebuild and reload:
   ```bash
   npm run build --workspace=packages/core
   npm run build --workspace=packages/vscode
   ```
   Then run **"Developer: Reload Window"** (`Ctrl+Shift+P`) in the Extension Development Host.

## Sample Data

```
samplemd/
├── smart-watch-manual/   # index.json ordering, subdirectories
└── hokkaido-trip/        # Numbered prefixes, filename ordering
```

Use these for manual testing and README examples.

## Architecture Notes

### Heading Hierarchy

When merging recursively, subdirectory depth maps to heading levels:

```
docs/                → (root, omitted)
├── intro.md         → # intro's H1        (depth 0)
├── guides/          → # Guides             (directory heading)
│   └── setup.md     → ## setup's H1        (depth 1)
└── faq.md           → # faq's H1           (depth 0)
```

- Flat directories (no subdirectories) have no behavior change
- `headingOffset` adds a global offset on top of depth-based offset
- File ordering is fully preserved — directory headings are injected at the point each directory is first encountered

## Publishing

### 1. Update Versions

Bump the version in each package you want to publish:

```bash
# packages/core/package.json   → @mdmerge/core
# packages/cli/package.json    → mdmerge
# packages/vscode/package.json → mdmerge-vscode
```

Keep versions in sync across packages.

### 2. Publish @mdmerge/core to npm

```bash
npm run build --workspace=packages/core
npm publish --workspace=packages/core --access public
```

### 3. Publish mdmerge (CLI) to npm

```bash
npm run build --workspace=packages/cli
npm publish --workspace=packages/cli --access public
```

### 4. Publish VSCode Extension

Requires [vsce](https://github.com/microsoft/vscode-vsce):

```bash
npm install -g @vscode/vsce
```

Build and publish:

```bash
npm run build --workspaces
cd packages/vscode
vsce package        # Creates .vsix file for local testing
vsce publish        # Publish to VS Code Marketplace
```

> **Note:** `vsce publish` requires a Personal Access Token (PAT) from [Azure DevOps](https://dev.azure.com/). Run `vsce login yuk6ra` first to set up credentials.

### 5. Create a Git Tag

```bash
git tag v0.x.0
git push origin v0.x.0
```

### Key Modules (core)

| Module | Responsibility |
|--------|---------------|
| `discover.ts` | Recursively find `.md` files, apply ignore patterns |
| `order.ts` | Sort files by filename, created date, or index.json |
| `paths.ts` | Rewrite relative paths (images, links) for merged output |
| `toc.ts` | Extract titles, generate slugs, build nested TOC |
| `merge.ts` | Orchestrate: discover → order → group → rewrite → TOC → join |
