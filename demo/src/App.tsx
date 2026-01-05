import React, { useState } from 'react';
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';
import { FileUploader } from './FileUploader';
import './App.css';

function App() {
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [format, setFormat] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);

  const handleFileLoad = async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);
    setTree(null);
    setFormat(null);
    setMetadata(null);

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
      setTree(result.tree);
      setFormat(result.format || null);
      setMetadata(result.metadata || null);
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
    { name: 'Asterics', extensions: ['.obz'] },
    { name: 'Apple Panels', extensions: ['.plist'] },
    { name: 'OPML', extensions: ['.opml'] },
    { name: 'Excel', extensions: ['.xlsx', '.xls'] },
    { name: 'DOT', extensions: ['.dot'] },
  ];

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
              {metadata?.name && (
                <div>
                  <strong>Board name:</strong> {metadata.name}
                </div>
              )}
            </div>
            <div className="board-container">
              <BoardViewer tree={tree} />
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
                  <li>📊 Effort metrics display</li>
                  <li>🎛️ Toolbar support</li>
                  <li>🌙 Dark mode ready</li>
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
