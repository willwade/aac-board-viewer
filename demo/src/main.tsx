// Polyfill Buffer for browser environment (required by @willwade/aac-processors)
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  class BufferWrapper extends Uint8Array {
    constructor(data: any, byteOffset?: number, length?: number) {
      if (typeof data === 'number') {
        super(data);
      } else if (Array.isArray(data)) {
        super(data);
      } else if (data instanceof ArrayBuffer) {
        super(data, byteOffset || 0, length);
      } else if (data instanceof Uint8Array) {
        super(data.buffer as ArrayBuffer, data.byteOffset, data.length);
      } else if (typeof data === 'string') {
        const encoder = new TextEncoder();
        super(encoder.encode(data));
      } else {
        super(0);
      }
    }

    toString(encoding: string = 'utf8'): string {
      if (encoding === 'utf8' || encoding === 'utf-8') {
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(this);
      }
      throw new Error(`Buffer.toString: encoding ${encoding} not supported`);
    }

    static from(data: ArrayLike<number> | Iterable<number>): BufferWrapper;
    static from<T>(
      data: ArrayLike<T> | Iterable<T>,
      mapfn?: (v: T, k: number) => number,
      thisArg?: any
    ): BufferWrapper;
    static from(data: any, mapfn?: ((v: any, k: number) => number) | undefined, thisArg?: any): BufferWrapper {
      return new BufferWrapper(data);
    }

    static alloc(size: number): BufferWrapper {
      return new BufferWrapper(size);
    }

    static allocUnsafe(size: number): BufferWrapper {
      return new BufferWrapper(size);
    }

    static concat(list: Uint8Array[], totalLength?: number): BufferWrapper {
      const result = new Uint8Array(totalLength || list.reduce((sum, arr) => sum + arr.length, 0));
      let offset = 0;
      for (const arr of list) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return new BufferWrapper(result.buffer, result.byteOffset, result.length);
    }

    static isBuffer(obj: any): boolean {
      return obj instanceof BufferWrapper;
    }
  }

  (window as any).Buffer = BufferWrapper as any;
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
