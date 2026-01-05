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
): Promise<{ tree: AACTree; format: string; metadata: Record<string, any> | undefined }> {
  if (!buffer?.length) {
    throw new Error('No file data received');
  }

  const processor = getProcessorForFile(filename, options);

  // Some processors expect a real file path (ZIP-backed formats especially),
  // so write to a temp file for reliability.
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aac-board-'));
  const tmpPath = path.join(tmpDir, `${randomUUID()}-${path.basename(filename)}`);
  await fs.writeFile(tmpPath, buffer);

  let tree: AACTree;
  try {
    tree = (await Promise.resolve(processor.loadIntoTree(tmpPath))) as AACTree;
  } finally {
    // Best-effort cleanup; ignore errors
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  return {
    tree,
    format: detectFormat(filename),
    metadata: tree.metadata,
  };
}
