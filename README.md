# AAC Board Viewer

Universal AAC (Augmentative and Alternative Communication) board viewer component for React. Display and interact with communication boards from multiple AAC systems.

## Supported Formats

- **Grid 3** (`.gridset` files)
- **TouchChat** (`.ce` files)
- **TD Snap** (`.sps`, `.spb` files)
- **OpenBoard** (`.obf`, `.obz` files)
- **Asterics Grid** (`.grd` files)
- **Apple Panels** (`.plist` files)
- **OPML** (`.opml` files)
- **Excel** (`.xlsx` boards)
- **DOT files** (`.dot` visualizations)

## Features

- 🎯 **Universal Support** - Works with all major AAC file formats
- 📱 **Responsive Design** - Mobile-friendly with touch support
- 🎨 **Preserves Styling** - Maintains original colors, fonts, and layouts
- 🔗 **Interactive Navigation** - Click buttons to navigate between pages
- 🗣️ **Sentence Building** - Tap buttons to build sentences
- 📊 **Effort Metrics** - Display cognitive effort scores per button
- 🎛️ **Toolbar Support** - Side-by-side toolbar and content display
- 🔧 **Customizable** - Flexible styling and behavior options

## Installation

```bash
npm install aac-board-viewer
```

Or with yarn:

```bash
yarn add aac-board-viewer
```

## Quick Start

### Client-Side Usage

```tsx
import { BoardViewer, useAACFile } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MyViewer() {
  const { tree, loading, error } = useAACFile('/path/to/file.sps');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <BoardViewer tree={tree} />;
}
```

### Server-Side / API Usage

```tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MyViewer({ treeData }) {
  return (
    <BoardViewer
      tree={treeData}
      buttonMetrics={metricsData}
      showMessageBar={true}
      showEffortBadges={true}
    />
  );
}
```

### With Metrics

```tsx
import { BoardViewer, loadAACFile, calculateMetrics } from 'aac-board-viewer';

function MetricsViewer({ filePath }) {
  const [tree, setTree] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    async function load() {
      const loadedTree = await loadAACFile(filePath);
      const calculatedMetrics = await calculateMetrics(loadedTree);

      setTree(loadedTree);
      setMetrics(calculatedMetrics);
    }
    load();
  }, [filePath]);

  if (!tree) return <div>Loading...</div>;

  return (
    <BoardViewer
      tree={tree}
      buttonMetrics={metrics}
      showEffortBadges={true}
    />
  );
}
```

## Props

### BoardViewer

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

### AACTree

```typescript
interface AACTree {
  pages: { [key: string]: AACPage };
  rootId?: string;
  toolbarId?: string;
  metadata?: {
    format?: string;
    name?: string;
    description?: string;
    [key: string]: any;
  };
}
```

## Advanced Usage

### Custom Styling

```tsx
<BoardViewer
  tree={tree}
  className="my-custom-board"
/>
```

### Event Handling

```tsx
<BoardViewer
  tree={tree}
  onButtonClick={(button) => {
    console.log('Button clicked:', button.label);
    // Track analytics, play sound, etc.
  }}
  onPageChange={(pageId) => {
    console.log('Page changed to:', pageId);
    // Track navigation
  }}
/>
```

### Hide Message Bar

```tsx
<BoardViewer
  tree={tree}
  showMessageBar={false}
/>
```

## File Loading

The library provides utilities for loading AAC files:

### Client-Side Loading

```tsx
import { useAACFile } from 'aac-board-viewer';

function Viewer({ fileUrl }) {
  const { tree, loading, error } = useAACFile(fileUrl);

  // ...
}
```

### Programmatic Loading

```tsx
import { loadAACFile } from 'aac-board-viewer';

const tree = await loadAACFile('/path/to/file.gridset');
```

### From File Input

```tsx
import { loadAACFileFromFile } from 'aac-board-viewer';

function FileInput() {
  const handleChange = async (e) => {
    const file = e.target.files[0];
    const tree = await loadAACFileFromFile(file);
    // Use tree...
  };

  return <input type="file" onChange={handleChange} />;
}
```

## Metrics Calculation

Calculate cognitive effort metrics for buttons:

```tsx
import { calculateMetrics } from 'aac-board-viewer';

const metrics = await calculateMetrics(tree, {
  accessMethod: 'direct', // or 'scanning'
  scanningConfig: {
    pattern: 'row-column', // 'linear', 'row-column', 'block'
    selectionMethod: 'auto-1-switch',
    errorCorrection: false,
  },
});

// metrics is an array of ButtonMetric objects:
// [{ id, label, effort, count, is_word, level }, ...]
```

## Format-Specific Notes

### Apple Panels

Apple Panels use free-form positioning. The viewer automatically:
- Converts absolute positioning to grid layout
- Calculates appropriate grid dimensions
- Preserves original button placement

### Asterics Grid

Asterics files (`.grd`) are automatically detected and processed using the Asterics Grid processor.

### GridSet / SNAP / TouchChat

These formats use native grid layouts and are displayed as-is, preserving:
- Grid dimensions (rows × columns)
- Button colors and borders
- Font sizes and styles
- Navigation links between pages

## Development

```bash
# Install dependencies
npm install

# Run demo app
npm run dev

# Build library
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

## Examples

See the `/demo` directory for complete examples:
- Basic viewer
- With metrics
- Multiple formats
- Server-side rendering

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see LICENSE file for details.

## Related Packages

- [@willwade/aac-processors](https://github.com/willwade/AACProcessors-nodejs) - Core AAC file processing library

## Support

- Issues: [GitHub Issues](https://github.com/willwade/aac-board-viewer/issues)
- Documentation: [Full Docs](https://github.com/willwade/aac-board-viewer/wiki)
