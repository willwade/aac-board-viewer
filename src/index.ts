/**
 * AAC Board Viewer
 *
 * Universal AAC board viewer component for React
 */

// Main component
export { BoardViewer } from './components/BoardViewer';

// Hooks
export {
  useAACFile,
  useAACFileWithMetrics,
  useMetrics,
  useSentenceBuilder,
} from './hooks/useAACFile';

// Utilities
export {
  loadAACFile,
  loadAACFileFromURL,
  loadAACFileFromFile,
  loadAACFileWithMetadata,
  calculateMetrics,
  getSupportedFormats,
} from './utils/loaders';

// Types
export type {
  BoardViewerProps,
  ButtonMetric,
  LoadAACFileResult,
  MetricsOptions,
} from './types';

// Re-export AAC processor types
export type {
  AACTree,
  AACPage,
  AACButton,
  AACSemanticAction,
  AACSemanticCategory,
  AACSemanticIntent,
} from '@willwade/aac-processors';
