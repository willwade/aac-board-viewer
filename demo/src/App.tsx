import React, { useState, useMemo } from 'react';
import type { AACTree } from 'aac-board-viewer';
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

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useServer, setUseServer] = useState(false);
  const [serverData, setServerData] = useState<{
    tree: AACTree;
    format: string;
    metadata: Record<string, unknown>;
    loadId: string;
    validation?: ValidationResult;
  } | null>(null);

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

  const loadWithServer = async (file: File) => {
    try {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>AAC Board Viewer Demo</h1>
        <p>
          Universal AAC board viewer - Now with browser-based loading!
          <span style={{ marginLeft: '0.5rem', fontSize: '0.85em', color: '#6b7280' }}>
            Powered by AACProcessors v0.1.0
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
        </div>
      </header>

      <main className="app-main">
        <FileUploader onFileLoaded={handleFileLoad} loading={loading} />

        {loading && (
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

        {!loading && !error && currentTree && (
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

        {!loading && !error && !currentTree && (
          <div className="info">
            <h2>Welcome to AAC Board Viewer! 🎉</h2>
            <p>
              <strong>NEW:</strong> Browser-based loading for most formats! Files are processed directly in your browser
              using AACProcessors v0.1.0. No server needed for common formats like .obf, .obz, .gridset, .plist, .grd, .opml, and .dot.
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
import { useAACFileFromFile } from 'aac-board-viewer';

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
            AACProcessors v0.1.0+ for browser support
          </span>
        </p>
      </footer>
    </div>
  );
}

export default App;
