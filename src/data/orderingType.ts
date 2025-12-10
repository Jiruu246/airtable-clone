export const OrderDirections = {
    Ascending: { value: 'ASC', name: 'Ascending'},
    Descending: { value: 'DESC', name: 'Descending'},
} as const;

export type OrderDirectionValue = typeof OrderDirections[keyof typeof OrderDirections]['value'];

export const OrderDirectionList = Object.values(OrderDirections);