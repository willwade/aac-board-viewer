/**
 * AAC Board Viewer - Type Definitions
 *
 * Re-exports types from @willwade/aac-processors
 * and adds viewer-specific types
 */

import type {
  AACTree,
  AACPage,
  AACButton,
  AACSemanticAction,
  AACSemanticCategory,
  AACSemanticIntent,
} from '@willwade/aac-processors';

/**
 * Button metric information for effort scoring
 */
export interface ButtonMetric {
  /** Button ID */
  id: string;
  /** Button label text */
  label: string;
  /** Cognitive effort score (lower is easier) */
  effort: number;
  /** Usage count */
  count?: number;
  /** Whether the button represents a word */
  is_word?: boolean;
  /** Depth level in navigation tree */
  level?: number;
}

/**
 * Props for BoardViewer component
 */
export interface BoardViewerProps {
  /** The AAC tree containing pages and navigation structure */
  tree: import('@willwade/aac-processors').AACTree;
  /** Optional button metrics to display effort scores */
  buttonMetrics?: ButtonMetric[] | null;
  /** Show the message bar at the top (default: true) */
  showMessageBar?: boolean;
  /** Show effort badges on buttons (default: true if metrics provided) */
 showEffortBadges?: boolean;
  /** Show indicators for buttons that link to other pages (default: true) */
  showLinkIndicators?: boolean;
  /** Start the viewer on this page id (overrides tree.rootId) */
  initialPageId?: string;
  /** Callback when a button is clicked */
  onButtonClick?: (button: import('@willwade/aac-processors').AACButton) => void;
  /** Callback when page changes */
  onPageChange?: (pageId: string) => void;
  /** Custom CSS class name */
  className?: string;
}

/**
 * Result from loading an AAC file
 */
export interface LoadAACFileResult {
  tree: import('@willwade/aac-processors').AACTree;
  format: string;
  metadata?: {
    [key: string]: unknown;
  };
}

/**
 * Metrics calculation options
 */
// Re-export processor types
export type { AACTree, AACPage, AACButton, AACSemanticAction, AACSemanticCategory, AACSemanticIntent };

export interface MetricsOptions {
  /** Access method: 'direct' or 'scanning' */
  accessMethod?: 'direct' | 'scanning';
  /** Scanning configuration */
  scanningConfig?: {
    /** Scanning pattern: 'linear', 'row-column', or 'block' */
    pattern?: 'linear' | 'row-column' | 'block';
    /** Selection method for scanning */
    selectionMethod?: string;
    /** Enable error correction */
    errorCorrection?: boolean;
  };
}
