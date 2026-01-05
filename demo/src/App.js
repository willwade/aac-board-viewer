import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';
import { FileUploader } from './FileUploader';
import './App.css';
function App() {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const [format, setFormat] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const handleFileLoad = async (file) => {
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
                }
                catch {
                    // Not JSON
                }
                throw new Error(errText || 'Failed to process file on server');
            }
            const result = await response.json();
            setTree(result.tree);
            setFormat(result.format || null);
            setMetadata(result.metadata || null);
        }
        catch (err) {
            setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}\n\n` +
                'The server-side processor could not load this file. Please check the format and try again.');
        }
        finally {
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
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "AAC Board Viewer Demo" }), _jsx("p", { children: "Universal AAC board viewer for React - Upload your AAC file to test" }), _jsx("div", { className: "controls", children: _jsxs("span", { className: "format-list", children: ["Supports:", ' ', formats.map((f) => f.name).join(', ')] }) })] }), _jsxs("main", { className: "app-main", children: [_jsx(FileUploader, { onFileLoaded: handleFileLoad, loading: loading }), loading && (_jsxs("div", { className: "loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading board..." }), _jsxs("p", { className: "loading-hint", children: ["Processing ", fileName] })] })), error && (_jsxs("div", { className: "error", children: [_jsx("h2", { children: "\u2139\uFE0F File Upload Demo" }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit' }, children: error })] })), !loading && !error && tree && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "board-meta", children: [_jsxs("div", { children: [_jsx("strong", { children: "File:" }), " ", fileName] }), format && (_jsxs("div", { children: [_jsx("strong", { children: "Detected format:" }), " ", format] })), metadata?.name && (_jsxs("div", { children: [_jsx("strong", { children: "Board name:" }), " ", metadata.name] }))] }), _jsx("div", { className: "board-container", children: _jsx(BoardViewer, { tree: tree }) })] })), !loading && !error && !tree && (_jsxs("div", { className: "info", children: [_jsx("h2", { children: "Welcome to AAC Board Viewer! \uD83C\uDF89" }), _jsx("p", { children: "Upload any AAC file above to see the viewer in action. Files are parsed on the local server using @willwade/aac-processors." }), _jsxs("div", { className: "info-sections", children: [_jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDCC1 Supported Formats" }), _jsx("ul", { children: formats.map((f) => (_jsxs("li", { children: [_jsx("strong", { children: f.name }), " - ", f.extensions.join(', ')] }, f.name))) })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\u2728 Features" }), _jsxs("ul", { children: [_jsx("li", { children: "\uD83C\uDFA8 Preserves original styling" }), _jsx("li", { children: "\uD83D\uDD17 Interactive navigation" }), _jsx("li", { children: "\uD83D\uDDE3\uFE0F Sentence building" }), _jsx("li", { children: "\uD83D\uDCCA Effort metrics display" }), _jsx("li", { children: "\uD83C\uDF9B\uFE0F Toolbar support" }), _jsx("li", { children: "\uD83C\uDF19 Dark mode ready" })] })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDE80 Usage" }), _jsx("pre", { children: _jsx("code", { children: `import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

<BoardViewer tree={treeData} />` }) })] })] })] }))] }), _jsx("footer", { className: "app-footer", children: _jsxs("p", { children: [_jsx("a", { href: "https://github.com/willwade/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "GitHub" }), ' · ', _jsx("a", { href: "https://github.com/willwade/AACProcessors-nodejs", target: "_blank", rel: "noopener noreferrer", children: "AACProcessors-nodejs" }), ' · ', _jsx("a", { href: "https://www.npmjs.com/package/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "npm" })] }) })] }));
}
export default App;
