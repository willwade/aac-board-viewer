import { jsx as _jsx } from "react/jsx-runtime";
// Polyfill Buffer for browser environment (required by @willwade/aac-processors)
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
    window.Buffer = {
        from: (data) => {
            if (typeof data === 'string') {
                const encoder = new TextEncoder();
                return encoder.encode(data);
            }
            if (data instanceof ArrayBuffer) {
                return new Uint8Array(data);
            }
            if (data instanceof Uint8Array) {
                return data;
            }
            return new Uint8Array(data);
        },
        alloc: (size) => new Uint8Array(size),
        allocUnsafe: (size) => new Uint8Array(size),
        concat: (list, totalLength) => {
            const result = new Uint8Array(totalLength || list.reduce((sum, arr) => sum + arr.length, 0));
            let offset = 0;
            for (const arr of list) {
                result.set(arr, offset);
                offset += arr.length;
            }
            return result;
        },
        isBuffer: (obj) => obj instanceof Uint8Array,
    };
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
