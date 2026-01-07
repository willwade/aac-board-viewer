# AAC Board Viewer

A universal React component for displaying AAC (Augmentative and Alternative Communication) boards. Supports multiple file formats and provides an interactive, accessible interface for symbol-based communication.

## Features

- 🎨 **Format Support**: Works with Grid 3, TD Snap, TouchChat, OpenBoard (OBF/OBZ), Asterics Grid, Apple Panels, OPML, Excel, and DOT files
- 🖼️ **Image Support**: Automatically handles embedded images from OBZ and Grid3 files
- 🎯 **Interactive Navigation**: Click buttons to navigate between boards/pages
- 🗣️ **Sentence Building**: Accumulates words in a message bar for speech output
- 🎭 **Smart Grammar**: Displays word forms and predictions when available
- 🌈 **Styling Preservation**: Maintains original colors, fonts, and layouts
- 🌙 **Dark Mode**: Fully supports dark mode with proper contrast
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices
- ⚡ **Zero Dependencies**: Minimal bundle size for fast loading

## Installation

```bash
npm install aac-board-viewer
```

## Quick Start

```tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function App() {
  return (
    <BoardViewer
      tree={aacTreeData}
      initialPageId="page-123"
      showMessageBar={true}
      showEffortBadges={false}
    />
  );
}
```

## Supported File Formats

| Format | Extensions | Description |
|--------|------------|-------------|
| **Grid 3** | `.gridset`, `.gridsetx` | Smartbox Grid 3 boards with embedded images |
| **TD Snap** | `.sps`, `.spb` | Tobii Dynavox Snap Scene pages |
| **TouchChat** | `.ce` | Saltillo TouchChat files |
| **OpenBoard** | `.obf`, `.obz` | CoughDrop's open format with embedded images |
| **Asterics Grid** | `.grd` | ASTERICS Grid files |
| **Apple Panels** | `.plist` | Apple iOS accessibility panels |
| **OPML** | `.opml` | Outline processor markup language |
| **Excel** | `.xlsx`, `.xls` | Microsoft Excel spreadsheets |
| **DOT** | `.dot` | DOT format boards |

## How Image Loading Works

### Background

AAC boards often contain hundreds or thousands of embedded images. Embedding these as base64 data URLs in the JSON response can cause the string to exceed JavaScript's size limits (typically 256MB+ for large boards like "Vocal Flair 60").

### Solution: On-Demand Image Loading

The board viewer uses a hybrid approach to image loading:

#### 1. **Server-Side Processing**

When a file is uploaded:
- The server loads the AAC file and processes it into a tree structure
- Large image data URLs are stripped from the response to avoid size limits
- A unique `loadId` is generated and returned to the client
- The temporary file is stored server-side for later image access

#### 2. **Client-Side Display**

The `BoardViewer` component:
- Receives the tree structure with `loadId`
- For each button, determines the appropriate image source:
  - **Small inline images**: Displayed directly from the response
  - **OBZ images**: Fetched via `/api/image/{loadId}/{imageId}`
  - **Grid3 images**: Fetched via `/api/image/{loadId}/{pageName}/{x}-{y}`

#### 3. **Image API Endpoints**

**OBZ Files:**
```
GET /api/image/{loadId}/{imageId}
```
- Extracts the image from the OBZ's embedded images array
- Returns the raw image data with proper MIME type

**Grid3 Files:**
```
GET /api/image/{loadId}/{pageName}/{x}-{y}
```
- Maps to `Grids/{pageName}/{x}-{y}-0-text-0.png` in the ZIP
- Returns the embedded image with proper MIME type

### Server Implementation Example

```typescript
import { loadAACFromBuffer, getTempFilePath, getFileName } from './aac-loader';
import { ObfProcessor } from '@willwade/aac-processors';
import AdmZip from 'adm-zip';

async function handleImageRequest(req, res) {
  const url = req.url || '';
  const match = url.match(/^\/([^/]+)\/(.+)$/);
  const [, loadId, imageId] = match;

  const tmpPath = getTempFilePath(loadId);
  const filename = getFileName(loadId);
  const zip = new AdmZip(tmpPath);

  if (filename.toLowerCase().endsWith('.gridset')) {
    // Grid3: imageId is "pageName/x-y"
    const decoded = decodeURIComponent(imageId);
    const [, pageName, x, y] = decoded.match(/^([^/]+)\/(\d+)-(\d+)$/);
    const imagePath = `Grids/${pageName}/${x}-${y}-0-text-0.png`;
    const imageEntry = zip.getEntry(imagePath);

    if (imageEntry) {
      const imageData = imageEntry.getData();
      res.setHeader('Content-Type', 'image/png');
      res.end(imageData);
    }
  } else if (filename.toLowerCase().endsWith('.obz')) {
    // OBZ: imageId is the image_id from OBF metadata
    // ... extract from OBF images array
  }
}
```

### Client Implementation

The BoardViewer automatically detects which image loading strategy to use:

```tsx
// In BoardViewer component
const params = button.parameters as {
  image_id?: string;        // For OBZ files
  gridPageName?: string;    // For Grid3 files
};

let apiUrl: string | undefined = undefined;
if (loadId && button.image) {
  // OBZ: Use image_id for large data URLs
  if (button.image.length > 1000 && params.image_id) {
    apiUrl = `/api/image/${loadId}/${params.image_id}`;
  }
  // Grid3: Use page name and coordinates
  else if (params.gridPageName && button.x !== undefined && button.y !== undefined) {
    apiUrl = `/api/image/${loadId}/${params.gridPageName}/${button.x}-${button.y}`;
  }
}

<img src={apiUrl || imageSrc} alt={button.label} />
```

## Props

```typescript
interface BoardViewerProps {
  tree: AACTree;                    // The AAC tree structure (required)
  initialPageId?: string;            // Start page ID (optional)
  showMessageBar?: boolean;          // Show message bar (default: true)
  showEffortBadges?: boolean;        // Show effort badges (default: true)
  showLinkIndicators?: boolean;      // Show navigation indicators (default: true)
  loadId?: string;                   // For fetching images from server
  buttonMetrics?: ButtonMetric[];   // Optional metrics data
  onButtonClick?: (button) => void;  // Button click callback
  onPageChange?: (pageId) => void;   // Page change callback
  className?: string;                // Custom CSS class
}
```

## Styling

The component includes built-in styles that can be imported:

```tsx
import 'aac-board-viewer/styles';
```

Custom styling via CSS:

```css
.aac-board-viewer {
  /* Custom container styles */
}

.aac-board-viewer .button {
  /* Custom button styles */
}
```

Dark mode support:

```html
<div class="dark">
  <BoardViewer tree={tree} />
</div>
```

## Advanced Usage

### Custom Button Handler

```tsx
<BoardViewer
  tree={tree}
  onButtonClick={(button) => {
    console.log('Clicked:', button.label);
    // Handle button click, play sound, etc.
  }}
/>
```

### Page Change Tracking

```tsx
<BoardViewer
  tree={tree}
  onPageChange={(pageId) => {
    console.log('Navigated to:', pageId);
    // Track navigation, save state, etc.
  }}
/>
```

### With Metrics

```tsx
const metrics = [
  { id: 'btn-1', label: 'hello', effort: 1.2 },
  { id: 'btn-2', label: 'yes', effort: 1.0 },
];

<BoardViewer
  tree={tree}
  buttonMetrics={metrics}
  showEffortBadges={true}
/>
```

## Server-Side File Loading

For production use, you'll need a server endpoint to load AAC files:

```typescript
import { loadAACFromBuffer } from 'aac-board-viewer/server';

app.post('/api/load', async (req, res) => {
  const filename = req.headers['x-filename'];
  const buffer = await getRequestBody(req);

  const result = await loadAACFromBuffer(filename, buffer);
  // result.tree, result.format, result.metadata, result.loadId

  res.json(result);
});
```

## Example Projects

### Demo App

A full-featured demo is available in the `demo/` directory:

```bash
cd demo
npm install
npm run dev
```

Visit `http://localhost:3001` to upload and view AAC files.

### CLI Example

```bash
node examples/demo.js path/to/board.gridset
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Performance

- **Bundle size**: ~32KB minified
- **Tree-shakeable**: Only import what you need
- **Lazy loading**: Images loaded on-demand
- **Memory efficient**: Handles large boards (95+ pages, 3000+ buttons)

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

- 📖 [Documentation](https://github.com/willwade/aac-board-viewer)
- 🐛 [Issue Tracker](https://github.com/willwade/aac-board-viewer/issues)
- 💬 [Discussions](https://github.com/willwade/aac-board-viewer/discussions)

## Related Projects

- [AACProcessors-nodejs](https://github.com/willwade/AACProcessors-nodejs) - Backend processor library
- [OpenBoard Format](https://www.openboardformat.org/) - Open board specification
- [Smartbox Grid 3](https://www.smartboxassist.com/) - Grid 3 software

## Acknowledgments

Built for the AAC community to provide universal access to symbol-based communication boards.
