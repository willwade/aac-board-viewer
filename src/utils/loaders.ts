/**
 * AAC File Loading Utilities
 *
 * Provides utilities for loading AAC files from various sources
 * (File/Blob objects, file paths, URLs) in both browser and server contexts.
 *
 * Browser: Supports all formats. SQLite-backed formats (.sps, .spb, .ce) require SQL.js configuration.
 * Node.js: Supports all formats including filesystem access and SQLite-backed formats.
 */

import type { AACTree } from '@willwade/aac-processors';
import type { LoadAACFileResult } from '../types';

type ProcessorOptions = Record<string, unknown> | undefined;
type ProcessorInput = string | ArrayBuffer | Uint8Array;
type ProcessorInstance = {
  loadIntoTree: (input: ProcessorInput) => Promise<AACTree>;
};

type ProcessorModule = typeof import('@willwade/aac-processors');
type AnyProcessorModule = ProcessorModule;

type SqlJsConfig = {
  locateFile: (file: string) => string;
  [key: string]: unknown;
};

// Node-only file extensions that require server-side processing
const NODE_ONLY_EXTENSIONS = ['.xlsx', '.xls'];

// Browser-compatible file extensions (SQLite-backed formats require SQL.js configuration)
const BROWSER_EXTENSIONS = [
  '.obf',
  '.obz',
  '.gridset',
  '.plist',
  '.grd',
  '.opml',
  '.dot',
  '.sps',
  '.spb',
  '.ce',
];

/**
 * Detect if running in browser environment
 */
function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Lazily load processors so browser bundles avoid pulling in Node APIs
 */
async function importProcessors(): Promise<AnyProcessorModule> {
  if (isBrowserEnvironment()) {
    return import('@willwade/aac-processors');
  }
  return import('@willwade/aac-processors/node');
}

/**
 * Configure SQL.js for browser-only SQLite-backed formats (.sps/.spb/.ce).
 */
export async function configureBrowserSqlJs(config: SqlJsConfig): Promise<void> {
  if (!isBrowserEnvironment()) {
    throw new Error('configureBrowserSqlJs can only be used in a browser environment.');
  }

  const processors = (await import('@willwade/aac-processors')) as {
    configureSqlJs?: (cfg: SqlJsConfig) => void;
  };
  if (typeof processors.configureSqlJs !== 'function') {
    throw new Error('configureSqlJs is not available in this build of @willwade/aac-processors.');
  }

  processors.configureSqlJs(config);
}

/**
 * Get the appropriate processor for a file based on its extension
 */
async function getProcessorForFile(
  filepath: string,
  options?: ProcessorOptions
): Promise<{ processor: ProcessorInstance; extension: string }> {
  const { getProcessor } = await importProcessors();

  const ext = filepath.toLowerCase().split('.').pop();
  if (!ext) {
    throw new Error('Invalid file path: no extension found');
  }

  const extension = '.' + ext;

  // Check if this is a Node-only processor in browser environment
  if (isBrowserEnvironment() && NODE_ONLY_EXTENSIONS.includes(extension)) {
    throw new Error(
      `File type ${extension} requires server-side processing. ` +
      `Please use the server API or upload a browser-compatible format. ` +
      `Browser supports: ${BROWSER_EXTENSIONS.join(', ')}`
    );
  }

  // Use the factory function from v0.1.0
  const processor = getProcessor(extension) as ProcessorInstance | undefined;

  if (!processor) {
    throw new Error(`Unsupported file type: ${extension}`);
  }

  // For SNAP processor, it needs special options
  if (extension === '.sps' || extension === '.spb') {
    const { SnapProcessor } = await importProcessors();
    return {
      processor: (options ? new SnapProcessor(null, options) : new SnapProcessor()) as ProcessorInstance,
      extension,
    };
  }

  return { processor, extension };
}

/**
 * Load an AAC file from a file path (Node.js only)
 *
 * @param filepath - Path to the AAC file
 * @param options - Processor options (e.g., pageLayoutPreference for SNAP)
 * @returns Promise resolving to AACTree
 *
 * @example
 * ```ts
 * const tree = await loadAACFile('/path/to/file.sps');
 * ```
 */
export async function loadAACFile(
  filepath: string,
  options?: ProcessorOptions
): Promise<AACTree>;

/**
 * Load an AAC file from a File or Blob object (Browser only)
 *
 * @param file - File or Blob object
 * @param options - Processor options
 * @returns Promise resolving to AACTree
 *
 * @example
 * ```ts
 * const input = document.querySelector('input[type="file"]');
 * const file = input.files[0];
 * const tree = await loadAACFile(file);
 * ```
 */
export async function loadAACFile(
  file: File | Blob,
  options?: ProcessorOptions
): Promise<AACTree>;

/**
 * Load an AAC file from an ArrayBuffer (Browser only)
 *
 * @param buffer - ArrayBuffer containing file data
 * @param filename - Filename with extension to detect processor
 * @param options - Processor options
 * @returns Promise resolving to AACTree
 *
 * @example
 * ```ts
 * const arrayBuffer = await file.arrayBuffer();
 * const tree = await loadAACFile(arrayBuffer, 'board.obf');
 * ```
 */
export async function loadAACFile(
  buffer: ArrayBuffer,
  filename: string,
  options?: ProcessorOptions
): Promise<AACTree>;

/**
 * Unified AAC file loading function that works in both browser and Node.js
 */
export async function loadAACFile(
  input: string | File | Blob | ArrayBuffer,
  optionsOrFilename?: ProcessorOptions | string,
  options?: ProcessorOptions
): Promise<AACTree> {
  // Handle ArrayBuffer case (requires filename as second parameter)
  if (input instanceof ArrayBuffer) {
    const filename = typeof optionsOrFilename === 'string' ? optionsOrFilename : 'unknown.bin';
    return loadFromArrayBuffer(input, filename, options);
  }

  // Handle File/Blob case (browser)
  if (input instanceof File || input instanceof Blob) {
    return loadAACFileFromFile(input, undefined, optionsOrFilename as ProcessorOptions);
  }

  // Handle string path case (Node.js or URL)
  if (typeof input === 'string') {
    // Check if it's a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return loadAACFileFromURL(input, optionsOrFilename as ProcessorOptions);
    }
    // It's a file path (Node.js only)
    return loadFromFilePath(input, optionsOrFilename as ProcessorOptions);
  }

  throw new Error('Invalid input type. Expected File, Blob, ArrayBuffer, or file path string.');
}

/**
 * Load from file path (Node.js only)
 */
async function loadFromFilePath(
  filepath: string,
  options?: ProcessorOptions
): Promise<AACTree> {
  const { processor } = await getProcessorForFile(filepath, options);
  return processor.loadIntoTree(filepath);
}

/**
 * Load from File or Blob (Browser only)
 */
async function loadAACFileFromFile(
  file: File | Blob,
  filename?: string,
  options?: ProcessorOptions
): Promise<AACTree> {
  // Extract filename from File object if not provided
  const actualFilename = filename || (file instanceof File ? file.name : 'unknown.bin');

  // Check if this is a Node-only format
  const ext = '.' + actualFilename.toLowerCase().split('.').pop();
  if (NODE_ONLY_EXTENSIONS.includes(ext)) {
    throw new Error(
      `File type ${ext} requires server-side processing. ` +
      `Please use the server API or upload a browser-compatible format. ` +
      `Browser supports: ${BROWSER_EXTENSIONS.join(', ')}`
    );
  }

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Load using ArrayBuffer
  return loadFromArrayBuffer(arrayBuffer, actualFilename, options);
}

/**
 * Load from ArrayBuffer (Browser only)
 */
async function loadFromArrayBuffer(
  arrayBuffer: ArrayBuffer,
  filename: string,
  options?: ProcessorOptions
): Promise<AACTree> {
  const { processor } = await getProcessorForFile(filename, options);

  // AACProcessors v0.1.0+ supports loading from ArrayBuffer in browser
  return processor.loadIntoTree(arrayBuffer);
}

/**
 * Load an AAC file from a URL (Browser only)
 *
 * Note: This requires the server to provide the file with appropriate CORS headers.
 * For better performance, consider using loadAACFileFromFile() with direct file upload instead.
 *
 * @param url - URL to the AAC file
 * @param options - Processor options
 * @returns Promise resolving to AACTree
 *
 * @example
 * ```ts
 * const tree = await loadAACFileFromURL('https://example.com/file.obf');
 * ```
 */
export async function loadAACFileFromURL(
  url: string,
  options?: ProcessorOptions
): Promise<AACTree> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = getFilenameFromURL(url);

  return loadAACFileFromFile(blob, filename, options);
}

/**
 * Load an AAC file and return extended result with format info
 *
 * @param input - File path (Node.js), File/Blob (Browser), or URL string
 * @param options - Processor options
 * @returns Promise resolving to LoadAACFileResult
 */
export async function loadAACFileWithMetadata(
  input: string | File | Blob,
  options?: ProcessorOptions
): Promise<LoadAACFileResult> {
  let tree: AACTree;
  if (typeof input === 'string') {
    tree = await loadAACFile(input, options);
  } else {
    tree = await loadAACFile(input, options);
  }

  // Detect format from file extension
  let filepath = '';
  if (typeof input === 'string') {
    filepath = input;
  } else if (input instanceof File) {
    filepath = input.name;
  }

  const ext = filepath.toLowerCase();
  let format = 'unknown';

  if (ext.endsWith('.gridset')) format = 'gridset';
  else if (ext.endsWith('.sps') || ext.endsWith('.spb')) format = 'snap';
  else if (ext.endsWith('.ce')) format = 'touchchat';
  else if (ext.endsWith('.obf')) format = 'openboard';
  else if (ext.endsWith('.obz')) format = 'openboard';
  else if (ext.endsWith('.grd')) format = 'asterics-grid';
  else if (ext.endsWith('.plist')) format = 'apple-panels';
  else if (ext.endsWith('.opml')) format = 'opml';
  else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) format = 'excel';
  else if (ext.endsWith('.dot')) format = 'dot';

  return {
    tree,
    format,
    metadata: tree.metadata,
  };
}

/**
 * Extract filename from URL
 */
function getFilenameFromURL(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Calculate cognitive effort metrics for an AAC tree
 *
 * @param tree - The AAC tree
 * @param options - Metrics calculation options
 * @returns Promise resolving to array of ButtonMetrics
 *
 * @example
 * ```ts
 * import { calculateMetrics } from 'aac-board-viewer';
 *
 * const metrics = await calculateMetrics(tree, {
 *   accessMethod: 'direct',
 * });
 * ```
 */
export async function calculateMetrics(
  tree: AACTree,
  options: {
    accessMethod?: 'direct' | 'scanning';
    scanningConfig?: {
      pattern?: 'linear' | 'row-column' | 'block';
      selectionMethod?: string;
      errorCorrection?: boolean;
    };
  } = {}
) {
  // Import MetricsCalculator dynamically to avoid circular dependencies
  const aacProcessors = await importProcessors();
  const hasMetricsCalculator =
    typeof (aacProcessors as { MetricsCalculator?: unknown }).MetricsCalculator === 'function';

  // Use the calculator if available, otherwise return empty metrics
  if (!hasMetricsCalculator) {
    console.warn('MetricsCalculator not available in this environment');
    return [];
  }

  type MetricsCalculator = {
    analyze: (
      targetTree: AACTree,
      metricsOptions: Record<string, unknown>
    ) => { buttons: MetricsButton[] };
  };
  const calculator = new (aacProcessors as { MetricsCalculator: new () => MetricsCalculator })
    .MetricsCalculator();

  let metricsOptions: Record<string, unknown> = {};

  if (options.accessMethod === 'scanning' && options.scanningConfig) {
    // Use string literals instead of enums to avoid import issues
    let cellScanningOrder = 0; // SimpleScan
    let blockScanEnabled = false;
    let selectionMethod = 0; // AutoScan

    switch (options.scanningConfig.pattern) {
      case 'linear':
        cellScanningOrder = 0; // SimpleScan
        break;
      case 'row-column':
        cellScanningOrder = 1; // RowColumnScan
        break;
      case 'block':
        cellScanningOrder = 1; // RowColumnScan
        blockScanEnabled = true;
        break;
    }

    metricsOptions = {
      scanningConfig: {
        cellScanningOrder,
        blockScanEnabled,
        selectionMethod,
        errorCorrectionEnabled: options.scanningConfig.errorCorrection || false,
        errorRate: 0.1,
      },
    };
  }

  const metricsResult = calculator.analyze(tree, metricsOptions);

  // Convert to the format expected by BoardViewer
  type MetricsButton = {
    id: string;
    label: string;
    effort: number;
    count?: number;
    level?: number;
    semantic_id?: string;
    clone_id?: string;
  };

  return metricsResult.buttons.map((btn: MetricsButton) => ({
    id: btn.id,
    label: btn.label,
    effort: btn.effort,
    count: btn.count ?? 0,
    is_word: true,
    level: btn.level,
    semantic_id: btn.semantic_id,
    clone_id: btn.clone_id,
  }));
}

/**
 * Get a list of supported file formats
 *
 * @returns Array of format information
 */
export function getSupportedFormats(): Array<{
  name: string;
  extensions: string[];
  description: string;
  browserCompatible: boolean;
}> {
  return [
    {
      name: 'Grid 3',
      extensions: ['.gridset'],
      description: 'Smartbox Grid 3 communication boards',
      browserCompatible: true,
    },
    {
      name: 'TD Snap',
      extensions: ['.sps', '.spb'],
      description: 'Tobii Dynavox Snap files (requires SQL.js in browser)',
      browserCompatible: true,
    },
    {
      name: 'TouchChat',
      extensions: ['.ce'],
      description: 'Saltillo TouchChat files (requires SQL.js in browser)',
      browserCompatible: true,
    },
    {
      name: 'OpenBoard',
      extensions: ['.obf', '.obz'],
      description: 'OpenBoard Format (OBZ/OBF)',
      browserCompatible: true,
    },
    {
      name: 'Asterics Grid',
      extensions: ['.grd'],
      description: 'Asterics Grid files (.grd)',
      browserCompatible: true,
    },
    {
      name: 'Apple Panels',
      extensions: ['.plist'],
      description: 'Apple iOS Panels files',
      browserCompatible: true,
    },
    {
      name: 'OPML',
      extensions: ['.opml'],
      description: 'OPML outline files',
      browserCompatible: true,
    },
    {
      name: 'Excel',
      extensions: ['.xlsx', '.xls'],
      description: 'Excel spreadsheet boards',
      browserCompatible: false,
    },
    {
      name: 'DOT',
      extensions: ['.dot'],
      description: 'DOT graph visualization files',
      browserCompatible: true,
    },
  ];
}

/**
 * Check if a file format is compatible with browser processing
 *
 * @param extension - File extension (e.g., '.obf', 'obf')
 * @returns true if browser-compatible, false if server-only
 */
export function isBrowserCompatible(extension: string): boolean {
  const ext = extension.startsWith('.') ? extension.toLowerCase() : '.' + extension.toLowerCase();
  return BROWSER_EXTENSIONS.includes(ext);
}

/**
 * Get list of browser-compatible file extensions
 */
export function getBrowserExtensions(): string[] {
  return [...BROWSER_EXTENSIONS];
}

/**
 * Get list of Node-only file extensions
 */
export function getNodeOnlyExtensions(): string[] {
  return [...NODE_ONLY_EXTENSIONS];
}
