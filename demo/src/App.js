import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { BoardViewer, useAACFileFromFile, getSupportedFormats, isBrowserCompatible } from 'aac-board-viewer';
import 'aac-board-viewer/styles';
import { FileUploader } from './FileUploader';
import './App.css';
function App() {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [useServer, setUseServer] = useState(false);
    const [serverData, setServerData] = useState(null);
    // Use the browser-based hook for loading
    const { tree, loading, error: hookError } = useAACFileFromFile(file, {
        enabled: !useServer, // Only use hook when not in server mode
    });
    // Sync errors
    React.useEffect(() => {
        if (hookError) {
            setError(`Error: ${hookError.message}`);
        }
        else {
            setError(null);
        }
    }, [hookError]);
    const formats = getSupportedFormats();
    const browserFormats = formats.filter((f) => f.browserCompatible);
    const serverOnlyFormats = formats.filter((f) => !f.browserCompatible);
    const handleFileLoad = async (file) => {
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
    const loadWithServer = async (file) => {
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
                tree: result.tree,
                format: result.format || 'unknown',
                metadata: result.metadata || {},
                loadId: result.loadId || '',
                validation: result.validation,
            });
        }
        catch (err) {
            setError(`Server error: ${err instanceof Error ? err.message : 'Unknown error'}\n\n` +
                'The server could not process this file.');
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
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "AAC Board Viewer Demo" }), _jsxs("p", { children: ["Universal AAC board viewer - Now with browser-based loading!", _jsx("span", { style: { marginLeft: '0.5rem', fontSize: '0.85em', color: '#6b7280' }, children: "Powered by AACProcessors v0.1.0" })] }), _jsxs("div", { className: "controls", style: { flexWrap: 'wrap', gap: '0.5rem' }, children: [_jsxs("span", { className: "format-list", style: { fontSize: '0.9rem' }, children: [_jsx("strong", { style: { color: '#15803d' }, children: "Browser:" }), " ", browserFormats.map((f) => f.name).join(', ')] }), _jsxs("span", { className: "format-list", style: { fontSize: '0.9rem' }, children: [_jsx("strong", { style: { color: '#b91c1c' }, children: "Server-only:" }), " ", serverOnlyFormats.map((f) => f.name).join(', ')] }), _jsxs("label", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.4rem 0.6rem',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '0.35rem',
                                    fontSize: '0.9rem',
                                }, children: [_jsx("input", { type: "checkbox", checked: useServer, onChange: (e) => setUseServer(e.target.checked) }), "Force server mode"] })] })] }), _jsxs("main", { className: "app-main", children: [_jsx(FileUploader, { onFileLoaded: handleFileLoad, loading: loading }), loading && (_jsxs("div", { className: "loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading board..." }), _jsx("p", { className: "loading-hint", children: useServer ? 'Processing on server...' : 'Processing in browser...' }), _jsx("p", { className: "loading-hint", children: fileName })] })), error && (_jsxs("div", { className: "error", children: [_jsx("h2", { children: "\u26A0\uFE0F Error Loading File" }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit' }, children: error }), isServerOnlyFormat && !useServer && (_jsxs("div", { style: { marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.35rem' }, children: [_jsx("strong", { children: "\uD83D\uDCA1 Tip:" }), " This file format requires server-side processing. Enable \"Force server mode\" above to load it."] }))] })), !loading && !error && currentTree && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "board-meta", children: [_jsxs("div", { children: [_jsx("strong", { children: "File:" }), " ", fileName] }), _jsxs("div", { children: [_jsx("strong", { children: "Mode:" }), ' ', _jsx("span", { style: { color: useServer ? '#b91c1c' : '#15803d' }, children: useServer ? 'Server processing' : 'Browser processing' })] }), currentFormat && (_jsxs("div", { children: [_jsx("strong", { children: "Detected format:" }), " ", currentFormat] })), currentMetadata && typeof currentMetadata.name === 'string' && (_jsxs("div", { children: [_jsx("strong", { children: "Board name:" }), " ", currentMetadata.name] })), currentMetadata && (_jsxs("div", { children: [_jsx("strong", { children: "Metadata keys:" }), " ", Object.keys(currentMetadata).join(', ')] }))] }), _jsx("div", { className: "board-meta", style: { gap: '0.5rem 1rem' }, children: _jsxs("div", { children: [_jsx("label", { style: { fontWeight: 600, marginRight: '0.5rem' }, children: "Home page" }), _jsxs("select", { value: currentTree?.rootId ?? '', onChange: (e) => {
                                                // You could add page selection logic here
                                            }, style: { padding: '0.4rem 0.6rem', borderRadius: '0.35rem' }, children: [_jsx("option", { value: "", children: "(auto)" }), pageOptions.map((p) => (_jsx("option", { value: p.id, children: p.name || p.id }, p.id)))] })] }) }), _jsx("div", { className: "board-container", children: _jsx(BoardViewer, { tree: currentTree, loadId: currentLoadId }) }), currentValidation && (_jsxs("div", { className: "board-meta", style: { flexDirection: 'column', alignItems: 'flex-start' }, children: [_jsx("strong", { children: "Validation" }), _jsxs("div", { style: { fontSize: '0.9rem', color: currentValidation.valid ? '#15803d' : '#b91c1c' }, children: [currentValidation.valid ? 'Valid file' : 'Validation failed', " \u00B7 ", currentValidation.errors, " errors \u00B7", ' ', currentValidation.warnings, " warnings"] }), _jsx("ul", { style: { marginLeft: '1rem', marginTop: '0.5rem', color: '#374151' }, children: currentValidation.results.map((r, idx) => (_jsxs("li", { children: [_jsxs("strong", { children: [r.description, ":"] }), " ", r.valid ? 'ok' : r.error || 'failed', r.warnings && r.warnings.length > 0 && (_jsxs("span", { children: [" \u00B7 warnings: ", r.warnings.join('; ')] }))] }, `${r.type}-${idx}`))) })] }))] })), !loading && !error && !currentTree && (_jsxs("div", { className: "info", children: [_jsx("h2", { children: "Welcome to AAC Board Viewer! \uD83C\uDF89" }), _jsxs("p", { children: [_jsx("strong", { children: "NEW:" }), " Browser-based loading for most formats! Files are processed directly in your browser using AACProcessors v0.1.0. No server needed for common formats like .obf, .obz, .gridset, .plist, .grd, .opml, and .dot."] }), _jsxs("div", { className: "info-sections", children: [_jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDFE2 Browser-Compatible Formats" }), _jsx("p", { style: { fontSize: '0.9rem', color: '#15803d', marginBottom: '0.5rem' }, children: "Processed directly in your browser - faster and more private!" }), _jsx("ul", { children: browserFormats.map((f) => (_jsxs("li", { children: [_jsx("strong", { children: f.name }), " - ", f.extensions.join(', ')] }, f.name))) })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDD34 Server-Only Formats" }), _jsx("p", { style: { fontSize: '0.9rem', color: '#b91c1c', marginBottom: '0.5rem' }, children: "Require server-side processing (enable \"Force server mode\")" }), _jsx("ul", { children: serverOnlyFormats.map((f) => (_jsxs("li", { children: [_jsx("strong", { children: f.name }), " - ", f.extensions.join(', ')] }, f.name))) })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\u2728 Features" }), _jsxs("ul", { children: [_jsx("li", { children: "\uD83D\uDE80 Browser-based processing (no server needed!)" }), _jsx("li", { children: "\uD83C\uDFA8 Preserves original styling" }), _jsx("li", { children: "\uD83D\uDD17 Interactive navigation" }), _jsx("li", { children: "\uD83D\uDDE3\uFE0F Sentence building" }), _jsx("li", { children: "\uD83D\uDCCA Cognitive effort metrics" }), _jsx("li", { children: "\uD83C\uDF19 Dark-mode friendly" })] })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDE80 Usage" }), _jsx("pre", { children: _jsx("code", { children: `// Browser-based loading
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

const tree = await loadAACFile('/path/to/file.sps');` }) })] })] })] }))] }), _jsx("footer", { className: "app-footer", children: _jsxs("p", { children: [_jsx("a", { href: "https://github.com/willwade/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "GitHub" }), ' · ', _jsx("a", { href: "https://github.com/willwade/AACProcessors-nodejs", target: "_blank", rel: "noopener noreferrer", children: "AACProcessors-nodejs" }), ' · ', _jsx("a", { href: "https://www.npmjs.com/package/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "npm" }), ' · ', _jsx("span", { style: { color: '#6b7280', fontSize: '0.9em' }, children: "AACProcessors v0.1.0+ for browser support" })] }) })] }));
}
export default App;
