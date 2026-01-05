import React, { useState } from 'react';
import { BoardViewer, useAACFile, getSupportedFormats } from '../src';
import './App.css';

function App() {
  const [selectedFormat, setSelectedFormat] = useState('snap');
  const [fileUrl, setFileUrl] = useState('/files/Core First Scanning.sps');

  const { tree, loading, error } = useAACFile(fileUrl);

  const formats = getSupportedFormats();

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const format = e.target.value;
    setSelectedFormat(format);

    // Update file URL based on format (demo purposes)
    // In a real app, these would be actual files
    switch (format) {
      case 'snap':
        setFileUrl('/files/Core First Scanning.sps');
        break;
      case 'gridset':
        setFileUrl('/files/Beeline.gridset');
        break;
      case 'touchchat':
        setFileUrl('/files/WordPower60 SS_Copy.ce');
        break;
      default:
        setFileUrl('');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AAC Board Viewer Demo</h1>
        <p>Universal AAC board viewer for React</p>

        <div className="controls">
          <label htmlFor="format-select">Select Format:</label>
          <select
            id="format-select"
            value={selectedFormat}
            onChange={handleFormatChange}
          >
            {formats.map((format) => (
              <option key={format.name} value={format.name.toLowerCase()}>
                {format.name} ({format.extensions.join(', ')})
              </option>
            ))}
          </select>

          <div className="file-info">
            Current file: <code>{fileUrl}</code>
          </div>
        </div>
      </header>

      <main className="app-main">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading board...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <h2>Error Loading Board</h2>
            <p>{error.message}</p>
            <p className="error-hint">
              Note: This demo requires files to be served from a backend API.
              Client-side file loading is not yet fully implemented.
            </p>
          </div>
        )}

        {!loading && !error && tree && (
          <div className="board-container">
            <BoardViewer tree={tree} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Supported formats:{' '}
          {formats.map((f) => f.name).join(', ')}
        </p>
        <p>
          <a href="https://github.com/willwade/aac-board-viewer" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' · '}
          <a href="https://github.com/willwade/AACProcessors-nodejs" target="_blank" rel="noopener noreferrer">
            AACProcessors-nodejs
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
