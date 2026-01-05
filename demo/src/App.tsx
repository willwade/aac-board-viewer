import React, { useState } from 'react';
import type { AACTree } from 'aac-board-viewer';
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';
import { FileUploader } from './FileUploader';
import './App.css';

function App() {
  const [tree, setTree] = useState<AACTree | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [format, setFormat] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
  const [homePageId, setHomePageId] = useState<string | null>(null);

  const handleFileLoad = async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setTree(null);
    setFormat(null);
    setMetadata(null);
    setHomePageId(null);

    try {
      const response = await fetch('/api/load', {
        method: 'POST',
        headers: {
          'x-filename': encodeURIComponent(file.name),
        },
        body: file,
      });

      if (!response.ok) {
        let errText = await response.text();
        try {
          const parsed = JSON.parse(errText);
          errText = parsed.message || errText;
        } catch {
          // Not JSON
        }
        throw new Error(errText || 'Failed to process file on server');
      }

      const result = await response.json();
      setTree(result.tree as AACTree);
      setFormat(result.format || null);
      setMetadata((result.metadata as Record<string, unknown>) || null);
      if (result.tree?.rootId) {
        setHomePageId(result.tree.rootId);
      } else {
        const firstPage = Object.keys(result.tree?.pages || {})[0];
        setHomePageId(firstPage || null);
      }
    } catch (err) {
      setError(
        `Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}\n\n` +
        'The server-side processor could not load this file. Please check the format and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formats = [
    { name: 'Grid 3', extensions: ['.gridset'] },
    { name: 'TD Snap', extensions: ['.sps', '.spb'] },
    { name: 'TouchChat', extensions: ['.ce'] },
    { name: 'OpenBoard', extensions: ['.obf', '.obz'] },
    { name: 'Asterics', extensions: ['.grd'] },
    { name: 'Apple Panels', extensions: ['.plist'] },
    { name: 'OPML', extensions: ['.opml'] },
    { name: 'Excel', extensions: ['.xlsx', '.xls'] },
    { name: 'DOT', extensions: ['.dot'] },
  ];

  const pageOptions = tree ? Object.values(tree.pages) : [];

  return (
    <div className="app">
      <header className="app-header">
        <h1>AAC Board Viewer Demo</h1>
        <p>Universal AAC board viewer for React - Upload your AAC file to test</p>

        <div className="controls">
          <span className="format-list">
            Supports:{' '}
            {formats.map((f) => f.name).join(', ')}
          </span>
        </div>
      </header>

      <main className="app-main">
        <FileUploader onFileLoaded={handleFileLoad} loading={loading} />

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading board...</p>
            <p className="loading-hint">Processing {fileName}</p>
          </div>
        )}

        {error && (
          <div className="error">
            <h2>ℹ️ File Upload Demo</h2>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{error}</pre>
          </div>
        )}

        {!loading && !error && tree && (
          <>
            <div className="board-meta">
              <div>
                <strong>File:</strong> {fileName}
              </div>
              {format && (
                <div>
                  <strong>Detected format:</strong> {format}
                </div>
              )}
              {metadata && typeof (metadata as Record<string, unknown>).name === 'string' && (
                <div>
                  <strong>Board name:</strong>{' '}
                  {(metadata as Record<string, unknown>).name as string}
                </div>
              )}
              {metadata && (
                <div>
                  <strong>Metadata keys:</strong>{' '}
                  {Object.keys(metadata as Record<string, unknown>).join(', ')}
                </div>
              )}
            </div>

            <div className="board-meta" style={{ gap: '0.5rem 1rem' }}>
              <div>
                <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Home page</label>
                <select
                  value={homePageId ?? ''}
                  onChange={(e) => setHomePageId(e.target.value || null)}
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
              {metadata && (
                <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                  <strong>Metadata:</strong>{' '}
                  <span>
                    {(Object.entries(metadata) as Array<[string, unknown]>)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(' • ')}
                  </span>
                </div>
              )}
            </div>
            <div className="board-container">
              <BoardViewer tree={tree} initialPageId={homePageId || undefined} />
            </div>
          </>
        )}

        {!loading && !error && !tree && (
          <div className="info">
            <h2>Welcome to AAC Board Viewer! 🎉</h2>
            <p>Upload any AAC file above to see the viewer in action. Files are parsed on the local server using @willwade/aac-processors.</p>
            <div className="info-sections">
              <div className="info-card">
                <h3>📁 Supported Formats</h3>
                <ul>
                  {formats.map((f) => (
                    <li key={f.name}>
                      <strong>{f.name}</strong> - {f.extensions.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="info-card">
                <h3>✨ Features</h3>
                <ul>
                  <li>🎨 Preserves original styling</li>
                  <li>🔗 Interactive navigation</li>
                  <li>🗣️ Sentence building</li>
                  <li>🌙 Dark-mode friendly (add a parent <code>dark</code> class)</li>
                </ul>
              </div>
              <div className="info-card">
                <h3>🚀 Usage</h3>
                <pre><code>{`import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

<BoardViewer tree={treeData} />`}</code></pre>
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
        </p>
      </footer>
    </div>
  );
}

export default App;
