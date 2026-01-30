import React, { useState, useMemo, useCallback } from 'react';
import type {
  AACPage,
  AACButton,
} from '@willwade/aac-processors';
import type { BoardViewerProps, ButtonMetric } from '../types';

/**
 * Predictions Tooltip Component
 *
 * Shows a tooltip with predicted word forms when clicking the predictions indicator
 */
interface PredictionsTooltipProps {
  predictions: string[];
  label: string;
  position: { x: number; y: number };
  buttonMetricsLookup: { [buttonId: string]: ButtonMetric };
  onClose: () => void;
  onWordClick?: (word: string, effort: number) => void;
}

function PredictionsTooltip({ predictions, label, position, buttonMetricsLookup, onClose, onWordClick }: PredictionsTooltipProps) {
  // Close tooltip when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && !e.target.closest('.predictions-tooltip')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="predictions-tooltip fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-purple-500 p-3 max-w-xs"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 200)}px`,
        top: `${Math.min(position.y, window.innerHeight - 150)}px`,
      }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to underlying button
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Word forms for &quot;{label}&quot;
        </h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          aria-label="Close"
        >
          <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {predictions.map((word, idx) => {
          // Try to find metrics for this word form by label
          const metricForWord = Object.values(buttonMetricsLookup).find(m => m.label === word);
          const effort = metricForWord?.effort;

          return (
            <span
              key={idx}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium relative cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800 transition"
              onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling
                if (onWordClick) {
                  onWordClick(word, effort || 1.0);
                  onClose();
                }
              }}
              title={`Click to add "${word}" to message`}
            >
              {effort !== undefined && (
                <span className="absolute -top-1 -right-1 px-1 py-0 text-[8px] font-semibold rounded bg-blue-600 text-white shadow-xs">
                  {effort.toFixed(1)}
                </span>
              )}
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

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
  initialPageId,
  navigateToPageId,
  highlight,
  onButtonClick,
  onPageChange,
  className = '',
  loadId,
}: BoardViewerProps) {
  console.log('[BoardViewer] COMPONENT LOADED - Running updated code!');
  console.log('[BoardViewer] loadId:', loadId);
  const resolveInitialPageId = useCallback(() => {
    // Explicit override
    if (initialPageId && tree.pages[initialPageId]) {
      return initialPageId;
    }
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
    // Explicit Start page fallback if present
    const startPage = Object.values(tree.pages).find(
      (p) => p.name.toLowerCase() === 'start'
    );
    if (startPage) {
      return startPage.id;
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
  }, [initialPageId, tree]);

  // Determine which page to show
  const [currentPageId, setCurrentPageId] = useState<string | null>(() => resolveInitialPageId());

  const highlightedButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const [pageHistory, setPageHistory] = useState<AACPage[]>([]);
  const [message, setMessage] = useState('');
  const [currentWordCount, setCurrentWordCount] = useState(0);
  const [currentEffort, setCurrentEffort] = useState(0);

  // Predictions tooltip state
  const [predictionsTooltip, setPredictionsTooltip] = useState<{
    predictions: string[];
    label: string;
    position: { x: number; y: number };
    buttonMetricsLookup: { [buttonId: string]: ButtonMetric };
    onWordClick?: (word: string, effort: number) => void;
  } | null>(null);

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
  const goToPage = (targetPageId: string | undefined | null) => {
    if (!targetPageId || !tree.pages[targetPageId]) return false;
    if (currentPage) {
      setPageHistory((prev) => [...prev, currentPage]);
    }
    setCurrentPageId(targetPageId);
    if (onPageChange) {
      onPageChange(targetPageId);
    }
    return true;
  };

  // Sync when tree or initialPageId changes
  React.useEffect(() => {
    setCurrentPageId(resolveInitialPageId());
    setPageHistory([]);
  }, [resolveInitialPageId]);

  React.useEffect(() => {
    if (!navigateToPageId) return;
    if (!tree.pages[navigateToPageId]) return;
    setCurrentPageId(navigateToPageId);
    setPageHistory([]);
    if (onPageChange) {
      onPageChange(navigateToPageId);
    }
  }, [navigateToPageId, onPageChange, tree.pages]);

  React.useEffect(() => {
    if (highlightedButtonRef.current) {
      highlightedButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [currentPageId, highlight?.pageId, highlight?.x, highlight?.y, highlight?.label]);

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

    const intent = button.semanticAction?.intent
      ? String(button.semanticAction.intent)
      : undefined;
    const targetPageId = button.targetPageId || button.semanticAction?.targetId;
    const effort = buttonMetricsLookup[button.id]?.effort || 1;
    const textValue =
      button.semanticAction?.text || button.message || button.label || '';

    const deleteLastWord = () => {
      setMessage((prev) => {
        const parts = prev.trim().split(/\s+/);
        parts.pop();
        const newMsg = parts.join(' ');
        return newMsg;
      });
    };

    const deleteLastCharacter = () => {
      setMessage((prev) => prev.slice(0, -1));
    };

    const appendText = (word: string) => {
      const trimmed = word || button.label || '';
      setMessage((prev) => {
        const newMessage = trimmed
          ? prev + (prev ? ' ' : '') + trimmed
          : prev;
        if (trimmed) {
          updateStats(trimmed, effort);
        }
        return newMessage;
      });
    };

    // Navigation takes precedence
    if (intent === 'NAVIGATE_TO' && goToPage(targetPageId)) {
      return;
    }

    switch (intent) {
      case 'GO_BACK':
        handleBack();
        return;
      case 'GO_HOME':
        if (tree.rootId && goToPage(tree.rootId)) return;
        break;
      case 'DELETE_WORD':
        deleteLastWord();
        return;
      case 'DELETE_CHARACTER':
        deleteLastCharacter();
        return;
      case 'CLEAR_TEXT':
        clearMessage();
        return;
      case 'SPEAK_IMMEDIATE':
      case 'SPEAK_TEXT':
      case 'INSERT_TEXT':
        appendText(textValue);
        return;
      default:
        break;
    }

    // Fallback navigation if intent not set but target exists
    if (targetPageId && goToPage(targetPageId)) {
      return;
    }

    // Otherwise add to message
    appendText(textValue);
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

  const handleShowPredictions = (
    button: AACButton,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    event.stopPropagation(); // Prevent button click
    const predictions = button.predictions || (button.parameters as { predictions?: string[] })?.predictions;
    if (predictions && predictions.length > 0) {
      setPredictionsTooltip({
        predictions,
        label: button.label,
        position: { x: event.clientX, y: event.clientY },
        buttonMetricsLookup,
        onWordClick: (word, effort) => {
          const trimmed = word || '';
          if (trimmed) {
            setMessage((prev) => {
              const newMessage = prev + (prev ? ' ' : '') + trimmed;
              updateStats(trimmed, effort);
              return newMessage;
            });
          }
        },
      });
    }
  };

  const getTextColor = (backgroundColor?: string) => {
    if (!backgroundColor) return '#111827';

    // Convert hex to rgb for brightness calculation
    const hex = backgroundColor.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness >= 128 ? '#111827' : '#f9fafb';
    }

    return '#111827';
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
                          color: button.style?.fontColor || getTextColor(button.style?.backgroundColor),
                        }}
                        title={`${button.label}\n${button.message || ''}`}
                      >
                        {buttonMetric && showEffortBadges && effort > 0 && (
                          <div className="absolute top-0 right-0 px-0.5 py-0 text-[8px] font-semibold rounded bg-blue-600 text-white">
                            {effort.toFixed(1)}
                          </div>
                        )}
                        <span
                          className="text-[8px] sm:text-[9px] text-center font-medium leading-tight line-clamp-2"
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
            {(() => {
              const rendered = new Set<string>();
              return currentPage.grid.flatMap((row, rowIndex) =>
                row.map((button, colIndex) => {
                  if (!button) {
                    return <div key={`empty-${rowIndex}-${colIndex}`} className="aspect-square" />;
                  }

                  if (rendered.has(button.id)) {
                    return null;
                  }
                  rendered.add(button.id);

                  const buttonMetric = buttonMetricsLookup[button.id];
                  const effort = buttonMetric?.effort || 0;
                  const targetPageId = button.targetPageId || button.semanticAction?.targetId;
                  const hasLink = targetPageId && tree.pages[targetPageId];
                  const colSpan = button.columnSpan || 1;
                  const rowSpan = button.rowSpan || 1;
                  const predictions =
                    button.predictions || (button.parameters as { predictions?: string[] })?.predictions;
                  const hasPredictions = predictions && predictions.length > 0;
                  const isPredictionCell =
                    button.contentType === 'AutoContent' &&
                    (button.contentSubType || '').toLowerCase() === 'prediction';
                  const isWorkspace = button.contentType === 'Workspace';

                  const isHighlighted =
                    highlight &&
                    highlight.pageId === currentPageId &&
                    (highlight.buttonId === button.id ||
                      (highlight.x !== undefined && highlight.y !== undefined
                        ? button.x === highlight.x && button.y === highlight.y
                        : false) ||
                      (highlight.label && button.label === highlight.label));

                  // Determine the image source
                  // Note: For Grid3 files with loadId, we'll use apiUrl instead (set below)
                  const imageSrc =
                    (button.resolvedImageEntry && !String(button.resolvedImageEntry).startsWith('[')
                      ? button.resolvedImageEntry
                      : null) ||
                    (button.image && !String(button.image).startsWith('[') ? button.image : null);

                  // For OBZ files with loadId, use the image API endpoint
                  // For Grid3 files, also use API if we have resolvedImageEntry
                  const params = button.parameters as {
                    image_id?: string;
                    gridPageName?: string;
                  };

                  let apiUrl: string | undefined = undefined;
                  console.log('[BoardViewer] Button:', button.label, 'loadId:', loadId, 'resolvedImageEntry:', button.resolvedImageEntry);
                  if (loadId) {
                    console.log('[BoardViewer] loadId exists, checking image conditions');
                    // OBZ files have large data URLs or image_id
                    if (button.image && button.image.length > 1000 && params.image_id) {
                      apiUrl = `/api/image/${loadId}/${params.image_id}`;
                      console.log('[BoardViewer] Using OBZ image_id API:', apiUrl);
                    }
                    // Grid3 files: use resolvedImageEntry if available (contains full path)
                    else if (button.resolvedImageEntry && !button.resolvedImageEntry.startsWith('[')) {
                      // Extract just the path after "Grids/" for the API
                      const entryPath = button.resolvedImageEntry;
                      const pathMatch = entryPath.match(/^(?:Grids\/)?(.+)$/);
                      if (pathMatch) {
                        apiUrl = `/api/image/${loadId}/${pathMatch[1]}`;
                        console.log('[BoardViewer] Button:', button.label, 'resolvedImageEntry:', entryPath, 'apiUrl:', apiUrl);
                      } else {
                        console.log('[BoardViewer] Button:', button.label, 'resolvedImageEntry no match:', entryPath);
                      }
                    } else {
                      console.log('[BoardViewer] loadId exists but no valid image condition');
                    }
                  } else {
                    console.log('[BoardViewer] loadId is undefined/null');
                  }

                  if (isWorkspace) {
                    return (
                      <div
                        key={button.id}
                        className="relative p-3 rounded-lg border-2 bg-gray-50 text-gray-800 flex items-center gap-2"
                        style={{
                          borderColor: button.style?.borderColor || '#e5e7eb',
                          gridColumn: `${colIndex + 1} / span ${colSpan}`,
                          gridRow: `${rowIndex + 1} / span ${rowSpan}`,
                        }}
                      >
                        <div className="font-semibold text-sm">{button.label || 'Workspace'}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {message || 'Chat writing area'}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={button.id}
                      onClick={() => handleButtonClick(button)}
                      ref={isHighlighted ? highlightedButtonRef : undefined}
                      className={`relative aspect-square p-2 rounded-lg border-2 transition flex flex-col items-center justify-center gap-1 hover:opacity-80 hover:scale-105 active:scale-95 ${
                        isHighlighted
                          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-white'
                          : ''
                      }`}
                      style={{
                        backgroundColor: button.style?.backgroundColor || '#f3f4f6',
                        borderColor: button.style?.borderColor || '#e5e7eb',
                        color: button.style?.fontColor || getTextColor(button.style?.backgroundColor),
                        gridColumn: `${colIndex + 1} / span ${colSpan}`,
                        gridRow: `${rowIndex + 1} / span ${rowSpan}`,
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

                      {/* Predictions Indicator */}
                      {hasPredictions && (
                        <div
                          onClick={(e) => handleShowPredictions(button, e)}
                          className="absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-semibold rounded bg-purple-600 text-white shadow-sm cursor-pointer hover:bg-purple-700 transition"
                          title={`Has ${predictions?.length} word form${predictions && predictions.length > 1 ? 's' : ''}`}
                        >
                          {predictions?.length}
                        </div>
                      )}

                      {/* Image */}
                      {(imageSrc || apiUrl) && (
                        <img
                          src={(apiUrl || imageSrc) ?? undefined}
                          alt={button.label}
                          className="max-h-12 object-contain"
                        />
                      )}

                      {/* Label / Predictions */}
                      <div className="flex flex-col items-center justify-center">
                        <span
                          className="text-xs sm:text-sm text-center font-medium leading-tight line-clamp-3"
                        >
                          {button.label}
                        </span>
                        {isPredictionCell && predictions && predictions.length > 0 && (
                          <div className="mt-1 text-[10px] sm:text-xs text-center opacity-80 space-y-0.5">
                            {predictions.slice(0, 3).map((p, idx) => (
                              <div key={`${button.id}-pred-${idx}`}>
                                {p}
                              </div>
                            ))}
                            {predictions.length > 3 && <div>…</div>}
                          </div>
                        )}
                      </div>

                      {/* Message (if different from label) */}
                      {button.message && button.message !== button.label && !isPredictionCell && (
                        <span
                          className="text-[10px] sm:text-xs text-center opacity-75 line-clamp-2"
                        >
                          {button.message}
                        </span>
                      )}
                    </button>
                  );
                })
              );
            })()}
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

      {/* Predictions Tooltip */}
      {predictionsTooltip && (
        <PredictionsTooltip
          predictions={predictionsTooltip.predictions}
          label={predictionsTooltip.label}
          position={predictionsTooltip.position}
          buttonMetricsLookup={predictionsTooltip.buttonMetricsLookup}
          onWordClick={predictionsTooltip.onWordClick}
          onClose={() => setPredictionsTooltip(null)}
        />
      )}
    </div>
  );
}
