# Release Notes

## Version 0.1.0 - Initial Release

### Overview

AAC Board Viewer is a universal React component for displaying and interacting with Augmentative and Alternative Communication (AAC) boards from multiple file formats.

### Features

#### 🎯 Universal Format Support
- **Grid 3** (`.gridset`) - Smartbox Grid 3 communication boards
- **TD Snap** (`.sps`, `.spb`) - Tobii Dynavox Snap files
- **TouchChat** (`.ce`) - Saltillo TouchChat files
- **OpenBoard** (`.obf`, `.obz`) - OpenBoard Format (OBZ/OBF)
- **Asterics Grid** - Asterics Grid files in OBZ format
- **Apple Panels** (`.plist`) - Apple iOS Panels with automatic grid positioning
- **OPML** (`.opml`) - OPML outline files
- **Excel** (`.xlsx`, `.xls`) - Excel spreadsheet boards
- **DOT** (`.dot`) - DOT graph visualization files

#### 🎨 Complete Board Rendering
- Preserves original styling (colors, fonts, borders, sizes)
- Accurate grid layout representation
- Toolbar support (side-by-side layout when present)
- Responsive design for mobile and desktop
- Dark mode support
- Accessible keyboard navigation

#### 🔗 Interactive Features
- Click-to-navigate between pages
- Sentence building as you tap buttons
- Real-time word count tracking
- Effort score display per button
- Average effort calculation
- Back/forward navigation through page history
- Link indicators for navigation buttons

#### 📊 Metrics Integration
- Cognitive effort metrics per button
- Support for direct selection
- Support for scanning access methods (linear, row-column, block)
- Error correction modeling
- Configurable scanning patterns

#### 🛠️ Developer Experience
- Full TypeScript support
- React hooks for easy integration
- Server and client-side rendering support
- No database dependencies
- Lightweight component (~50KB)
- Comprehensive documentation
- Demo application included

### Installation

```bash
npm install aac-board-viewer
```

### Quick Start

```tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MyViewer({ tree }) {
  return <BoardViewer tree={tree} />;
}
```

### With File Loading

```tsx
import { BoardViewer, useAACFile } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MyViewer({ fileUrl }) {
  const { tree, loading, error } = useAACFile(fileUrl);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <BoardViewer tree={tree} />;
}
```

### With Metrics

```tsx
import { BoardViewer, useAACFileWithMetrics } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MetricsViewer({ fileUrl }) {
  const { tree, metrics, loading, error } = useAACFileWithMetrics(
    fileUrl,
    { accessMethod: 'direct' }
  );

  return (
    <BoardViewer
      tree={tree}
      buttonMetrics={metrics}
      showEffortBadges={true}
    />
  );
}
```

### API

#### BoardViewer Component

```typescript
interface BoardViewerProps {
  tree: AACTree;
  buttonMetrics?: ButtonMetric[] | null;
  showMessageBar?: boolean;
  showEffortBadges?: boolean;
  showLinkIndicators?: boolean;
  onButtonClick?: (button: AACButton) => void;
  onPageChange?: (pageId: string) => void;
  className?: string;
}
```

#### Hooks

- `useAACFile(url)` - Load AAC file from URL
- `useAACFileWithMetrics(url, options)` - Load file with metrics
- `useMetrics(tree, options)` - Calculate metrics for tree
- `useSentenceBuilder()` - Manage sentence state

#### Utilities

- `loadAACFile(filepath)` - Load from file path (server-side)
- `loadAACFileFromURL(url)` - Load from URL (client-side)
- `calculateMetrics(tree, options)` - Calculate effort metrics
- `getSupportedFormats()` - Get list of supported formats

### Special Features

#### Apple Panels Automatic Grid Conversion

Apple Panels files use pixel-based positioning. The viewer automatically:
- Parses the `Rect` format: `"{{x, y}, {width, height}}"`
- Converts pixel coordinates to grid cells (25px each)
- Handles multi-cell buttons (width/height spans)
- Creates proper 2D grid layout

This means Apple Panels display perfectly alongside other grid-based formats!

#### Format Detection

The library automatically detects file format from extension and uses the appropriate processor:

```typescript
// Automatically detected and processed
const tree = await loadAACFile('/path/to/file.sps');  // SNAP
const tree = await loadAACFile('/path/to/file.gridset');  // GridSet
const tree = await loadAACFile('/path/to/file.plist');  // Apple Panels
```

### Dependencies

- React 18+
- @willwade/aac-processors (for file processing)

### Peer Dependencies

- React 18.0.0 or higher
- React DOM 18.0.0 or higher

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

### What's Next

Future releases may include:
- Additional format support
- Advanced customization options
- More metrics calculation options
- Performance optimizations
- Additional accessibility features

### Documentation

- [README](https://github.com/willwade/aac-board-viewer/blob/main/README.md)
- [Examples](https://github.com/willwade/aac-board-viewer/blob/main/EXAMPLES.md)
- [Setup Guide](https://github.com/willwade/aac-board-viewer/blob/main/SETUP.md)
- [Contributing](https://github.com/willwade/aac-board-viewer/blob/main/CONTRIBUTING.md)

### Related Projects

- [@willwade/aac-processors](https://github.com/willwade/AACProcessors-nodejs) - Core AAC file processing library
- [aac-metrics-node](https://github.com/willwade/aac-metrics-node) - Metrics calculation and comparison

### Acknowledgments

Built on top of the excellent [@willwade/aac-processors](https://github.com/willwade/AACProcessors-nodejs) library.

Special thanks to the AAC community for feedback and testing.

### License

MIT License - See [LICENSE](https://github.com/willwade/aac-board-viewer/blob/main/LICENSE) file for details.

### Support

- **Issues**: [GitHub Issues](https://github.com/willwade/aac-board-viewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/willwade/aac-board-viewer/discussions)

---

**Note**: This is the initial release. Please report any issues or feature requests on GitHub!
