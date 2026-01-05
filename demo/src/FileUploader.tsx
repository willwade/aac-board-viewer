import React, { useState } from 'react';

interface FileUploaderProps {
  onFileLoaded: (file: File) => void;
  loading: boolean;
}

export function FileUploader({ onFileLoaded, loading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileLoaded(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileLoaded(e.target.files[0]);
    }
  };

  return (
    <div className="file-uploader">
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept=".gridset,.sps,.spb,.ce,.obf,.obz,.grd,.plist,.opml,.xlsx,.xls,.dot"
          onChange={handleChange}
          disabled={loading}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload" className="drop-zone-content">
          <div className="upload-icon">📁</div>
          <p className="upload-text">
            {loading ? 'Loading...' : 'Drop AAC file here or click to browse'}
          </p>
          <p className="upload-hint">
            Supports: .gridset, .sps, .spb, .ce, .obf, .obz, .plist, .opml, .xlsx, .xls, .dot
          </p>
        </label>
      </div>
    </div>
  );
}
