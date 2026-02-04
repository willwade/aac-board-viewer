import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  h,
  type PropType,
  type VNode,
  type VNodeRef,
} from 'vue';
import type { AACPage, AACButton } from '@willwade/aac-processors';
import type { BoardViewerProps, ButtonMetric } from '../types';

interface PredictionsTooltipProps {
  predictions: string[];
  label: string;
  position: { x: number; y: number };
  buttonMetricsLookup: { [buttonId: string]: ButtonMetric };
  onClose: () => void;
  onWordClick?: (word: string, effort: number) => void;
}

const PredictionsTooltip = defineComponent({
  name: 'PredictionsTooltip',
  props: {
    predictions: { type: Array as PropType<string[]>, required: true },
    label: { type: String, required: true },
    position: {
      type: Object as PropType<{ x: number; y: number }>,
      required: true,
    },
    buttonMetricsLookup: {
      type: Object as PropType<{ [buttonId: string]: ButtonMetric }>,
      required: true,
    },
    onClose: { type: Function as PropType<() => void>, required: true },
    onWordClick: {
      type: Function as PropType<(word: string, effort: number) => void>,
      required: false,
    },
  },
  setup(props: Readonly<PredictionsTooltipProps>) {
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && !e.target.closest('.predictions-tooltip')) {
        props.onClose();
      }
    };

    onMounted(() => {
      document.addEventListener('mousedown', handleClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', handleClickOutside);
    });

    const getPosition = () => {
      const maxX = typeof window !== 'undefined' ? window.innerWidth - 200 : props.position.x;
      const maxY = typeof window !== 'undefined' ? window.innerHeight - 150 : props.position.y;
      return {
        left: `${Math.min(props.position.x, maxX)}px`,
        top: `${Math.min(props.position.y, maxY)}px`,
      };
    };

    return () => {
      const positionStyle = getPosition();

      return h(
        'div',
        {
          class:
            'predictions-tooltip fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-purple-500 p-3 max-w-xs',
          style: positionStyle,
          onClick: (e: MouseEvent) => e.stopPropagation(),
        },
        [
          h('div', { class: 'flex items-center justify-between mb-2' }, [
            h(
              'h4',
              { class: 'text-sm font-semibold text-gray-900 dark:text-white' },
              `Word forms for "${props.label}"`
            ),
            h(
              'button',
              {
                onClick: props.onClose,
                class: 'p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded',
                'aria-label': 'Close',
              },
              [
                h(
                  'svg',
                  {
                    class: 'h-4 w-4 text-gray-600 dark:text-gray-400',
                    fill: 'none',
                    stroke: 'currentColor',
                    viewBox: '0 0 24 24',
                  },
                  [
                    h('path', {
                      'stroke-linecap': 'round',
                      'stroke-linejoin': 'round',
                      'stroke-width': 2,
                      d: 'M6 18L18 6M6 6l12 12',
                    }),
                  ]
                ),
              ]
            ),
          ]),
          h(
            'div',
            { class: 'flex flex-wrap gap-1' },
            props.predictions.map((word: string, idx: number) => {
              const metricForWord = Object.values(props.buttonMetricsLookup).find(
                (m: ButtonMetric) => m.label === word
              );
              const effort = metricForWord?.effort;

              return h(
                'span',
                {
                  key: `${word}-${idx}`,
                  class:
                    'px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs font-medium relative cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800 transition',
                  title: `Click to add "${word}" to message`,
                  onClick: (e: MouseEvent) => {
                    e.stopPropagation();
                    if (props.onWordClick) {
                      props.onWordClick(word, effort || 1.0);
                      props.onClose();
                    }
                  },
                },
                [
                  effort !== undefined
                    ? h(
                        'span',
                        {
                          class:
                            'absolute -top-1 -right-1 px-1 py-0 text-[8px] font-semibold rounded bg-blue-600 text-white shadow-xs',
                        },
                        effort.toFixed(1)
                      )
                    : null,
                  word,
                ]
              );
            })
          ),
        ]
      );
    };
  },
});

export const BoardViewer = defineComponent({
  name: 'BoardViewer',
  props: {
    tree: { type: Object as PropType<BoardViewerProps['tree']>, required: true },
    buttonMetrics: { type: Array as PropType<ButtonMetric[] | null>, default: null },
    showMessageBar: { type: Boolean, default: true },
    showEffortBadges: { type: Boolean, default: true },
    showLinkIndicators: { type: Boolean, default: true },
    initialPageId: { type: String, default: undefined },
    navigateToPageId: { type: String, default: undefined },
    highlight: { type: Object as PropType<BoardViewerProps['highlight']>, default: undefined },
    onButtonClick: {
      type: Function as PropType<(button: AACButton) => void>,
      default: undefined,
    },
    onPageChange: {
      type: Function as PropType<(pageId: string) => void>,
      default: undefined,
    },
    className: { type: String, default: '' },
    loadId: { type: String, default: undefined },
  },
  setup(props: Readonly<BoardViewerProps>) {
    const resolveInitialPageId = () => {
      if (props.initialPageId && props.tree.pages[props.initialPageId]) {
        return props.initialPageId;
      }
      if (props.tree.toolbarId && props.tree.rootId && props.tree.rootId !== props.tree.toolbarId) {
        return props.tree.rootId;
      }
      if (props.tree.rootId && props.tree.pages[props.tree.rootId]) {
        const rootPage = props.tree.pages[props.tree.rootId];
        const isToolbar =
          rootPage.name.toLowerCase().includes('toolbar') ||
          rootPage.name.toLowerCase().includes('tool bar');
        if (!isToolbar) {
          return props.tree.rootId;
        }
      }
      const startPage = Object.values(props.tree.pages).find(
        (p) => p.name.toLowerCase() === 'start'
      );
      if (startPage) {
        return startPage.id;
      }
      const nonToolbarPage = Object.values(props.tree.pages).find(
        (p) => !p.name.toLowerCase().includes('toolbar') && !p.name.toLowerCase().includes('tool bar')
      );
      if (nonToolbarPage) {
        return nonToolbarPage.id;
      }
      const pageIds = Object.keys(props.tree.pages);
      return pageIds.length > 0 ? pageIds[0] : null;
    };

    const currentPageId = ref<string | null>(resolveInitialPageId());
    const highlightedButtonRef = ref<HTMLButtonElement | null>(null);
    const pageHistory = ref<AACPage[]>([]);
    const message = ref('');
    const currentWordCount = ref(0);
    const currentEffort = ref(0);

    const predictionsTooltip = ref<PredictionsTooltipProps | null>(null);

    const buttonMetricsLookup = computed(() => {
      if (!props.buttonMetrics) return {};
      const lookup: { [buttonId: string]: ButtonMetric } = {};
      props.buttonMetrics.forEach((metric: ButtonMetric) => {
        lookup[metric.id] = metric;
      });
      return lookup;
    });

    const currentPage = computed(() =>
      currentPageId.value ? props.tree.pages[currentPageId.value] : null
    );

    const goToPage = (targetPageId: string | undefined | null) => {
      if (!targetPageId || !props.tree.pages[targetPageId]) return false;
      if (currentPage.value) {
        pageHistory.value = [...pageHistory.value, currentPage.value];
      }
      currentPageId.value = targetPageId;
      if (props.onPageChange) {
        props.onPageChange(targetPageId);
      }
      return true;
    };

    watch([() => props.tree, () => props.initialPageId], () => {
      currentPageId.value = resolveInitialPageId();
      pageHistory.value = [];
    });

    watch(
      () => props.navigateToPageId,
      (pageId: string | undefined) => {
        if (!pageId) return;
        if (!props.tree.pages[pageId]) return;
        currentPageId.value = pageId;
        pageHistory.value = [];
        if (props.onPageChange) {
          props.onPageChange(pageId);
        }
      }
    );

    watch(
      [
        currentPageId,
        () => props.highlight?.pageId,
        () => props.highlight?.x,
        () => props.highlight?.y,
        () => props.highlight?.label,
      ],
      () => {
        nextTick(() => {
          if (highlightedButtonRef.value) {
            highlightedButtonRef.value.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center',
            });
          }
        });
      }
    );

    const updateStats = (word: string, effort: number) => {
      currentWordCount.value += 1;
      currentEffort.value += effort;
    };

    const clearMessage = () => {
      message.value = '';
      currentWordCount.value = 0;
      currentEffort.value = 0;
    };

    const handleBack = () => {
      if (pageHistory.value.length > 0) {
        const previousPage = pageHistory.value[pageHistory.value.length - 1];
        pageHistory.value = pageHistory.value.slice(0, -1);
        currentPageId.value = previousPage.id;
        if (props.onPageChange) {
          props.onPageChange(previousPage.id);
        }
      }
    };

    const handleButtonClick = (button: AACButton) => {
      if (props.onButtonClick) {
        props.onButtonClick(button);
      }

      const intent = button.semanticAction?.intent
        ? String(button.semanticAction.intent)
        : undefined;
      const targetPageId = button.targetPageId || button.semanticAction?.targetId;
      const effort = buttonMetricsLookup.value[button.id]?.effort || 1;
      const textValue =
        button.semanticAction?.text || button.message || button.label || '';

      const deleteLastWord = () => {
        message.value = message.value
          .trim()
          .split(/\s+/)
          .slice(0, -1)
          .join(' ');
      };

      const deleteLastCharacter = () => {
        message.value = message.value.slice(0, -1);
      };

      const appendText = (word: string) => {
        const trimmed = word || button.label || '';
        message.value = trimmed
          ? `${message.value}${message.value ? ' ' : ''}${trimmed}`
          : message.value;
        if (trimmed) {
          updateStats(trimmed, effort);
        }
      };

      if (intent === 'NAVIGATE_TO' && goToPage(targetPageId)) {
        return;
      }

      switch (intent) {
        case 'GO_BACK':
          handleBack();
          return;
        case 'GO_HOME':
          if (props.tree.rootId && goToPage(props.tree.rootId)) return;
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

      if (targetPageId && goToPage(targetPageId)) {
        return;
      }

      appendText(textValue);
    };

    const handleShowPredictions = (button: AACButton, event: MouseEvent) => {
      event.stopPropagation();
      const predictions =
        button.predictions || (button.parameters as { predictions?: string[] })?.predictions;
      if (predictions && predictions.length > 0) {
        predictionsTooltip.value = {
          predictions,
          label: button.label,
          position: { x: event.clientX, y: event.clientY },
          buttonMetricsLookup: buttonMetricsLookup.value,
          onWordClick: (word: string, effort: number) => {
            const trimmed = word || '';
            if (trimmed) {
              message.value = `${message.value}${message.value ? ' ' : ''}${trimmed}`;
              updateStats(trimmed, effort);
            }
          },
          onClose: () => {
            predictionsTooltip.value = null;
          },
        };
      }
    };

    const getTextColor = (backgroundColor?: string) => {
      if (!backgroundColor) return '#111827';

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

    const renderToolbar = (toolbarPage: AACPage | null): VNode | null => {
      if (!toolbarPage) return null;

      return h('div', {
        class:
          'w-16 sm:w-20 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50',
      }, [
        h('div', { class: 'p-2' }, [
          h(
            'p',
            {
              class:
                'text-[10px] text-gray-500 dark:text-gray-400 text-center mb-2 font-semibold',
            },
            'TOOLBAR'
          ),
          h(
            'div',
            { class: 'grid gap-1' },
            toolbarPage.grid.flatMap((row: (AACButton | null)[]) =>
              row.map((button: AACButton | null) => {
                if (!button) return null;

                const buttonMetric = buttonMetricsLookup.value[button.id];
                const effort = buttonMetric?.effort || 0;

                return h(
                  'button',
                  {
                    key: button.id,
                    onClick: () => handleButtonClick(button),
                    class:
                      'aspect-square p-1 rounded border border-gray-200 dark:border-gray-700 transition flex flex-col items-center justify-center gap-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 relative',
                    style: {
                      backgroundColor: button.style?.backgroundColor || '#f3f4f6',
                      borderColor: button.style?.borderColor || '#e5e7eb',
                      color:
                        button.style?.fontColor || getTextColor(button.style?.backgroundColor),
                    },
                    title: `${button.label}\n${button.message || ''}`,
                  },
                  [
                    buttonMetric && props.showEffortBadges && effort > 0
                      ? h(
                          'div',
                          {
                            class:
                              'absolute top-0 right-0 px-0.5 py-0 text-[8px] font-semibold rounded bg-blue-600 text-white',
                          },
                          effort.toFixed(1)
                        )
                      : null,
                    h(
                      'span',
                      {
                        class:
                          'text-[8px] sm:text-[9px] text-center font-medium leading-tight line-clamp-2',
                      },
                      button.label
                    ),
                  ]
                );
              })
            )
          ),
        ]),
      ]);
    };

    const renderGridCells = (): (VNode | null)[] => {
      if (!currentPage.value) return [];
      const rendered = new Set<string>();
      const cells: (VNode | null)[] = [];

      currentPage.value.grid.forEach((row: (AACButton | null)[], rowIndex: number) => {
        row.forEach((button: AACButton | null, colIndex: number) => {
          if (!button) {
            cells.push(
              h('div', {
                key: `empty-${rowIndex}-${colIndex}`,
                class: 'aspect-square',
              })
            );
            return;
          }

          if (rendered.has(button.id)) {
            cells.push(null);
            return;
          }
          rendered.add(button.id);

          const buttonMetric = buttonMetricsLookup.value[button.id];
          const effort = buttonMetric?.effort || 0;
          const targetPageId = button.targetPageId || button.semanticAction?.targetId;
          const hasLink = targetPageId && props.tree.pages[targetPageId];
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
            props.highlight &&
            props.highlight.pageId === currentPageId.value &&
            (props.highlight.buttonId === button.id ||
              (props.highlight.x !== undefined && props.highlight.y !== undefined
                ? button.x === props.highlight.x && button.y === props.highlight.y
                : false) ||
              (props.highlight.label && button.label === props.highlight.label));

          const params = button.parameters as {
            image_id?: string;
            gridPageName?: string;
            imageData?: Buffer;
          };

          let imageSrc: string | null = null;
          let apiUrl: string | undefined = undefined;

          const resolvedEntry = button.resolvedImageEntry;
          const buttonImage = button.image;

          if (
            resolvedEntry &&
            typeof resolvedEntry === 'string' &&
            resolvedEntry.startsWith('data:image/')
          ) {
            imageSrc = resolvedEntry;
          } else if (
            buttonImage &&
            typeof buttonImage === 'string' &&
            buttonImage.startsWith('data:image/')
          ) {
            imageSrc = buttonImage;
          } else if (
            resolvedEntry &&
            typeof resolvedEntry === 'string' &&
            !resolvedEntry.startsWith('[') &&
            !resolvedEntry.startsWith('data:image/')
          ) {
            if (props.loadId) {
              const entryPath = resolvedEntry;
              const pathMatch = entryPath.match(/^(?:Grids\/)?(.+)$/);
              if (pathMatch) {
                apiUrl = `/api/image/${props.loadId}/${encodeURIComponent(pathMatch[1])}`;
              }
            } else {
              imageSrc = resolvedEntry;
            }
          } else if (
            buttonImage &&
            typeof buttonImage === 'string' &&
            !buttonImage.startsWith('[')
          ) {
            imageSrc = buttonImage;
          }

          if (
            props.loadId &&
            !imageSrc &&
            !apiUrl &&
            params &&
            params.image_id &&
            typeof params.image_id === 'string'
          ) {
            apiUrl = `/api/image/${props.loadId}/${encodeURIComponent(params.image_id)}`;
          }

          if (isWorkspace) {
            cells.push(
              h(
                'div',
                {
                  key: button.id,
                  class:
                    'relative p-3 rounded-lg border-2 bg-gray-50 text-gray-800 flex items-center gap-2',
                  style: {
                    borderColor: button.style?.borderColor || '#e5e7eb',
                    gridColumn: `${colIndex + 1} / span ${colSpan}`,
                    gridRow: `${rowIndex + 1} / span ${rowSpan}`,
                  },
                },
                [
                  h('div', { class: 'font-semibold text-sm' }, button.label || 'Workspace'),
                  h('div', { class: 'text-xs text-gray-500 truncate' }, message.value || 'Chat writing area'),
                ]
              )
            );
            return;
          }

          cells.push(
            h(
              'button',
              {
                key: button.id,
                onClick: () => handleButtonClick(button),
                ref: isHighlighted
                  ? ((el: Element | null) => {
                      highlightedButtonRef.value = el as HTMLButtonElement | null;
                    }) as VNodeRef
                  : undefined,
                class:
                  `relative aspect-square p-2 rounded-lg border-2 transition flex flex-col items-center justify-center gap-1 hover:opacity-80 hover:scale-105 active:scale-95 ${
                    isHighlighted ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-white' : ''
                  }`,
                style: {
                  backgroundColor: button.style?.backgroundColor || '#f3f4f6',
                  borderColor: button.style?.borderColor || '#e5e7eb',
                  color:
                    button.style?.fontColor || getTextColor(button.style?.backgroundColor),
                  gridColumn: `${colIndex + 1} / span ${colSpan}`,
                  gridRow: `${rowIndex + 1} / span ${rowSpan}`,
                },
              },
              [
                buttonMetric && props.showEffortBadges
                  ? h(
                      'div',
                      {
                        class:
                          'absolute top-1 right-1 px-1.5 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white shadow-sm',
                      },
                      effort.toFixed(1)
                    )
                  : null,
                hasLink && props.showLinkIndicators
                  ? h('div', {
                      class:
                        'absolute top-1 left-1 w-2 h-2 bg-green-500 rounded-full shadow-sm',
                    })
                  : null,
                hasPredictions
                  ? h(
                      'div',
                      {
                        onClick: (event: MouseEvent) => handleShowPredictions(button, event),
                        class:
                          'absolute bottom-1 right-1 px-1.5 py-0.5 text-xs font-semibold rounded bg-purple-600 text-white shadow-sm cursor-pointer hover:bg-purple-700 transition',
                        title: `Has ${predictions?.length} word form${
                          predictions && predictions.length > 1 ? 's' : ''
                        }`,
                      },
                      predictions?.length
                    )
                  : null,
                imageSrc || apiUrl
                  ? h('img', {
                      src: imageSrc || apiUrl,
                      alt: button.label,
                      class: 'max-h-12 object-contain',
                      onError: (e: Event) => {
                        const target = e.target as HTMLImageElement;
                        console.warn('Image failed to load:', button.label, 'src:', target.src);
                        target.style.display = 'none';
                      },
                    })
                  : null,
                h('div', { class: 'flex flex-col items-center justify-center' }, [
                  h(
                    'span',
                    {
                      class: 'text-xs sm:text-sm text-center font-medium leading-tight line-clamp-3',
                    },
                    button.label
                  ),
                  isPredictionCell && predictions && predictions.length > 0
                    ? h(
                        'div',
                        {
                          class:
                            'mt-1 text-[10px] sm:text-xs text-center opacity-80 space-y-0.5',
                        },
                        [
                          ...predictions.slice(0, 3).map((prediction: string, idx: number) =>
                            h('div', { key: `${button.id}-pred-${idx}` }, prediction)
                          ),
                          predictions.length > 3 ? h('div', '…') : null,
                        ]
                      )
                    : null,
                ]),
                button.message && button.message !== button.label && !isPredictionCell
                  ? h(
                      'span',
                      { class: 'text-[10px] sm:text-xs text-center opacity-75 line-clamp-2' },
                      button.message
                    )
                  : null,
              ]
            )
          );
        });
      });

      return cells;
    };

    return () => {
      if (!currentPage.value) {
        return h(
          'div',
          {
            class: `flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg ${
              props.className
            }`,
          },
          [
            h('div', { class: 'text-center' }, [
              h('p', { class: 'text-gray-600 dark:text-gray-400' }, 'No pages available'),
            ]),
          ]
        );
      }

      const toolbarPage = props.tree.toolbarId ? props.tree.pages[props.tree.toolbarId] : null;
      const gridRows = currentPage.value.grid.length;
      const gridCols = gridRows > 0 ? currentPage.value.grid[0].length : 0;

      return h('div', {
        class: `bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ${props.className}`,
      }, [
        props.showMessageBar
          ? h(
              'div',
              {
                class:
                  'p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50',
              },
              [
                h('div', { class: 'flex items-start justify-between gap-4' }, [
                  h('div', { class: 'flex-1 min-w-0' }, [
                    message.value
                      ? h('div', { class: 'space-y-2' }, [
                          h(
                            'p',
                            { class: 'text-lg text-gray-900 dark:text-white break-words' },
                            message.value
                          ),
                          h('div', { class: 'flex gap-4 text-sm' }, [
                            h(
                              'div',
                              { class: 'text-gray-600 dark:text-gray-400' },
                              `${currentWordCount.value} ${
                                currentWordCount.value === 1 ? 'word' : 'words'
                              }`
                            ),
                            props.buttonMetrics
                              ? [
                                  h(
                                    'div',
                                    { class: 'text-gray-600 dark:text-gray-400' },
                                    [
                                      'Effort: ',
                                      h(
                                        'span',
                                        { class: 'font-medium' },
                                        currentEffort.value.toFixed(2)
                                      ),
                                    ]
                                  ),
                                  h(
                                    'div',
                                    { class: 'text-gray-600 dark:text-gray-400' },
                                    [
                                      'Avg: ',
                                      h(
                                        'span',
                                        { class: 'font-medium' },
                                        currentWordCount.value > 0
                                          ? (currentEffort.value / currentWordCount.value).toFixed(2)
                                          : '0.00'
                                      ),
                                    ]
                                  ),
                                ]
                              : null,
                          ]),
                        ])
                      : h(
                          'p',
                          { class: 'text-gray-500 dark:text-gray-400 italic' },
                          'Tap buttons to build a sentence...'
                        ),
                  ]),
                  message.value
                    ? h(
                        'button',
                        {
                          onClick: clearMessage,
                          class:
                            'p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition',
                          'aria-label': 'Clear message',
                        },
                        [
                          h(
                            'svg',
                            {
                              class: 'h-5 w-5 text-gray-600 dark:text-gray-400',
                              fill: 'none',
                              stroke: 'currentColor',
                              viewBox: '0 0 24 24',
                            },
                            [
                              h('path', {
                                'stroke-linecap': 'round',
                                'stroke-linejoin': 'round',
                                'stroke-width': 2,
                                d: 'M6 18L18 6M6 6l12 12',
                              }),
                            ]
                          ),
                        ]
                      )
                    : null,
                ]),
              ]
            )
          : null,
        h('div', { class: 'flex' }, [
          renderToolbar(toolbarPage),
          h('div', { class: 'flex-1' }, [
            h('div', {
              class: 'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700',
            }, [
              h('div', { class: 'flex items-center gap-2' }, [
                pageHistory.value.length > 0
                  ? h(
                      'button',
                      {
                        onClick: handleBack,
                        class: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition',
                        'aria-label': 'Go back',
                      },
                      [
                        h(
                          'svg',
                          {
                            class: 'h-5 w-5 text-gray-600 dark:text-gray-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24',
                          },
                          [
                            h('path', {
                              'stroke-linecap': 'round',
                              'stroke-linejoin': 'round',
                              'stroke-width': 2,
                              d: 'M15 19l-7-7 7-7',
                            }),
                          ]
                        ),
                      ]
                    )
                  : null,
                h(
                  'h3',
                  { class: 'text-lg font-semibold text-gray-900 dark:text-white' },
                  currentPage.value.name
                ),
              ]),
              h(
                'div',
                { class: 'text-sm text-gray-500 dark:text-gray-400' },
                `${gridRows}×${gridCols} grid`
              ),
            ]),
            h(
              'div',
              {
                class: 'p-4 gap-2 overflow-auto max-h-[600px]',
                style: {
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                },
              },
              renderGridCells()
            ),
            Object.keys(props.tree.pages).length > 1
              ? h('div', { class: 'p-4 border-t border-gray-200 dark:border-gray-700' }, [
                  h(
                    'p',
                    { class: 'text-sm text-gray-600 dark:text-gray-400 mb-2' },
                    `${Object.keys(props.tree.pages).length} pages in this vocabulary`
                  ),
                ])
              : null,
          ]),
        ]),
        predictionsTooltip.value
          ? h(PredictionsTooltip, {
              predictions: predictionsTooltip.value.predictions,
              label: predictionsTooltip.value.label,
              position: predictionsTooltip.value.position,
              buttonMetricsLookup: predictionsTooltip.value.buttonMetricsLookup,
              onClose: predictionsTooltip.value.onClose,
              onWordClick: predictionsTooltip.value.onWordClick,
            })
          : null,
      ]);
    };
  },
});

export default BoardViewer;
