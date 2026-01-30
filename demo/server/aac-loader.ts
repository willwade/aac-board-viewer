import {
  getProcessor,
  GridsetProcessor,
  SnapProcessor,
  TouchChatProcessor,
  ObfProcessor,
  AstericsGridProcessor,
  ApplePanelsProcessor,
  OpmlProcessor,
  ExcelProcessor,
  DotProcessor,
  type AACTree,
} from '@willwade/aac-processors';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Store temp file paths for image serving
const tempFiles = new Map<string, string>();

// Store file type for each load (OBZ vs Grid3)
const fileTypes = new Map<string, string>();

type ProcessorOptions = any;

function detectFormat(filename: string): string {
  const ext = filename.toLowerCase();

  if (ext.endsWith('.gridset')) return 'gridset';
  if (ext.endsWith('.sps') || ext.endsWith('.spb')) return 'snap';
  if (ext.endsWith('.ce')) return 'touchchat';
  if (ext.endsWith('.obf')) return 'openboard';
  if (ext.endsWith('.obz')) return 'openboard';
  if (ext.endsWith('.grd')) return 'asterics-grid';
  if (ext.endsWith('.plist')) return 'apple-panels';
  if (ext.endsWith('.opml')) return 'opml';
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) return 'excel';
  if (ext.endsWith('.dot')) return 'dot';

  return 'unknown';
}

function getProcessorForFile(filename: string, options?: ProcessorOptions) {
  const ext = filename.toLowerCase();

  if (ext.endsWith('.gridset')) return new GridsetProcessor();
  if (ext.endsWith('.sps') || ext.endsWith('.spb')) {
    return options ? new SnapProcessor(null, options) : new SnapProcessor();
  }
  if (ext.endsWith('.ce')) return new TouchChatProcessor();
  if (ext.endsWith('.obf')) return new ObfProcessor();
  if (ext.endsWith('.obz')) return new ObfProcessor();
  if (ext.endsWith('.grd')) return new AstericsGridProcessor();
  if (ext.endsWith('.plist')) return new ApplePanelsProcessor();
  if (ext.endsWith('.opml')) return new OpmlProcessor();
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) return new ExcelProcessor();
  if (ext.endsWith('.dot')) return new DotProcessor();

  return getProcessor(filename);
}

export async function loadAACFromBuffer(
  filename: string,
  buffer: Buffer,
  options?: ProcessorOptions
): Promise<{ tree: AACTree; format: string; metadata: Record<string, any> | undefined; loadId: string }> {
  if (!buffer?.length) {
    throw new Error('No file data received');
  }

  const processor = getProcessorForFile(filename, options);

  // Some processors expect a real file path (ZIP-backed formats especially),
  // so write to a temp file for reliability.
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aac-board-'));
  const tmpPath = path.join(tmpDir, `${randomUUID()}-${path.basename(filename)}`);
  await fs.writeFile(tmpPath, buffer);

  // Generate a unique ID for this loaded file
  const loadId = randomUUID();
  let tree: AACTree;
  try {
    tree = (await Promise.resolve(processor.loadIntoTree(tmpPath))) as AACTree;
  } catch (err) {
    // Clean up on error
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }

  // Store temp file path for later image serving
  tempFiles.set(loadId, tmpPath);
  fileTypes.set(loadId, filename); // Store filename to detect format

  // The processor attaches rootId/toolbarId as non-enumerable properties,
  // so JSON.stringify would drop them. Build a plain object so the client
  // receives the correct home page information.
  //
  // NOTE: We do NOT strip data URLs because they are required for formats like Snap
  // that embed images directly as data URLs. The board-viewer component handles
  // data URLs efficiently by using them directly without API calls.
  const cleanPages: Record<string, any> = {};
  for (const [pageId, page] of Object.entries(tree.pages)) {
    cleanPages[pageId] = {
      ...page,
      buttons: page.buttons.map((btn: any) => {
        // Explicitly copy only the properties we need, avoiding any hidden/non-serializable ones
        const cleanButton: any = {
          id: btn.id,
          label: btn.label,
          message: btn.message,
          x: btn.x,
          y: btn.y,
          rowSpan: btn.rowSpan,
          colSpan: btn.colSpan,
          style: btn.style,
          targetPageId: btn.targetPageId,
          semanticAction: btn.semanticAction,
          semanticCategory: btn.semanticCategory,
          semanticIntent: btn.semanticIntent,
          image: btn.image,
          resolvedImageEntry: btn.resolvedImageEntry,
          parameters: btn.parameters,
        };

        // DEBUG: Log button with data URL
        if (btn.image && btn.image.startsWith && btn.image.startsWith('data:image')) {
          console.log('[Server Loader] Button with data URL:', btn.label);
          console.log('  image type:', typeof btn.image);
          console.log('  image[0:60]:', btn.image.substring(0, 60));
        }

        // Check for any Buffer properties that would corrupt on JSON.stringify
        if (cleanButton.parameters) {
          const hasBuffer = Object.entries(cleanButton.parameters).some(
            ([key, val]) => Buffer.isBuffer(val) || (val && val.constructor && val.constructor.name === 'Buffer')
          );
          if (hasBuffer) {
            console.error('[Server Loader] ❌ Button has Buffer in parameters:', btn.label);
            console.error('  Removing parameters to prevent corruption');
            delete cleanButton.parameters;
          }
        }

        return cleanButton;
      }),
    };
  }

  const serializableTree: AACTree = {
    pages: cleanPages,
    metadata: tree.metadata,
    rootId: tree.rootId,
    toolbarId: tree.toolbarId,
    addPage: tree.addPage.bind(tree),
    getPage: tree.getPage.bind(tree),
  };

  return {
    tree: serializableTree,
    format: detectFormat(filename),
    metadata: tree.metadata,
    loadId, // Return loadId so client can request images
  };
}

// Get the original temp file path for a loadId
export function getTempFilePath(loadId: string): string | undefined {
  return tempFiles.get(loadId);
}

// Get the original filename for a loadId (to detect format)
export function getFileName(loadId: string): string | undefined {
  return fileTypes.get(loadId);
}

// Clean up temp files for a loadId
export function cleanupTempFiles(loadId: string): void {
  const tmpPath = tempFiles.get(loadId);
  if (tmpPath) {
    const tmpDir = path.dirname(tmpPath);
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    tempFiles.delete(loadId);
  }
}
