# Contributing to AAC Board Viewer

Thank you for your interest in contributing! This document provides guidelines for contributing to the AAC Board Viewer project.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/willwade/aac-board-viewer.git
cd aac-board-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Start the demo app in development mode:
```bash
npm run dev
```

4. Build the library:
```bash
npm run build
```

## Project Structure

```
aac-board-viewer/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # React hooks
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── styles.css       # Component styles
│   └── index.ts         # Main export file
├── demo/                # Demo application
├── package.json
├── tsconfig.json
└── README.md
```

## Coding Standards

- Use TypeScript for all new code
- Follow existing code style and conventions
- Add JSDoc comments for exported functions
- Write meaningful commit messages
- Add tests for new features (when test framework is added)

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and commit them
4. Push to your fork: `git push origin feature/my-feature`
5. Create a pull request

## Adding Support for New AAC Formats

To add support for a new AAC format:

1. Add the processor to `@willwade/aac-processors` package
2. Update `getProcessorForFile()` in `src/utils/loaders.ts`
3. Add format to `getSupportedFormats()` in `src/utils/loaders.ts`
4. Test with sample files
5. Update documentation

## Questions?

Feel free to open an issue for questions or discussion.
