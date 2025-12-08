export const FilterOperators = {
    Contains: { value: 'contains', label: 'contains' },
    NotContains: { value: 'not_contains', label: 'does not contain' },
    Is: { value: 'is' , label: 'is' },
    IsNot: { value: 'is_not', label: 'is not' },
    IsEmpty: { value: 'is_empty', label: 'is empty' },
    IsNotEmpty: { value: 'is_not_empty', label: 'is not empty' },
    Equal: { value: 'eq', label: '=' },
    NotEqual: { value: 'neq', label: '!=' },
    GreaterThan: { value: 'gt', label: '>' },
    LessThan: { value: 'lt', label: '<' },
    GreaterThanEqual: { value: 'gte', label: '>=' },
    LessThanEqual: { value: 'lte', label: '<=' },
} as const;

export type FilterOperatorValue = typeof FilterOperators[keyof typeof FilterOperators]['value'];

export const FilterOperatorByValue = Object.fromEntries(
    Object.values(FilterOperators).map((op) => [op.value, op])
) as Record<FilterOperatorValue, (typeof FilterOperators)[keyof typeof FilterOperators]>;

export function getFilterOperatorByValue(value: FilterOperatorValue) {
    return FilterOperatorByValue[value];
}

export const TextFilterOperators = [
    FilterOperators.Contains,
    FilterOperators.NotContains,
    FilterOperators.Is,
    FilterOperators.IsNot,
    FilterOperators.IsEmpty,
    FilterOperators.IsNotEmpty,
] as const;

export const NumberFilterOperators = [
    FilterOperators.Equal,
    FilterOperators.NotEqual,
    FilterOperators.GreaterThan,
    FilterOperators.LessThan,
    FilterOperators.GreaterThanEqual,
    FilterOperators.LessThanEqual,
    FilterOperators.IsEmpty,
    FilterOperators.IsNotEmpty,
] as const;