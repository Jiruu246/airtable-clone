export interface TableRow {
  id: string;
  [columnId: string]: string | null;
}

export interface TableColumn {
  id: string;
  name: string;
  type: string;
  orderIndex: number;
}

export interface TableData {
  id: string;
  name: string;
  baseId: string;
  columns: TableColumn[];
  rows: TableRow[];
}

export interface PaginatedTableData {
  id: string;
  name: string;
  baseId: string;
  columns: TableColumn[];
  rows: TableRow[];
  totalRows: number;
  nextCursor?: string;
  hasNextPage: boolean;
}

export interface CellPosition {
  rowIndex: number;
  columnIndex: number;
}