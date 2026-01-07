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
    const [homePageId, setHomePageId] = useState(null);
    const [validation, setValidation] = useState(null);
    const [shouldValidate, setShouldValidate] = useState(false);
    const [loadId, setLoadId] = useState(null);
    const formatValidationSummary = (result) => `${result.valid ? 'Valid' : 'Invalid'} · ${result.errors} errors · ${result.warnings} warnings`;
    const handleFileLoad = async (file) => {
        setLoading(true);
        setError(null);
        setFileName(file.name);
        setTree(null);
        setFormat(null);
        setMetadata(null);
        setHomePageId(null);
        setValidation(null);
        setLoadId(null);
        try {
            const response = await fetch('/api/load', {
                method: 'POST',
                headers: {
                    'x-filename': encodeURIComponent(file.name),
                    'x-validate': shouldValidate ? 'true' : 'false',
                },
                body: file,
            });
            // Try to parse JSON either way so we can surface validation details
            const parsed = await response.json().catch(() => null);
            if (!response.ok) {
                const validationResult = parsed?.validation;
                if (validationResult) {
                    setValidation(validationResult);
                }
                const message = parsed?.message ||
                    (validationResult ? `Validation failed: ${formatValidationSummary(validationResult)}` : null) ||
                    'Failed to process file on server';
                throw new Error(message);
            }
            const result = parsed;
            setTree(result.tree);
            setFormat(result.format || null);
            setMetadata(result.metadata || null);
            setLoadId(result.loadId || null);
            if (result.tree?.rootId) {
                setHomePageId(result.tree.rootId);
            }
            else {
                const firstPage = Object.keys(result.tree?.pages || {})[0];
                setHomePageId(firstPage || null);
            }
            setValidation(result.validation || null);
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
        { name: 'Asterics', extensions: ['.grd'] },
        { name: 'Apple Panels', extensions: ['.plist'] },
        { name: 'OPML', extensions: ['.opml'] },
        { name: 'Excel', extensions: ['.xlsx', '.xls'] },
        { name: 'DOT', extensions: ['.dot'] },
    ];
    const pageOptions = tree ? Object.values(tree.pages) : [];
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "AAC Board Viewer Demo" }), _jsx("p", { children: "Universal AAC board viewer for React - Upload your AAC file to test" }), _jsxs("div", { className: "controls", children: [_jsxs("span", { className: "format-list", children: ["Supports:", ' ', formats.map((f) => f.name).join(', ')] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '0.35rem' }, children: [_jsx("input", { type: "checkbox", checked: shouldValidate, onChange: (e) => setShouldValidate(e.target.checked) }), "Validate file before loading"] })] })] }), _jsxs("main", { className: "app-main", children: [_jsx(FileUploader, { onFileLoaded: handleFileLoad, loading: loading }), loading && (_jsxs("div", { className: "loading", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading board..." }), _jsxs("p", { className: "loading-hint", children: ["Processing ", fileName] })] })), error && (_jsxs("div", { className: "error", children: [_jsx("h2", { children: "\u2139\uFE0F File Upload Demo" }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit' }, children: error })] })), !loading && !error && tree && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "board-meta", children: [_jsxs("div", { children: [_jsx("strong", { children: "File:" }), " ", fileName] }), format && (_jsxs("div", { children: [_jsx("strong", { children: "Detected format:" }), " ", format] })), metadata && typeof metadata.name === 'string' && (_jsxs("div", { children: [_jsx("strong", { children: "Board name:" }), ' ', metadata.name] })), metadata && (_jsxs("div", { children: [_jsx("strong", { children: "Metadata keys:" }), ' ', Object.keys(metadata).join(', ')] }))] }), _jsxs("div", { className: "board-meta", style: { gap: '0.5rem 1rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontWeight: 600, marginRight: '0.5rem' }, children: "Home page" }), _jsxs("select", { value: homePageId ?? '', onChange: (e) => setHomePageId(e.target.value || null), style: { padding: '0.4rem 0.6rem', borderRadius: '0.35rem' }, children: [_jsx("option", { value: "", children: "(auto)" }), pageOptions.map((p) => (_jsx("option", { value: p.id, children: p.name || p.id }, p.id)))] })] }), metadata && (_jsxs("div", { style: { fontSize: '0.9rem', color: '#4b5563' }, children: [_jsx("strong", { children: "Metadata:" }), ' ', _jsx("span", { children: Object.entries(metadata)
                                                    .map(([k, v]) => `${k}: ${String(v)}`)
                                                    .join(' • ') })] }))] }), _jsx("div", { className: "board-container", children: _jsx(BoardViewer, { tree: tree, initialPageId: homePageId || undefined, loadId: loadId || undefined }) }), validation && (_jsxs("div", { className: "board-meta", style: { flexDirection: 'column', alignItems: 'flex-start' }, children: [_jsx("strong", { children: "Validation" }), _jsxs("div", { style: { fontSize: '0.9rem', color: validation.valid ? '#15803d' : '#b91c1c' }, children: [validation.valid ? 'Valid file' : 'Validation failed', " \u00B7 ", validation.errors, " errors \u00B7", ' ', validation.warnings, " warnings"] }), _jsx("ul", { style: { marginLeft: '1rem', marginTop: '0.5rem', color: '#374151' }, children: validation.results.map((r, idx) => (_jsxs("li", { children: [_jsxs("strong", { children: [r.description, ":"] }), " ", r.valid ? 'ok' : r.error || 'failed', r.warnings && r.warnings.length > 0 && (_jsxs("span", { children: [" \u00B7 warnings: ", r.warnings.join('; ')] }))] }, `${r.type}-${idx}`))) })] }))] })), !loading && !error && !tree && (_jsxs("div", { className: "info", children: [_jsx("h2", { children: "Welcome to AAC Board Viewer! \uD83C\uDF89" }), _jsx("p", { children: "Upload any AAC file above to see the viewer in action. Files are parsed on the local server using @willwade/aac-processors." }), _jsxs("div", { className: "info-sections", children: [_jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDCC1 Supported Formats" }), _jsx("ul", { children: formats.map((f) => (_jsxs("li", { children: [_jsx("strong", { children: f.name }), " - ", f.extensions.join(', ')] }, f.name))) })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\u2728 Features" }), _jsxs("ul", { children: [_jsx("li", { children: "\uD83C\uDFA8 Preserves original styling" }), _jsx("li", { children: "\uD83D\uDD17 Interactive navigation" }), _jsx("li", { children: "\uD83D\uDDE3\uFE0F Sentence building" }), _jsxs("li", { children: ["\uD83C\uDF19 Dark-mode friendly (add a parent ", _jsx("code", { children: "dark" }), " class)"] })] })] }), _jsxs("div", { className: "info-card", children: [_jsx("h3", { children: "\uD83D\uDE80 Usage" }), _jsx("pre", { children: _jsx("code", { children: `import { BoardViewer } from 'aac-board-viewer';
import 'aac-board-viewer/styles';

<BoardViewer tree={treeData} />` }) })] })] })] }))] }), _jsx("footer", { className: "app-footer", children: _jsxs("p", { children: [_jsx("a", { href: "https://github.com/willwade/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "GitHub" }), ' · ', _jsx("a", { href: "https://github.com/willwade/AACProcessors-nodejs", target: "_blank", rel: "noopener noreferrer", children: "AACProcessors-nodejs" }), ' · ', _jsx("a", { href: "https://www.npmjs.com/package/aac-board-viewer", target: "_blank", rel: "noopener noreferrer", children: "npm" })] }) })] }));
}
export default App;
