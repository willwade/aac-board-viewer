import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function FileUploader({ onFileLoaded, loading }) {
    const [dragActive, setDragActive] = useState(false);
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        }
        else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileLoaded(e.dataTransfer.files[0]);
        }
    };
    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFileLoaded(e.target.files[0]);
        }
    };
    return (_jsx("div", { className: "file-uploader", children: _jsxs("div", { className: `drop-zone ${dragActive ? 'active' : ''}`, onDragEnter: handleDrag, onDragLeave: handleDrag, onDragOver: handleDrag, onDrop: handleDrop, children: [_jsx("input", { type: "file", id: "file-upload", accept: ".gridset,.sps,.spb,.ce,.obf,.obz,.grd,.plist,.opml,.xlsx,.xls,.dot", onChange: handleChange, disabled: loading, style: { display: 'none' } }), _jsxs("label", { htmlFor: "file-upload", className: "drop-zone-content", children: [_jsx("div", { className: "upload-icon", children: "\uD83D\uDCC1" }), _jsx("p", { className: "upload-text", children: loading ? 'Loading...' : 'Drop AAC file here or click to browse' }), _jsx("p", { className: "upload-hint", children: "Supports: .gridset, .sps, .spb, .ce, .obf, .obz, .plist, .opml, .xlsx, .xls, .dot" })] })] }) }));
}
