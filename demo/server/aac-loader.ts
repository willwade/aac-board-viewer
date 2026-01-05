import {
  getProcessor,
  GridsetProcessor,
  SnapProcessor,
  TouchChatProcessor,
  ObfProcessor,
  ObfsetProcessor,
  ApplePanelsProcessor,
  OpmlProcessor,
  ExcelProcessor,
  DotProcessor,
  type AACTree,
} from '@willwade/aac-processors';

type ProcessorOptions = any;

function detectFormat(filename: string): string {
  const ext = filename.toLowerCase();

  if (ext.endsWith('.gridset')) return 'gridset';
  if (ext.endsWith('.sps') || ext.endsWith('.spb')) return 'snap';
  if (ext.endsWith('.ce')) return 'touchchat';
  if (ext.endsWith('.obf')) return 'openboard';
  if (ext.endsWith('.obz')) return 'obfset';
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
  if (ext.endsWith('.obz')) return new ObfsetProcessor();
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

  // loadIntoTree accepts Buffer directly; wrap in Promise in case it is sync
  const tree = (await Promise.resolve(processor.loadIntoTree(buffer))) as AACTree;

  return {
    tree,
    format: detectFormat(filename),
    metadata: tree.metadata,
  };
}
