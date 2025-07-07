/**
 * Calculate the flex class for the entity pane based on collapsed states
 */
export const getEntityFlexClass = (
  chatPaneCollapsed: boolean,
  findingsPaneCollapsed: boolean
): string => {
  if (chatPaneCollapsed && findingsPaneCollapsed) return 'flex-[4]'; // Both collapsed
  if (chatPaneCollapsed || findingsPaneCollapsed) return 'flex-[2.5]'; // One collapsed
  return 'flex-[1.5]'; // None collapsed
};

/**
 * Common CSS classes for panes
 */
export const PANE_CLASSES = {
  base: 'hidden sm:block min-w-[280px] flex-1 overflow-hidden',
  chatBorder: 'border-r border-gray-200',
  findingsBorder: 'border-l border-gray-200',
  entityTransition: 'overflow-hidden transition-all duration-300',
} as const; 