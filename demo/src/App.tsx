import React, { useState, useMemo } from 'react';
import type { AACTree, AACPage, AACButton } from 'aac-board-viewer';
import {
  BoardViewer,
  useAACFileFromFile,
  getSupportedFormats,
  isBrowserCompatible,
  getBrowserExtensions,
  getNodeOnlyExtensions
} from 'aac-board-viewer';
import 'aac-board-viewer/styles';
import { FileUploader } from './FileUploader';
import './App.css';
import type { ValidationResult, ValidationCheck } from '@willwade/aac-processors/validation';

type SearchResult = {
  button: AACButton;
  page: AACPage;
  pagePath: string;
  searchText: string;
};

function resolveDefaultRootId(tree: AACTree): string | null {
  if (tree.rootId && tree.pages[tree.rootId]) {
    const rootPage = tree.pages[tree.rootId];
    const isToolbar =
      rootPage.name.toLowerCase().includes('toolbar') ||
      rootPage.name.toLowerCase().includes('tool bar');
    if (!isToolbar) {
      return tree.rootId;
    }
  }

  const startPage = Object.values(tree.pages).find(
    (p) => p.name.toLowerCase() === 'start'
  );
  if (startPage) {
    return startPage.id;
  }

  const nonToolbarPage = Object.values(tree.pages).find(
    (p) => !p.name.toLowerCase().includes('toolbar') && !p.name.toLowerCase().includes('tool bar')
  );
  if (nonToolbarPage) {
    return nonToolbarPage.id;
  }

  const pageIds = Object.keys(tree.pages);
  return pageIds.length > 0 ? pageIds[0] : null;
}

function getPageButtons(page: AACPage): AACButton[] {
  if (page.buttons && page.buttons.length > 0) {
    return page.buttons;
  }

  const seen = new Set<string>();
  const buttons: AACButton[] = [];
  page.grid.forEach((row) => {
    row.forEach((button) => {
      if (!button) return;
      if (seen.has(button.id)) return;
      seen.add(button.id);
      buttons.push(button);
    });
  });

  return buttons;
}

function buildPagePathMap(tree: AACTree): Map<string, string[]> {
  const pathMap = new Map<string, string[]>();
  const rootId = resolveDefaultRootId(tree);
  const visited = new Set<string>();
  const parent = new Map<string, string | null>();
  const queue: string[] = [];

  if (rootId) {
    queue.push(rootId);
    parent.set(rootId, null);
  }

  while (queue.length > 0) {
    const pageId = queue.shift();
    if (!pageId || visited.has(pageId)) continue;
    visited.add(pageId);

    const page = tree.pages[pageId];
    if (!page) continue;

    const buttons = getPageButtons(page);
    buttons.forEach((button) => {
      const targetPageId = button.targetPageId || button.semanticAction?.targetId;
      if (targetPageId && tree.pages[targetPageId] && !parent.has(targetPageId)) {
        parent.set(targetPageId, pageId);
        queue.push(targetPageId);
      }
    });
  }

  Object.values(tree.pages).forEach((page) => {
    const pathNames: string[] = [];
    let cursor: string | null | undefined = page.id;
    const guard = new Set<string>();

    while (cursor && parent.has(cursor) && !guard.has(cursor)) {
      guard.add(cursor);
      const pageAtCursor = tree.pages[cursor];
      if (pageAtCursor) {
        pathNames.unshift(pageAtCursor.name || cursor);
      }
      cursor = parent.get(cursor) ?? null;
    }

    if (pathNames.length === 0) {
      pathNames.push(page.name || page.id);
    }

    pathMap.set(page.id, pathNames);
  });

  return pathMap;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useServer, setUseServer] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverData, setServerData] = useState<{
    tree: AACTree;
    format: string;
    metadata: Record<string, unknown>;
    loadId: string;
    validation?: ValidationResult;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navigateToPageId, setNavigateToPageId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<{ pageId: string; buttonId?: string; x?: number; y?: number; label?: string } | null>(null);

  // Use the browser-based hook for loading
  const hookOptions = useMemo(
    () => ({
      enabled: !useServer, // Only use hook when not in server mode
    }),
    [useServer]
  );

  const { tree, loading, error: hookError } = useAACFileFromFile(file, hookOptions);

  // Sync errors
  React.useEffect(() => {
    if (hookError) {
      setError(`Error: ${hookError.message}`);
    } else {
      setError(null);
    }
  }, [hookError]);

  const formats = getSupportedFormats();
  const browserFormats = formats.filter((f) => f.browserCompatible);
  const serverOnlyFormats = formats.filter((f) => !f.browserCompatible);

  const handleFileLoad = async (file: File) => {
    setFile(file);
    setError(null);
    setServerData(null);

    // Check if we should use server mode
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const needsServer = !isBrowserCompatible(ext);

    if (needsServer || useServer) {
      await loadWithServer(file);
    }
    // Otherwise, the hook will handle it in browser
  };

  React.useEffect(() => {
    if (!file) {
      return;
    }
    if (useServer) {
      setError(null);
      void loadWithServer(file);
    } else {
      setServerData(null);
    }
  }, [useServer, file]);

  const loadWithServer = async (file: File) => {
    try {
      setServerLoading(true);
      const response = await fetch('/api/load', {
        method: 'POST',
        headers: {
          'x-filename': encodeURIComponent(file.name),
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const result = await response.json();
      setServerData({
        tree: result.tree as AACTree,
        format: result.format || 'unknown',
        metadata: (result.metadata as Record<string, unknown>) || {},
        loadId: result.loadId || '',
        validation: result.validation as ValidationResult | undefined,
      });
    } catch (err) {
      setError(
        `Server error: ${err instanceof Error ? err.message : 'Unknown error'}\n\n` +
        'The server could not process this file.'
      );
    } finally {
      setServerLoading(false);
    }
  };

  const currentTree = useServer ? serverData?.tree : tree;
  const currentFormat = useServer ? serverData?.format : (file ? '.' + file.name.split('.').pop() : undefined);
  const currentMetadata = useServer ? serverData?.metadata : (tree?.metadata);
  const currentLoadId = useServer ? serverData?.loadId : undefined;
  const currentValidation = useServer ? serverData?.validation : null;

  const fileName = file?.name || '';
  const ext = fileName ? '.' + fileName.split('.').pop()?.toLowerCase() : '';
  const isServerOnlyFormat = ext ? !isBrowserCompatible(ext) : false;

  const pageOptions = currentTree ? Object.values(currentTree.pages) : [];

  const isLoading = useServer ? serverLoading : loading;

  const pagePathMap = useMemo(() => {
    if (!currentTree) {
      return new Map<string, string[]>();
    }
    return buildPagePathMap(currentTree);
  }, [currentTree]);

  const searchIndex = useMemo<SearchResult[]>(() => {
    if (!currentTree) return [];

    const results: SearchResult[] = [];
    Object.values(currentTree.pages).forEach((page) => {
      const pagePathParts = pagePathMap.get(page.id) ?? [page.name || page.id];
      const buttons = getPageButtons(page);
      buttons.forEach((button) => {
        const label = button.label || '';
        const message = button.message || '';
        const searchText = `${label} ${message}`.trim();
        if (!searchText) return;
        results.push({
          button,
          page,
          pagePath: `${pagePathParts.join(' -> ')} -> ${label || message || button.id}`,
          searchText: searchText.toLowerCase(),
        });
      });
    });

    return results;
  }, [currentTree, pagePathMap]);

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return searchIndex
      .filter((result) => result.searchText.includes(query))
      .slice(0, 50);
  }, [searchIndex, searchQuery]);

  React.useEffect(() => {
    if (!navigateToPageId) return;
    const handle = window.setTimeout(() => setNavigateToPageId(null), 0);
    return () => window.clearTimeout(handle);
  }, [navigateToPageId]);

  const handleSearchSelect = (result: SearchResult) => {
    setIsSearchOpen(false);
    setNavigateToPageId(result.page.id);
    setHighlight({
      pageId: result.page.id,
      buttonId: result.button.id,
      x: result.button.x,
      y: result.button.y,
      label: result.button.label,
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AAC Board Viewer Demo</h1>
        <p>
          Universal AAC board viewer - Now with browser-based loading!
          <span style={{ marginLeft: '0.5rem', fontSize: '0.85em', color: '#6b7280' }}>
            Powered by AACProcessors v0.1.6
          </span>
        </p>

        <div className="controls" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="format-list" style={{ fontSize: '0.9rem' }}>
            <strong style={{ color: '#15803d' }}>Browser:</strong> {browserFormats.map((f) => f.name).join(', ')}
          </span>
          <span className="format-list" style={{ fontSize: '0.9rem' }}>
            <strong style={{ color: '#b91c1c' }}>Server-only:</strong> {serverOnlyFormats.map((f) => f.name).join(', ')}
          </span>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.6rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.35rem',
              fontSize: '0.9rem',
            }}
          >
            <input
              type="checkbox"
              checked={useServer}
              onChange={(e) => setUseServer(e.target.checked)}
            />
            Force server mode
          </label>
          {currentTree && (
            <div className="search-box">
              <input
                type="search"
                placeholder="Search for a button…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(Boolean(e.target.value.trim()));
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setIsSearchOpen(true);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                disabled={!searchQuery.trim()}
              >
                {isSearchOpen ? 'Hide' : 'Show'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <FileUploader onFileLoaded={handleFileLoad} loading={loading} />

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading board...</p>
            <p className="loading-hint">
              {useServer ? 'Processing on server...' : 'Processing in browser...'}
            </p>
            <p className="loading-hint">{fileName}</p>
          </div>
        )}

        {error && (
          <div className="error">
            <h2>⚠️ Error Loading File</h2>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{error}</pre>
            {isServerOnlyFormat && !useServer && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.35rem' }}>
                <strong>💡 Tip:</strong> This file format requires server-side processing.
                Enable "Force server mode" above to load it.
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && currentTree && (
          <>
            <div className="board-meta">
              <div>
                <strong>File:</strong> {fileName}
              </div>
              <div>
                <strong>Mode:</strong>{' '}
                <span style={{ color: useServer ? '#b91c1c' : '#15803d' }}>
                  {useServer ? 'Server processing' : 'Browser processing'}
                </span>
              </div>
              {currentFormat && (
                <div>
                  <strong>Detected format:</strong> {currentFormat}
                </div>
              )}
              {currentMetadata && typeof currentMetadata.name === 'string' && (
                <div>
                  <strong>Board name:</strong> {currentMetadata.name}
                </div>
              )}
              {currentMetadata && (
                <div>
                  <strong>Metadata keys:</strong> {Object.keys(currentMetadata).join(', ')}
                </div>
              )}
            </div>

            <div className="board-meta" style={{ gap: '0.5rem 1rem' }}>
              <div>
                <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Home page</label>
                <select
                  value={currentTree?.rootId ?? ''}
                  onChange={(e) => {
                    // You could add page selection logic here
                  }}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '0.35rem' }}
                >
                  <option value="">(auto)</option>
                  {pageOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="board-container">
              <BoardViewer
                tree={currentTree}
                highlight={highlight ?? undefined}
                navigateToPageId={navigateToPageId ?? undefined}
                loadId={currentLoadId}
              />
            </div>

            {currentValidation && (
              <div className="board-meta" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong>Validation</strong>
                <div style={{ fontSize: '0.9rem', color: currentValidation.valid ? '#15803d' : '#b91c1c' }}>
                  {currentValidation.valid ? 'Valid file' : 'Validation failed'} · {currentValidation.errors} errors ·{' '}
                  {currentValidation.warnings} warnings
                </div>
                <ul style={{ marginLeft: '1rem', marginTop: '0.5rem', color: '#374151' }}>
                  {currentValidation.results.map((r: ValidationCheck, idx: number) => (
                    <li key={`${r.type}-${idx}`}>
                      <strong>{r.description}:</strong> {r.valid ? 'ok' : r.error || 'failed'}
                      {r.warnings && r.warnings.length > 0 && (
                        <span> · warnings: {r.warnings.join('; ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !currentTree && (
          <div className="info">
            <h2>Welcome to AAC Board Viewer! 🎉</h2>
            <p>
              <strong>NEW:</strong> Browser-based loading for most formats! Files are processed directly in your browser
              using AACProcessors v0.1.6. No server needed for common formats like .obf, .obz, .gridset, .plist, .grd, .opml, and .dot.
              SQLite-backed formats (.sps, .spb, .ce) work in browser once SQL.js is configured.
            </p>
            <div className="info-sections">
              <div className="info-card">
                <h3>🟢 Browser-Compatible Formats</h3>
                <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '0.5rem' }}>
                  Processed directly in your browser - faster and more private!
                </p>
                <ul>
                  {browserFormats.map((f) => (
                    <li key={f.name}>
                      <strong>{f.name}</strong> - {f.extensions.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="info-card">
                <h3>🔴 Server-Only Formats</h3>
                <p style={{ fontSize: '0.9rem', color: '#b91c1c', marginBottom: '0.5rem' }}>
                  Require server-side processing (enable "Force server mode")
                </p>
                <ul>
                  {serverOnlyFormats.map((f) => (
                    <li key={f.name}>
                      <strong>{f.name}</strong> - {f.extensions.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="info-card">
                <h3>✨ Features</h3>
                <ul>
                  <li>🚀 Browser-based processing (no server needed!)</li>
                  <li>🎨 Preserves original styling</li>
                  <li>🔗 Interactive navigation</li>
                  <li>🗣️ Sentence building</li>
                  <li>📊 Cognitive effort metrics</li>
                  <li>🌙 Dark-mode friendly</li>
                </ul>
              </div>
              <div className="info-card">
                <h3>🚀 Usage</h3>
                <pre><code>{`// Browser-based loading
import { configureBrowserSqlJs, useAACFileFromFile } from 'aac-board-viewer';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

configureBrowserSqlJs({
  locateFile: () => sqlWasmUrl,
});

function MyViewer() {
  const [file, setFile] = useState<File | null>(null);
  const { tree, loading } = useAACFileFromFile(file);

  return (
    <input type="file" onChange={(e) => setFile(e.target.files[0])} />
    {tree && <BoardViewer tree={tree} />}
  );
}

// Server-side loading
import { loadAACFile } from 'aac-board-viewer';

const tree = await loadAACFile('/path/to/file.sps');`}</code></pre>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          <a href="https://github.com/willwade/aac-board-viewer" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' · '}
          <a href="https://github.com/willwade/AACProcessors-nodejs" target="_blank" rel="noopener noreferrer">
            AACProcessors-nodejs
          </a>
          {' · '}
          <a href="https://www.npmjs.com/package/aac-board-viewer" target="_blank" rel="noopener noreferrer">
            npm
          </a>
          {' · '}
          <span style={{ color: '#6b7280', fontSize: '0.9em' }}>
            AACProcessors v0.1.6+ for browser support
          </span>
        </p>
      </footer>

      {isSearchOpen && (
        <div
          className="search-modal-backdrop"
          onClick={() => setIsSearchOpen(false)}
          role="presentation"
        >
          <div
            className="search-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search results"
          >
            <div className="search-modal-header">
              <div>
                <strong>Search results</strong>
                <div className="search-modal-subtitle">
                  {filteredResults.length} result{filteredResults.length === 1 ? '' : 's'} for &quot;{searchQuery}&quot;
                </div>
              </div>
              <button type="button" onClick={() => setIsSearchOpen(false)}>
                Close
              </button>
            </div>
            {filteredResults.length === 0 ? (
              <div className="search-empty">No matches found.</div>
            ) : (
              <ul className="search-results">
                {filteredResults.map((result) => (
                  <li key={`${result.page.id}-${result.button.id}`}>
                    <button type="button" onClick={() => handleSearchSelect(result)}>
                      <span className="search-path">{result.pagePath}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
