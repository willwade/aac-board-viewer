import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BoardViewer } from '../src';
import { FileUploader } from './FileUploader';
import './App.css';
function App() {
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const handleFileLoad = async (file) => {
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
            setError(`File "${file.name}" loaded (${(file.size / 1024).toFixed(2)} KB).\n\n` +
                'Client-side file processing is coming soon! For now, this demo shows the UI.\n\n' +
                'To test with real files, you can:\n' +
                '1. Use the library in your backend application\n' +
                '2. Serve files via an API endpoint\n' +
                '3. Check the EXAMPLES.md for integration examples');
        }
        catch (err) {
            setError(`Error loading file: ${err instanceof Error ? err.message : 'Unknown error'}\n\n` +
                'Note: Full client-side file processing requires additional setup.\n' +
                'See SETUP.md for server-side integration examples.');
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
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "AAC Board Viewer Demo" }), _jsx("p", { children: "Universal AAC board viewer for React - Upload your AAC file to test" }), _jsx("div", { className: "controls", children: _jsxs("span", { className: "format-list", children: ["Supports:", ' ', formats.map((f) => f.name).join(', ')] }) })] }), _jsxs("main", { className: "app-main", children: [_jsx(FileUploader, { onFileLoaded: handleFileLoad, loading: loading }), loading && (_jsxs("div", { className: "loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading board..." }), _jsxs("p", { className: "loading-hint", children: ["Processing ", fileName] })] })), error && (_jsxs("div", { className: "error", children: [_jsx("h2", { children: "\u2139\uFE0F File Upload Demo" }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit' }, children: error })] })), !loading && !error && tree && (_jsx("div", { className: "board-container", children: _jsx(BoardViewer, { tree: tree }) })), !loading && !error && !tree && (_jsxs("div", { className: "info", children: [_jsx("h2", { children: "Welcome to AAC Board Viewer! \uD83C\uDF89" }), _jsx("p", { children: "Upload any AAC file above to see the viewer in action." }), _jsxs("div", { className: "info-sections", children: [_jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDCC1 Supported Formats" }), _jsx("ul", { children: formats.map((f) => (_jsxs("li", { children: [_jsx("strong", { children: f.name }), " - ", f.extensions.join(', ')] }, f.name))) })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\u2728 Features" }), _jsxs("ul", { children: [_jsx("li", { children: "\uD83C\uDFA8 Preserves original styling" }), _jsx("li", { children: "\uD83D\uDD17 Interactive navigation" }), _jsx("li", { children: "\uD83D\uDDE3\uFE0F Sentence building" }), _jsx("li", { children: "\uD83D\uDCCA Effort metrics display" }), _jsx("li", { children: "\uD83C\uDF9B\uFE0F Toolbar support" }), _jsx("li", { children: "\uD83C\uDF19 Dark mode ready" })] })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDE80 Usage" }), _jsx("pre", { children: _jsx("code", { children: `import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

<BoardViewer tree={treeData} />` }) })] })] })] }))] }), _jsx("footer", { className: "app-footer", children: _jsxs("p", { children: [_jsx("a", { href: "https://github.com/willwade/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "GitHub" }), ' · ', _jsx("a", { href: "https://github.com/willwade/AACProcessors-nodejs", target: "_blank", rel: "noopener noreferrer", children: "AACProcessors-nodejs" }), ' · ', _jsx("a", { href: "https://www.npmjs.com/package/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "npm" })] }) })] }));
}
export default App;
