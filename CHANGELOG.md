# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of AAC Board Viewer component
- Support for Grid 3 (.gridset) files
- Support for TD Snap (.sps, .spb) files
- Support for TouchChat (.ce) files
- Support for OpenBoard (.obf, .obz) files
- Support for Asterics Grid files
- Support for Apple Panels (.plist) files with automatic grid positioning
- Support for OPML (.opml) files
- Support for Excel (.xlsx, .xls) boards
- Support for DOT (.dot) visualization files
- Interactive board navigation with page transitions
- Sentence building functionality
- Effort metrics display
- Toolbar support (side-by-side layout)
- Dark mode support
- Responsive design
- React hooks for easy integration (useAACFile, useAACFileWithMetrics, useMetrics, useSentenceBuilder)
- File loading utilities (loadAACFile, loadAACFileFromURL)
- Metrics calculation utilities
- Demo application with examples

### Features
- Preserves original board styling (colors, fonts, borders)
- Shows link indicators for navigation buttons
- Displays effort scores on buttons
- Tracks word count and average effort in sentence building
- Automatic toolbar detection and display
- Grid-based layout for all formats (Apple Panels auto-convert from pixel coordinates)
- Back/forward navigation between pages

## [0.1.0] - 2025-01-05

### Added
- Initial public release
- BoardViewer component with full AAC format support
- Complete documentation and examples
- npm package setup
