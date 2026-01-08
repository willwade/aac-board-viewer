// Polyfill Buffer for browser environment (required by @willwade/aac-processors)
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = {
    from: (data: any) => {
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
    alloc: (size: number) => new Uint8Array(size),
    allocUnsafe: (size: number) => new Uint8Array(size),
    concat: (list: Uint8Array[], totalLength?: number) => {
      const result = new Uint8Array(totalLength || list.reduce((sum, arr) => sum + arr.length, 0));
      let offset = 0;
      for (const arr of list) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return result;
    },
    isBuffer: (obj: any) => obj instanceof Uint8Array,
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
