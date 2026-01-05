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

  const handleFileLoad = async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // For now, we need to use the processors
      // Since we're client-side, we'll need to handle this differently
      // For demo purposes, let's try to read text files
      const text = new TextDecoder().decode(uint8Array);

      // Show what we got
      console.log('File loaded:', file.name, file.size, 'bytes');
      console.log('First 500 chars:', text.substring(0, 500));

      setError(
        `File "${file.name}" loaded (${(file.size / 1024).toFixed(2)} KB).\n\n` +
        'Client-side file processing is coming soon! For now, this demo shows the UI.\n\n' +
        'To test with real files, you can:\n' +
        '1. Use the library in your backend application\n' +
        '2. Serve files via an API endpoint\n' +
        '3. Check the EXAMPLES.md for integration examples'
      );
    } catch (err) {
      setError(
        `Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}\n\n` +
        'Note: Full client-side file processing requires additional setup.\n' +
        'See SETUP.md for server-side integration examples.'
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
          <div className="board-container">
            <BoardViewer tree={tree} />
          </div>
        )}

        {!loading && !error && !tree && (
          <div className="info">
            <h2>Welcome to AAC Board Viewer! 🎉</h2>
            <p>Upload any AAC file above to see the viewer in action.</p>
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
