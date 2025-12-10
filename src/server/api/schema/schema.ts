import z from "zod";
import { ColumnTypes, type ColumnTypeValue } from "~/data/columnTypes";
import { FilterOperators, type FilterOperatorValue } from "~/data/filterOperators";
import { LogicalOperators, type LogicalOperatorValue } from "~/data/logicalOperators";
import { OrderDirections, type OrderDirectionValue } from "~/data/orderingType";

export const ColumnTypeZodEnum = z.enum(
    Object.values(ColumnTypes).map(ct => ct.value) as [ColumnTypeValue, ...ColumnTypeValue[]]
);

export const FilterOperatorZodEnum = z.enum(
    Object.values(FilterOperators).map((fo) => fo.value) as [FilterOperatorValue, ...FilterOperatorValue[]]
);

export const LogicalOperatorZodEnum = z.enum(
    Object.values(LogicalOperators).map((lo) => lo.value) as [LogicalOperatorValue, ...LogicalOperatorValue[]]
);

export const OrderingTypeZodEnum = z.enum(
    Object.values(OrderDirections).map((ot) => ot.value) as [OrderDirectionValue, ...OrderDirectionValue[]]
);