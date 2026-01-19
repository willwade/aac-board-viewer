import { jsx as _jsx } from "react/jsx-runtime";
// Polyfill Buffer for browser environment (required by @willwade/aac-processors)
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
    class BufferWrapper extends Uint8Array {
        constructor(data, byteOffset, length) {
            if (typeof data === 'number') {
                super(data);
            }
            else if (Array.isArray(data)) {
                super(data);
            }
            else if (data instanceof ArrayBuffer) {
                super(data, byteOffset || 0, length);
            }
            else if (data instanceof Uint8Array) {
                super(data.buffer, data.byteOffset, data.length);
            }
            else if (typeof data === 'string') {
                const encoder = new TextEncoder();
                super(encoder.encode(data));
            }
            else {
                super(0);
            }
        }
        toString(encoding = 'utf8') {
            if (encoding === 'utf8' || encoding === 'utf-8') {
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(this);
            }
            throw new Error(`Buffer.toString: encoding ${encoding} not supported`);
        }
        static from(data, mapfn, thisArg) {
            return new BufferWrapper(data);
        }
        static alloc(size) {
            return new BufferWrapper(size);
        }
        static allocUnsafe(size) {
            return new BufferWrapper(size);
        }
        static concat(list, totalLength) {
            const result = new Uint8Array(totalLength || list.reduce((sum, arr) => sum + arr.length, 0));
            let offset = 0;
            for (const arr of list) {
                result.set(arr, offset);
                offset += arr.length;
            }
            return new BufferWrapper(result.buffer, result.byteOffset, result.length);
        }
        static isBuffer(obj) {
            return obj instanceof BufferWrapper;
        }
    }
    window.Buffer = BufferWrapper;
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import { configureBrowserSqlJs } from 'aac-board-viewer';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import './index.css';
import App from './App';
void configureBrowserSqlJs({
    locateFile: () => sqlWasmUrl,
});
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
