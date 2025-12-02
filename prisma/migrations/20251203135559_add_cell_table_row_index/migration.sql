-- DropIndex
DROP INDEX "idx_cells_table_col_row";

-- CreateIndex
CREATE INDEX "idx_cells_table_col" ON "Cell"("table_id", "column_id");

-- CreateIndex
CREATE INDEX "idx_cells_table_row" ON "Cell"("table_id", "row_id");
