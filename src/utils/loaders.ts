/**
 * AAC File Loading Utilities
 *
 * Provides utilities for loading AAC files from various sources
 * (URLs, File objects, file paths) in both client and server contexts.
 */

import type { AACTree } from '@willwade/aac-processors';
import type { LoadAACFileResult } from '../types';

type ProcessorOptions = Record<string, unknown> | undefined;

type ProcessorModule = typeof import('@willwade/aac-processors');

// Lazily load processors so browser bundles avoid pulling in Node APIs
async function importProcessors(): Promise<ProcessorModule> {
  return import('@willwade/aac-processors');
}

/**
 * Get the appropriate processor for a file based on its extension
 */
async function getProcessorForFile(filepath: string, options?: ProcessorOptions) {
  const {
    getProcessor,
    GridsetProcessor,
    SnapProcessor,
    TouchChatProcessor,
    ObfProcessor,
    ApplePanelsProcessor,
    AstericsGridProcessor,
    OpmlProcessor,
    ExcelProcessor,
    DotProcessor,
  } = await importProcessors();

  const ext = filepath.toLowerCase();

  // GridSet files (.gridset)
  if (ext.endsWith('.gridset')) {
    return new GridsetProcessor();
  }

  // SNAP files (.sps, .spb)
  if (ext.endsWith('.sps') || ext.endsWith('.spb')) {
    return options ? new SnapProcessor(null, options) : new SnapProcessor();
  }

  // TouchChat files (.ce)
  if (ext.endsWith('.ce')) {
    return new TouchChatProcessor();
  }

  // OpenBoard files (.obf, .obz)
  if (ext.endsWith('.obf')) {
    return new ObfProcessor();
  }
  if (ext.endsWith('.obz')) {
    return new ObfProcessor();
  }

  // Asterics Grid files (.grd)
  if (ext.endsWith('.grd')) {
    return new AstericsGridProcessor();
  }

  // Apple Panels files
  if (ext.endsWith('.plist')) {
    return new ApplePanelsProcessor();
  }

  // OPML files
  if (ext.endsWith('.opml')) {
    return new OpmlProcessor();
  }

  // Excel files
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
    return new ExcelProcessor();
  }

  // DOT files
  if (ext.endsWith('.dot')) {
    return new DotProcessor();
  }

  // Fallback to generic processor detection
  return getProcessor(filepath);
}

/**
 * Load an AAC file from a file path (server-side only)
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
): Promise<AACTree> {
  const processor = await getProcessorForFile(filepath, options);
  return processor.loadIntoTree(filepath);
}

/**
 * Load an AAC file and return extended result with format info
 *
 * @param filepath - Path to the AAC file
 * @param options - Processor options
 * @returns Promise resolving to LoadAACFileResult
 */
export async function loadAACFileWithMetadata(
  filepath: string,
  options?: ProcessorOptions
): Promise<LoadAACFileResult> {
  const tree = await loadAACFile(filepath, options);

  // Detect format from file extension
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
 * Load an AAC file from a URL (client-side)
 *
 * Note: This requires the server to provide the file with appropriate CORS headers.
 * For better performance, consider server-side loading instead.
 *
 * @param url - URL to the AAC file
 * @param options - Processor options
 * @returns Promise resolving to AACTree
 *
 * @example
 * ```ts
 * const tree = await loadAACFileFromURL('https://example.com/file.sps');
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
 * Load an AAC file from a File object (client-side file input)
 *
 * @param file - File object from file input
 * @param options - Processor options
 * @returns Promise resolving to AACTree
 *
 * @example
 * ```ts
 * const input = document.querySelector('input[type="file"]');
 * input.onchange = async (e) => {
 *   const file = e.target.files[0];
 *   const tree = await loadAACFileFromFile(file);
 *   // Use tree...
 * };
 * ```
 */
export async function loadAACFileFromFile(
  _file: File | Blob,
  _filename?: string,
  _options?: unknown
): Promise<AACTree> {
  throw new Error('Client-side file loading not yet fully implemented. Please use server-side loading or loadAACFileFromURL with proper CORS headers.');
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
  const { MetricsCalculator } = await import('@willwade/aac-processors');

  const calculator = new MetricsCalculator();

  let metricsOptions: Record<string, unknown> = {};

  if (options.accessMethod === 'scanning' && options.scanningConfig) {
    // Import scanning enums
    const { CellScanningOrder, ScanningSelectionMethod } = await import('@willwade/aac-processors');

    let cellScanningOrder = CellScanningOrder.SimpleScan;
    let blockScanEnabled = false;

    switch (options.scanningConfig.pattern) {
      case 'linear':
        cellScanningOrder = CellScanningOrder.SimpleScan;
        break;
      case 'row-column':
        cellScanningOrder = CellScanningOrder.RowColumnScan;
        break;
      case 'block':
        cellScanningOrder = CellScanningOrder.RowColumnScan;
        blockScanEnabled = true;
        break;
    }

    metricsOptions = {
      scanningConfig: {
        cellScanningOrder,
        blockScanEnabled,
        selectionMethod: ScanningSelectionMethod.AutoScan,
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
}> {
  return [
    {
      name: 'Grid 3',
      extensions: ['.gridset'],
      description: 'Smartbox Grid 3 communication boards',
    },
    {
      name: 'TD Snap',
      extensions: ['.sps', '.spb'],
      description: 'Tobii Dynavox Snap files',
    },
    {
      name: 'TouchChat',
      extensions: ['.ce'],
      description: 'Saltillo TouchChat files',
    },
    {
      name: 'OpenBoard',
      extensions: ['.obf', '.obz'],
      description: 'OpenBoard Format (OBZ/OBF)',
    },
    {
      name: 'Asterics Grid',
      extensions: ['.grd'],
      description: 'Asterics Grid files (.grd)',
    },
    {
      name: 'Apple Panels',
      extensions: ['.plist'],
      description: 'Apple iOS Panels files',
    },
    {
      name: 'OPML',
      extensions: ['.opml'],
      description: 'OPML outline files',
    },
    {
      name: 'Excel',
      extensions: ['.xlsx', '.xls'],
      description: 'Excel spreadsheet boards',
    },
    {
      name: 'DOT',
      extensions: ['.dot'],
      description: 'DOT graph visualization files',
    },
  ];
}
