import React, { useState, useMemo } from 'react';
import type {
  AACPage,
  AACButton,
} from '@willwade/aac-processors';
import type { BoardViewerProps, ButtonMetric } from '../types';

/**
 * AAC Board Viewer Component
 *
 * Displays AAC boards with interactive navigation, sentence building,
 * and optional effort metrics.
 *
 * @param props - BoardViewerProps
 */
export function BoardViewer({
  tree,
  buttonMetrics,
  showMessageBar = true,
  showEffortBadges = true,
  showLinkIndicators = true,
  onButtonClick,
  onPageChange,
  className = '',
}: BoardViewerProps) {
  // Determine which page to show
  const [currentPageId, setCurrentPageId] = useState<string | null>(() => {
    // If toolbar exists and rootId is different, use rootId
    if (tree.toolbarId && tree.rootId && tree.rootId !== tree.toolbarId) {
      return tree.rootId;
    }
    // If rootId exists and is not a toolbar, use it
    if (tree.rootId && tree.pages[tree.rootId]) {
      const rootPage = tree.pages[tree.rootId];
      const isToolbar =
        rootPage.name.toLowerCase().includes('toolbar') ||
        rootPage.name.toLowerCase().includes('tool bar');
      if (!isToolbar) {
        return tree.rootId;
      }
    }
    // Fall back to first page that's not a toolbar
    const nonToolbarPage = Object.values(tree.pages).find(
      (p) => !p.name.toLowerCase().includes('toolbar') && !p.name.toLowerCase().includes('tool bar')
    );
    if (nonToolbarPage) {
      return nonToolbarPage.id;
    }
    // Last resort: first page
    const pageIds = Object.keys(tree.pages);
    return pageIds.length > 0 ? pageIds[0] : null;
  });

  const [pageHistory, setPageHistory] = useState<AACPage[]>([]);
  const [message, setMessage] = useState('');
  const [currentWordCount, setCurrentWordCount] = useState(0);
  const [currentEffort, setCurrentEffort] = useState(0);

  // Convert button metrics array to lookup object for easy access
  const buttonMetricsLookup = useMemo(() => {
    if (!buttonMetrics) return {};
    const lookup: { [buttonId: string]: ButtonMetric } = {};
    buttonMetrics.forEach((metric) => {
      lookup[metric.id] = metric;
    });
    return lookup;
  }, [buttonMetrics]);

  const currentPage = currentPageId ? tree.pages[currentPageId] : null;

  // Calculate total stats for current word
  const updateStats = (word: string, effort: number) => {
    setCurrentWordCount((prev) => prev + 1);
    setCurrentEffort((prev) => prev + effort);
  };

  const handleButtonClick = (button: AACButton) => {
    // Call external callback if provided
    if (onButtonClick) {
      onButtonClick(button);
    }

    // Check if button links to another page via targetPageId or semanticAction
    const targetPageId = button.targetPageId || button.semanticAction?.targetId;

    if (targetPageId && tree.pages[targetPageId]) {
      if (currentPage) {
        setPageHistory((prev) => [...prev, currentPage]);
      }
      setCurrentPageId(targetPageId);
      if (onPageChange) {
        onPageChange(targetPageId);
      }
      return;
    }

    // Otherwise add to message
    const word = button.message || button.label;
    const effort = buttonMetricsLookup[button.id]?.effort || 1;

    setMessage((prev) => {
      const newMessage = prev + (prev ? ' ' : '') + word;
      updateStats(word, effort);
      return newMessage;
    });
  };

  const handleBack = () => {
    if (pageHistory.length > 0) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setPageHistory((prev) => prev.slice(0, -1));
      setCurrentPageId(previousPage.id);
      if (onPageChange) {
        onPageChange(previousPage.id);
      }
    }
  };

  const clearMessage = () => {
    setMessage('');
    setCurrentWordCount(0);
    setCurrentEffort(0);
  };

  const getTextColor = (backgroundColor?: string) => {
    if (!backgroundColor) return 'text-gray-900 dark:text-gray-100';

    // Convert hex to rgb for brightness calculation
    const hex = backgroundColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness >= 128 ? 'text-gray-900' : 'text-white';
    }

    return 'text-gray-900 dark:text-gray-100';
  };

  if (!currentPage) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No pages available</p>
        </div>
      </div>
    );
  }

  // Get toolbar page if it exists
  const toolbarPage = tree.toolbarId ? tree.pages[tree.toolbarId] : null;

  // Get grid dimensions
  const gridRows = currentPage.grid.length;
  const gridCols = gridRows > 0 ? currentPage.grid[0].length : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Message Bar */}
      {showMessageBar && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {message ? (
                <div className="space-y-2">
                  <p className="text-lg text-gray-900 dark:text-white break-words">{message}</p>
                  <div className="flex gap-4 text-sm">
                    <div className="text-gray-600 dark:text-gray-400">
                      {currentWordCount} {currentWordCount === 1 ? 'word' : 'words'}
                    </div>
                    {buttonMetrics && (
                      <>
                        <div className="text-gray-600 dark:text-gray-400">
                          Effort: <span className="font-medium">{currentEffort.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Avg:{' '}
                          <span className="font-medium">
                            {currentWordCount > 0
                              ? (currentEffort / currentWordCount).toFixed(2)
                              : '0.00'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Tap buttons to build a sentence...
                </p>
              )}
            </div>
            {message && (
              <button
                onClick={clearMessage}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Clear message"
              >
                <svg
                  className="h-5 w-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex">
        {/* Toolbar Sidebar (if exists) */}
        {toolbarPage && (
          <div className="w-16 sm:w-20 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="p-2">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mb-2 font-semibold">
                TOOLBAR
              </p>
              <div className="grid gap-1">
                {toolbarPage.grid.map((row, _rowIndex) =>
                  row.map((button, _colIndex) => {
                    if (!button) return null;

                    const buttonMetric = buttonMetricsLookup[button.id];
                    const effort = buttonMetric?.effort || 0;

                    return (
                      <button
                        key={button.id}
                        onClick={() => handleButtonClick(button)}
                        className="aspect-square p-1 rounded border border-gray-200 dark:border-gray-700 transition flex flex-col items-center justify-center gap-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 relative"
                        style={{
                          backgroundColor: button.style?.backgroundColor || '#f3f4f6',
                          borderColor: button.style?.borderColor || '#e5e7eb',
                        }}
                        title={`${button.label}\n${button.message || ''}`}
                      >
                        {buttonMetric && showEffortBadges && effort > 0 && (
                          <div className="absolute top-0 right-0 px-0.5 py-0 text-[8px] font-semibold rounded bg-blue-600 text-white">
                            {effort.toFixed(1)}
                          </div>
                        )}
                        <span
                          className={`text-[8px] sm:text-[9px] text-center font-medium leading-tight line-clamp-2 ${getTextColor(
                            button.style?.backgroundColor
                          )}`}
                        >
                          {button.label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Page Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {pageHistory.length > 0 && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  aria-label="Go back"
                >
                  <svg
                    className="h-5 w-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentPage.name}
              </h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {gridRows}×{gridCols} grid
            </div>
          </div>

          {/* Grid */}
          <div
            className="p-4 gap-2 overflow-auto max-h-[600px]"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {currentPage.grid.map((row, rowIndex) =>
              row.map((button, colIndex) => {
                if (!button) {
                  return <div key={`empty-${rowIndex}-${colIndex}`} className="aspect-square" />;
                }

                const buttonMetric = buttonMetricsLookup[button.id];
                const effort = buttonMetric?.effort || 0;
                const targetPageId = button.targetPageId || button.semanticAction?.targetId;
                const hasLink = targetPageId && tree.pages[targetPageId];

                return (
                  <button
                    key={button.id}
                    onClick={() => handleButtonClick(button)}
                    className="relative aspect-square p-2 rounded-lg border-2 transition flex flex-col items-center justify-center gap-1 hover:opacity-80 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: button.style?.backgroundColor || '#f3f4f6',
                      borderColor: button.style?.borderColor || '#e5e7eb',
                      color: button.style?.fontColor || undefined,
                    }}
                  >
                    {/* Effort Badge */}
                    {buttonMetric && showEffortBadges && (
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white shadow-sm">
                        {effort.toFixed(1)}
                      </div>
                    )}

                    {/* Link Indicator */}
                    {hasLink && showLinkIndicators && (
                      <div className="absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                    )}

                    {/* Label */}
                    <span
                      className={`text-xs sm:text-sm text-center font-medium leading-tight line-clamp-3 ${getTextColor(
                        button.style?.backgroundColor
                      )}`}
                    >
                      {button.label}
                    </span>

                    {/* Message (if different from label) */}
                    {button.message && button.message !== button.label && (
                      <span
                        className={`text-[10px] sm:text-xs text-center opacity-75 line-clamp-2 ${getTextColor(
                          button.style?.backgroundColor
                        )}`}
                      >
                        {button.message}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Page Navigation (if multiple pages) */}
          {Object.keys(tree.pages).length > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {Object.keys(tree.pages).length} pages in this vocabulary
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
