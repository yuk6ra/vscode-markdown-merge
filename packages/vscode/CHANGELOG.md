# Changelog

## [1.0.2] - 2026-02-24

### Added
- Usage screenshot to README

## [1.0.1] - 2026-02-24

### Changed
- Updated extension icon

## [1.0.0] - 2026-02-24

### Added
- Auto-ignore output file to prevent self-inclusion when merging
- "Why Markdown Merge?" motivation section in README
- Hokkaido Trip sample data
- Extension icon

### Fixed
- Merged file no longer includes itself when output is inside input directory

## [0.3.0] - 2026-02-24

### Added
- Heading hierarchy: subdirectory structure automatically maps to heading levels (H1 → H2 → H3)
- Nested table of contents reflecting directory depth
- Directory section headings inserted automatically for subdirectories
- New examples in README (Smart Watch Manual, Hokkaido Trip)
- Mermaid diagrams in README

### Changed
- Improved README with clearer documentation and real-world examples
- Updated VSCode Marketplace README with heading hierarchy example

## [0.2.0] - 2026-02-24

### Added
- Ignore patterns support for excluding files from merge
- README and documentation for VS Code Marketplace
- MIT License

### Changed
- Improved package metadata for Marketplace listing

## [0.1.0] - 2026-02-24

### Added
- Initial release
- Right-click folder context menu: "Merge All Markdown"
- Three file ordering strategies: filename, created, index (via index.json)
- Auto-generated table of contents with anchor links
- Relative path correction for images and links
- Recursive subdirectory merging
