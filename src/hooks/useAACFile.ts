/**
 * React hooks for AAC Board Viewer
 */

import { useState, useEffect, useCallback } from 'react';
import { loadAACFile, loadAACFileFromURL, calculateMetrics } from '../utils/loaders';
import type { AACTree } from '@willwade/aac-processors';
import type { ButtonMetric, MetricsOptions } from '../types';

/**
 * Hook to load an AAC file from a URL
 *
 * @param url - URL to the AAC file
 * @param options - Processor options (e.g., pageLayoutPreference for SNAP)
 * @returns Object with tree, loading state, and error
 *
 * @example
 * ```tsx
 * function MyViewer() {
 *   const { tree, loading, error, reload } = useAACFile('/files/board.sps');
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <BoardViewer tree={tree} />;
 * }
 * ```
 */
export function useAACFile(
  url: string,
  options?: {
    processorOptions?: any;
    enabled?: boolean;
  }
) {
  const [tree, setTree] = useState<AACTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (options?.enabled === false) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedTree = await loadAACFileFromURL(url, options?.processorOptions);
      setTree(loadedTree);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load file'));
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    tree,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook to load an AAC file and calculate metrics
 *
 * @param url - URL to the AAC file
 * @param metricsOptions - Metrics calculation options
 * @returns Object with tree, metrics, loading state, and error
 *
 * @example
 * ```tsx
 * function MyViewer() {
 *   const { tree, metrics, loading, error } = useAACFileWithMetrics(
 *     '/files/board.sps',
 *     { accessMethod: 'direct' }
 *   );
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <BoardViewer tree={tree} buttonMetrics={metrics} />;
 * }
 * ```
 */
export function useAACFileWithMetrics(
  url: string,
  metricsOptions?: MetricsOptions,
  fileOptions?: {
    processorOptions?: any;
    enabled?: boolean;
  }
) {
  const [tree, setTree] = useState<AACTree | null>(null);
  const [metrics, setMetrics] = useState<ButtonMetric[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (fileOptions?.enabled === false) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedTree = await loadAACFileFromURL(url, fileOptions?.processorOptions);
      setTree(loadedTree);

      // Calculate metrics
      const calculatedMetrics = await calculateMetrics(loadedTree, metricsOptions || {});
      setMetrics(calculatedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load file'));
    } finally {
      setLoading(false);
    }
  }, [url, metricsOptions, fileOptions]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    tree,
    metrics,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook to calculate metrics for a tree
 *
 * @param tree - The AAC tree
 * @param options - Metrics calculation options
 * @returns Object with metrics, loading state, and error
 *
 * @example
 * ```tsx
 * function MyViewer({ tree }) {
 *   const { metrics, loading } = useMetrics(tree, {
 *     accessMethod: 'scanning',
 *     scanningConfig: { pattern: 'row-column' }
 *   });
 *
 *   return <BoardViewer tree={tree} buttonMetrics={metrics} />;
 * }
 * ```
 */
export function useMetrics(
  tree: AACTree | null,
  options?: MetricsOptions
) {
  const [metrics, setMetrics] = useState<ButtonMetric[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculate = useCallback(async () => {
    if (!tree) {
      setMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const calculatedMetrics = await calculateMetrics(tree, options || {});
      setMetrics(calculatedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate metrics'));
    } finally {
      setLoading(false);
    }
  }, [tree, options]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  return {
    metrics,
    loading,
    error,
    recalculate: calculate,
  };
}

/**
 * Hook for sentence building state
 *
 * @returns Object with message state and handlers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { message, wordCount, effort, addWord, clear } = useSentenceBuilder();
 *
 *   return (
 *     <div>
 *       <p>{message || 'Start building...'}</p>
 *       <p>{wordCount} words, {effort.toFixed(2)} effort</p>
 *       <button onClick={clear}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSentenceBuilder() {
  const [message, setMessage] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [effort, setEffort] = useState(0);

  const addWord = useCallback((word: string, wordEffort: number = 1) => {
    setMessage((prev) => {
      const newMessage = prev + (prev ? ' ' : '') + word;
      setWordCount((prev) => prev + 1);
      setEffort((prev) => prev + wordEffort);
      return newMessage;
    });
  }, []);

  const clear = useCallback(() => {
    setMessage('');
    setWordCount(0);
    setEffort(0);
  }, []);

  return {
    message,
    wordCount,
    effort,
    addWord,
    clear,
  };
}
