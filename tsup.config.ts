import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/board-viewer.ts', 'src/styles.css'],
  format: ['cjs', 'esm'],
  loader: {
    '.css': 'copy',
  },
  dts: {
    entry: {
      index: 'src/index.ts',
      'board-viewer': 'src/board-viewer.ts',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@willwade/aac-processors'],
});
