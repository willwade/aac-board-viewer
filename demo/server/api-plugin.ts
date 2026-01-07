import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PluginOption, ViteDevServer, PreviewServer } from 'vite';
import { loadAACFromBuffer, getTempFilePath, getFileName, cleanupTempFiles } from './aac-loader';
import { getValidatorForFile } from '@willwade/aac-processors/validation';
import { ObfProcessor } from '@willwade/aac-processors';
import AdmZip from 'adm-zip';

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Method not allowed' }));
    return;
  }

  try {
    const filenameHeader = req.headers['x-filename'];
    const filename = typeof filenameHeader === 'string'
      ? decodeURIComponent(filenameHeader)
      : Array.isArray(filenameHeader)
        ? decodeURIComponent(filenameHeader[0])
        : 'uploaded-file';
    const shouldValidate = req.headers['x-validate'] === 'true';

    const body = await readRequestBody(req);

    // Optional validation pass
    let validationResult: any = null;
    if (shouldValidate) {
      const validator = getValidatorForFile(filename);
      if (validator) {
        validationResult = await validator.validate(body, filename, body.length);
      }
    }

    const result = await loadAACFromBuffer(filename, body);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ...result, validation: validationResult }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Log for debugging during dev
    console.error('AAC load error:', message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message }));
  }
}

async function handleImageRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Method not allowed' }));
    return;
  }

  try {
    // URL will be like "/loadId/imagePath" (without /api/image prefix because of middleware mount)
    const url = req.url || '';
    console.log('[Image API] Request URL:', url);
    // Extract loadId and imageId from URL: /{loadId}/{imageId}
    const match = url.match(/^\/([^/]+)\/(.+)$/);
    if (!match) {
      console.log('[Image API] URL match failed for:', url);
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Invalid image URL format' }));
      return;
    }
    console.log('[Image API] Matched:', match[1], match[2]);

    const [, loadId, imageId] = match;

    // Get the temp file path and filename for this load
    const tmpPath = getTempFilePath(loadId);
    const filename = getFileName(loadId);
    if (!tmpPath || !filename) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'File not found or expired' }));
      return;
    }

    const zip = new AdmZip(tmpPath);
    let imageData: Buffer | null = null;
    let contentType = 'image/png';

    // Check if this is a Grid3 file (.gridset)
    if (filename.toLowerCase().endsWith('.gridset')) {
      // For Grid3, imageId format can be:
      // 1. {pageName}/{x}-{y}  (from our new URL format)
      // 2. {pageId}::{buttonId} (old format, deprecated)

      // Decode URL encoding (spaces become %20, etc)
      const decodedImageId = decodeURIComponent(imageId);
      console.log('[Image API] Grid3 file, decoded imageId:', decodedImageId);

      // Try to parse as pageName/x-y format first
      const pathMatch = decodedImageId.match(/^([^/]+)\/(\d+)-(\d+)$/);
      if (pathMatch) {
        const [, pageName, x, y] = pathMatch;
        const imagePath = `Grids/${pageName}/${x}-${y}-0-text-0.png`;
        console.log('[Image API] Looking for:', imagePath);
        const imageEntry = zip.getEntry(imagePath);
        console.log('[Image API] Found entry:', imageEntry ? 'YES' : 'NO');

        if (imageEntry) {
          imageData = imageEntry.getData();
          contentType = getMimeTypeFromFilename(imagePath);
          console.log('[Image API] Image data size:', imageData.length);
        }
      } else {
        // Fall back to trying to find any image (shouldn't happen with new format)
        const entries = zip.getEntries().filter((e) =>
          e.entryName.startsWith('Grids/') &&
          e.entryName.match(/\d+-\d+-0-text-0\.\w+$/)
        );

        if (entries.length > 0) {
          imageData = entries[0].getData();
          contentType = getMimeTypeFromFilename(entries[0].entryName);
        }
      }
    } else {
      // Handle OBZ files
      // Find the image in the OBF
      const entries = zip.getEntries();

      for (const entry of entries) {
        if (entry.entryName.endsWith('.obf')) {
          try {
            const content = entry.getData().toString('utf8');
            const board = JSON.parse(content);
            if (board.images && Array.isArray(board.images)) {
              const image = board.images.find((img: any) => img.id === imageId);
              if (image) {
                // Try to find the image file
                const imagePath = image.path || `images/${image.filename || imageId}`;
                const imageEntry = zip.getEntry(imagePath);
                if (imageEntry) {
                  imageData = imageEntry.getData();
                  contentType = image.content_type || getMimeTypeFromFilename(imagePath);
                  break;
                }
              }
            }
          } catch (err) {
            continue;
          }
        }
      }
    }

    if (!imageData) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Image not found' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(imageData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Image load error:', message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message }));
  }
}

function getMimeTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  };
  return mimeTypes[ext || ''] || 'image/png';
}

function attachApi(server: ViteDevServer | PreviewServer) {
  server.middlewares.use('/api/load', (req, res) => {
    handleRequest(req, res);
  });

  server.middlewares.use('/api/image', (req, res) => {
    handleImageRequest(req, res);
  });
}

export function aacApiPlugin(): PluginOption {
  return {
    name: 'aac-board-viewer-api',
    configureServer(server) {
      attachApi(server);
    },
    configurePreviewServer(server) {
      attachApi(server);
      return () => {};
    },
  };
}
