export const LogicalOperators = {
    AND: { value: 'AND', description: 'All conditions must be met' },
    OR: { value: 'OR', description: 'At least one condition must be met' },
} as const;

export type LogicalOperatorValue = typeof LogicalOperators[keyof typeof LogicalOperators]['value'];