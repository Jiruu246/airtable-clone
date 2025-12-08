export const ColumnTypes = {
    Text: { value: 'TXT', name: 'Text', longName: 'Single line text', description: 'Short text values' },
    Number: { value: 'NUM', name: 'Number', longName: 'Number', description: 'Numeric values' },
} as const;

export type ColumnTypeValue = typeof ColumnTypes[keyof typeof ColumnTypes]['value'];

export const ColumnTypeList = Object.values(ColumnTypes);