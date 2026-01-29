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
  // Also need to strip out image data URLs to avoid hitting string size limits
  // for large boards with many images.
  const cleanPages: Record<string, any> = {};
  for (const [pageId, page] of Object.entries(tree.pages)) {
    cleanPages[pageId] = {
      ...page,
      buttons: page.buttons.map((btn: any) => {
        // Debug: log resolvedImageEntry
        if (btn.resolvedImageEntry) {
          console.log('[AAC Loader] Button:', btn.label, 'resolvedImageEntry:', btn.resolvedImageEntry);
        }
        return {
          ...btn,
          // Remove large data URLs from serialization
          image: btn.image && btn.image.length > 1000 ? undefined : btn.image,
          resolvedImageEntry: btn.resolvedImageEntry && btn.resolvedImageEntry.length > 1000 ? undefined : btn.resolvedImageEntry,
          // Also remove large image data from parameters
          parameters: btn.parameters?.imageData
            ? { ...btn.parameters, imageData: '[REDACTED]' }
            : btn.parameters,
        };
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
