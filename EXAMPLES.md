# Usage Examples

This document provides practical examples for using the AAC Board Viewer component.

## Table of Contents

- [Basic Usage](#basic-usage)
- [With File Loading](#with-file-loading)
- [With Metrics](#with-metrics)
- [Server-Side Rendering](#server-side-rendering)
- [Custom Styling](#custom-styling)
- [Event Handling](#event-handling)
- [Multiple Boards](#multiple-boards)

## Basic Usage

The simplest way to use the board viewer is to pass a pre-loaded tree:

```tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MyComponent({ treeData }) {
  return (
    <div>
      <h1>My AAC Board</h1>
      <BoardViewer tree={treeData} />
    </div>
  );
}
```

## With File Loading

### Client-Side Loading

```tsx
import { BoardViewer, configureBrowserSqlJs, useAACFile } from 'aac-board-viewer';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import 'aac-board-viewer/styles';

configureBrowserSqlJs({
  locateFile: () => sqlWasmUrl,
});

function BoardViewerFromURL({ fileUrl }) {
  const { tree, loading, error } = useAACFile(fileUrl);

  if (loading) return <div>Loading board...</div>;
  if (error) return <div>Error loading file: {error.message}</div>;

  return <BoardViewer tree={tree} />;
}

// Usage
<BoardViewerFromURL fileUrl="/api/boards/my-board.sps" />
```

### Server-Side Loading (Next.js)

```tsx
// app/boards/[id]/page.tsx
import { BoardViewer } from 'aac-board-viewer';
import { loadAACFile } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

export default async function BoardPage({ params }) {
  const tree = await loadAACFile(`/path/to/boards/${params.id}.sps`);

  return (
    <div>
      <h1>Board Viewer</h1>
      <BoardViewer tree={tree} />
    </div>
  );
}
```

## With Metrics

### Basic Metrics

```tsx
import { BoardViewer, useAACFileWithMetrics } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function ViewerWithMetrics({ fileUrl }) {
  const { tree, metrics, loading, error } = useAACFileWithMetrics(
    fileUrl,
    { accessMethod: 'direct' }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <BoardViewer
      tree={tree}
      buttonMetrics={metrics}
      showEffortBadges={true}
    />
  );
}
```

### With Scanning Configuration

```tsx
import { BoardViewer, useAACFileWithMetrics } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function ScanningViewer({ fileUrl }) {
  const { tree, metrics, loading, error } = useAACFileWithMetrics(
    fileUrl,
    {
      accessMethod: 'scanning',
      scanningConfig: {
        pattern: 'row-column',
        selectionMethod: 'auto-1-switch',
        errorCorrection: true,
      },
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <BoardViewer
      tree={tree}
      buttonMetrics={metrics}
      showEffortBadges={true}
    />
  });
}
```

## Server-Side Rendering

### Next.js App Router

```tsx
// app/viewer/page.tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

async function getBoardData() {
  // Fetch your board data from API, database, or file system
  const response = await fetch('https://api.example.com/boards/1');
  return response.json();
}

export default async function ViewerPage() {
  const tree = await getBoardData();

  return (
    <div className="p-4">
      <BoardViewer tree={tree} showMessageBar={true} />
    </div>
  );
}
```

### Next.js Pages Router

```tsx
// pages/viewer.tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

export async function getServerSideProps() {
  // Load your board data
  const tree = await loadBoardData();

  return {
    props: {
      tree,
    },
  };
}

export default function ViewerPage({ tree }) {
  return <BoardViewer tree={tree} />;
}
```

## Custom Styling

### Custom Class Names

```tsx
<BoardViewer
  tree={tree}
  className="my-custom-viewer"
/>
```

### CSS Override

```css
/* MyBoardViewer.css */
.my-custom-viewer {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.my-custom-viewer button {
  transition: transform 0.2s ease;
}
```

## Event Handling

### Track Button Clicks

```tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function AnalyticsViewer({ tree }) {
  const handleButtonClick = (button) => {
    // Send analytics event
    console.log('Button clicked:', button.label);

    // Track in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'button_click', {
        button_label: button.label,
        button_id: button.id,
      });
    }
  };

  const handlePageChange = (pageId) => {
    console.log('Navigated to page:', pageId);
  };

  return (
    <BoardViewer
      tree={tree}
      onButtonClick={handleButtonClick}
      onPageChange={handlePageChange}
    />
  );
}
```

### Custom Message Handling

```tsx
import { BoardViewer, useSentenceBuilder } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function CustomMessageViewer({ tree }) {
  const { message, wordCount, effort, clear } = useSentenceBuilder();

  const handleButtonClick = (button) => {
    // Custom logic for handling button clicks
    const word = button.message || button.label;
    const buttonEffort = 1; // Could come from metrics

    // Add to sentence
    // ... your custom logic

    // Play sound effect
    playClickSound();
  };

  return (
    <div>
      <div className="message-bar">
        <p>{message || 'Start building...'}</p>
        <p>Words: {wordCount} | Effort: {effort.toFixed(2)}</p>
        <button onClick={clear}>Clear</button>
      </div>

      <BoardViewer
        tree={tree}
        onButtonClick={handleButtonClick}
        showMessageBar={false}
      />
    </div>
  );
}
```

## Multiple Boards

```tsx
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function MultiBoardViewer({ boards }) {
  const [activeBoard, setActiveBoard] = useState(0);

  return (
    <div>
      <div className="board-selector">
        {boards.map((board, index) => (
          <button
            key={index}
            onClick={() => setActiveBoard(index)}
            className={index === activeBoard ? 'active' : ''}
          >
            {board.name}
          </button>
        ))}
      </div>

      <BoardViewer tree={boards[activeBoard].tree} />
    </div>
  );
}
```

## Complete Example: Full-Featured Viewer

```tsx
import { useState } from 'react';
import {
  BoardViewer,
  useAACFileWithMetrics,
  getSupportedFormats,
} from 'aac-board-viewer';
import 'aac-board-viewer/styles';

function FullFeaturedViewer({ fileUrl }) {
  const [showMetrics, setShowMetrics] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [showMessageBar, setShowMessageBar] = useState(true);

  const { tree, metrics, loading, error, reload } = useAACFileWithMetrics(
    fileUrl,
    { accessMethod: 'direct' }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <label>
          <input
            type="checkbox"
            checked={showMetrics}
            onChange={(e) => setShowMetrics(e.target.checked)}
          />
          Show Metrics
        </label>
        <label>
          <input
            type="checkbox"
            checked={showLinks}
            onChange={(e) => setShowLinks(e.target.checked)}
          />
          Show Links
        </label>
        <label>
          <input
            type="checkbox"
            checked={showMessageBar}
            onChange={(e) => setShowMessageBar(e.target.checked)}
          />
          Show Message Bar
        </label>
        <button onClick={reload}>Reload</button>
      </div>

      {/* Board Viewer */}
      <BoardViewer
        tree={tree}
        buttonMetrics={showMetrics ? metrics : null}
        showEffortBadges={showMetrics}
        showLinkIndicators={showLinks}
        showMessageBar={showMessageBar}
      />
    </div>
  );
}
```

## Tips and Best Practices

1. **Always handle loading and error states** when using hooks
2. **Use server-side loading** for better performance when possible
3. **Provide file URLs from your backend** rather than exposing full file paths
4. **Consider memoizing** tree data if passing between components
5. **Test with different file formats** to ensure compatibility
6. **Handle accessibility** by providing proper ARIA labels and keyboard navigation

## Troubleshooting

### Files not loading
- Ensure CORS headers are set on your API/server
- Check that the file URL is correct and accessible
- Verify the file format is supported

### Styling issues
- Import the CSS file: `import 'aac-board-viewer/styles';`
- Check for CSS conflicts with your application
- Ensure Tailwind CSS is configured if using

### Metrics not showing
- Verify metrics are calculated: `console.log(metrics)`
- Check `showEffortBadges` prop is true
- Ensure `buttonMetrics` array is passed to BoardViewer
