import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PluginOption, ViteDevServer, PreviewServer } from 'vite';
import { loadAACFromBuffer } from './aac-loader';
import { getValidatorForFile } from '@willwade/aac-processors/validation';

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

function attachApi(server: ViteDevServer | PreviewServer) {
  server.middlewares.use('/api/load', (req, res) => {
    handleRequest(req, res);
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
