"use client";

import React, { useState, useEffect } from 'react';
import { PiTrash } from "react-icons/pi";
import { GoPlus } from "react-icons/go";
import { SelectDropdown } from './SelectDropdown';
import { DebounceInput } from './DebounceInput';
import type { TableColumn } from './types/DataTable.types';
import { ColumnTypes, type ColumnTypeValue } from '~/data/columnTypes';
import { FilterOperators, NumberFilterOperators, TextFilterOperators, type FilterOperatorValue } from '~/data/filterOperators';
import { LogicalOperators, type LogicalOperatorValue } from '~/data/logicalOperators';
import { api } from '~/trpc/react';
import { DropdownBase } from './DropdownBase';
import { IoFilterOutline } from "react-icons/io5";
import { GoGrabber } from "react-icons/go";

interface FilterCondition {
  columnId: string;
  operator: FilterOperatorValue;
  value: string;
}

const TextFilterOptions = TextFilterOperators.map(op => ({
  key: op.value,
  value: op.label,
}));

const NumberFilterOptions = NumberFilterOperators.map(op => ({
  key: op.value,
  value: op.label,
}));

const logicalOperatorOptions = Object.values(LogicalOperators).map(op => ({
  key: op.value,
  value: op.value.toLowerCase(),
}));

const operatorsNotRequiringValue: FilterOperatorValue[] = [
  FilterOperators.IsEmpty.value,
  FilterOperators.IsNotEmpty.value,
];

interface FilterDropdownProps {
  columns: TableColumn[];
  viewId: string;
  searchString?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  columns,
  viewId,
  searchString,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperatorValue>(LogicalOperators.AND.value);
  const [isLoaded, setIsLoaded] = useState(false);

  const utils = api.useUtils();
  const { data: viewFilters, refetch: refetchFilters } = api.view.getViewFilters.useQuery(
    { viewId: viewId },
    { enabled: !!viewId && isOpen }
  );

  const addConditionMutation = api.view.addViewFilterCondition.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  const removeConditionMutation = api.view.removeViewFilterCondition.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  const updateConditionMutation = api.view.updateViewFilterCondition.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  const updateOperatorMutation = api.view.updateViewFilterOperator.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  useEffect(() => {
    if (isOpen && viewId && viewFilters && !isLoaded) {
      if (viewFilters.conditions) {
        setConditions(
          viewFilters.conditions.map(condition => ({
            columnId: condition.column_id,
            operator: condition.operator,
            value: condition.value ?? '',
          }))
        );
      }
      setLogicalOperator(viewFilters.operator ?? LogicalOperators.AND.value);
      setIsLoaded(true);
    }

    if (!isOpen) {
      setIsLoaded(false);
    }
  }, [isOpen, viewId, viewFilters, isLoaded]);

  const addCondition = async () => {
    if (!viewId) return;

    const defaultColumn = columns[0] ?? { id: '', columnType: ColumnTypes.Text.value };
    const defaultOperator = getOperatorsForColumn(defaultColumn.columnType)[0]?.key ?? TextFilterOperators[0].value;

    const newCondition: FilterCondition = {
      columnId: defaultColumn.id,
      operator: defaultOperator,
      value: '',
    };

    // Optimistic update
    setConditions(prev => [...prev, newCondition]);

    try {
      await addConditionMutation.mutateAsync({
        viewId,
        condition: {
          column_id: newCondition.columnId,
          operator: newCondition.operator,
          value: newCondition.value || null,
        },
        operator: logicalOperator,
      });
    } catch (error) {
      // Revert on error
      setConditions(prev => prev.slice(0, -1));
      console.error('Failed to add condition:', error);
    }
  };

  const removeCondition = async (index: number) => {
    if (!viewId) return;

    const removedCondition = conditions[index];

    // Optimistic update
    setConditions(prev => prev.filter((_, i) => i !== index));

    try {
      await removeConditionMutation.mutateAsync({
        viewId,
        conditionIndex: index,
      });
    } catch (error) {
      // Revert on error
      setConditions(prev => [
        ...prev.slice(0, index),
        removedCondition!,
        ...prev.slice(index),
      ]);
      console.error('Failed to remove condition:', error);
    }
  };

  const updateCondition = async (index: number, field: keyof FilterCondition, value: string) => {
    if (!viewId) return;

    const oldCondition = conditions[index];
    let updatedCondition = { ...oldCondition!, [field]: value };

    if (field === 'columnId') {
      const newColumn = columns.find(col => col.id === value);
      const columnType = newColumn?.columnType ?? ColumnTypes.Text.value;
      const defaultOperator = getOperatorsForColumn(columnType)[0]?.key ?? TextFilterOperators[0].value;

      updatedCondition = {
        ...updatedCondition,
        operator: defaultOperator,
        value: '',
      };
    }

    setConditions(prev => prev.map((c, i) =>
      i === index ? updatedCondition : c
    ));

    try {
      await updateConditionMutation.mutateAsync({
        viewId,
        conditionIndex: index,
        condition: {
          column_id: updatedCondition.columnId,
          operator: updatedCondition.operator,
          value: updatedCondition.value || null,
        },
      });
    } catch (error) {
      setConditions(prev => prev.map((c, i) =>
        i === index ? oldCondition! : c
      ));
      console.error('Failed to update condition:', error);
    }
  };

  const updateLogicalOperator = async (newOperator: LogicalOperatorValue) => {
    if (!viewId) return;

    const oldOperator = logicalOperator;

    setLogicalOperator(newOperator);

    try {
      await updateOperatorMutation.mutateAsync({
        viewId,
        operator: newOperator,
      });
    } catch (error) {
      setLogicalOperator(oldOperator);
      console.error('Failed to update logical operator:', error);
    }
  };

  const columnOptions = columns.map(col => ({
    key: col.id,
    value: col.name,
  }));

  const getOperatorsForColumn = (columnType: ColumnTypeValue) => {
    switch (columnType) {
      case ColumnTypes.Text.value:
        return TextFilterOptions;
      case ColumnTypes.Number.value:
        return NumberFilterOptions;
      default:
        return TextFilterOptions;
    }
  }

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-2 text-gray-600 px-2 py-1.5 rounded text-xs font-light
                  ${viewFilters?.conditions?.length ? 'bg-green-200' : 'hover:bg-gray-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <IoFilterOutline className="w-4 h-4" />
        <span>Filter</span>
      </button>
      <DropdownBase
        isOpen={isOpen}
        positionClasses="top-full mt-1 right-[-80px]"
        width="w-140"
        onClose={() => setIsOpen(false)}
      >
        <div className="text-xs font-normal text-gray-500 px-2 pt-2">
          {conditions.length === 0 ? 'No filter conditions are applied' : 'In this view, show records'}
        </div>
        <div>
          {conditions.length > 0 && (
            <>
              {conditions.map((condition, index) => (
                <div key={index} className="rounded-lg p-2">
                  <div className="flex items-center">
                    <div className="text-xs text-gray-600 mr-2 w-20">
                      {index === 0 ? (
                        <div className="p-3">Where</div>
                      ) : index === 1 ? (
                        <div>
                          <SelectDropdown
                            options={logicalOperatorOptions}
                            PreSelectedKey={logicalOperator}
                            onSelectItem={(operator) => updateLogicalOperator(operator as LogicalOperatorValue)}
                            className="w-full"
                            controlClassName="px-3 py-2 border"
                          />
                        </div>
                      ) : (
                        <div className="px-3 py-2">{logicalOperator.toLocaleLowerCase()}</div>
                      )}
                    </div>
                    {/* Column Selector */}
                    <SelectDropdown
                      options={columnOptions}
                      PreSelectedKey={condition.columnId}
                      onSelectItem={(columnId) => updateCondition(index, 'columnId', columnId)}
                      placeholder="Select field"
                      className="flex-1 min-w-0"
                      controlClassName="px-3 py-2 border"
                    />
                    {/* Operator Selector */}
                    <SelectDropdown
                      options={getOperatorsForColumn(columns.find(col => col.id === condition.columnId)?.columnType ?? ColumnTypes.Text.value)}
                      PreSelectedKey={condition.operator}
                      onSelectItem={(operator) => updateCondition(index, 'operator', operator as FilterOperatorValue)}
                      placeholder="Select operator"
                      className="flex-1 min-w-0"
                      controlClassName="px-3 py-2 border-y"
                    />
                    {/* Value Input */}
                    <div className="flex-1 min-w-0">
                      <DebounceInput
                        type="text"
                        value={condition.value}
                        onChange={(value) => updateCondition(index, 'value', value)}
                        placeholder="Enter value"
                        disabled={operatorsNotRequiringValue.includes(condition.operator)}
                        className="w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                        delay={300}
                      />
                    </div>
                    {/* Remove Button */}
                    <button
                      onClick={() => removeCondition(index)}
                      className="p-2 hover:bg-gray-100 border-y border-r border-gray-200 hover:cursor-pointer"
                    >
                      <PiTrash className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 border-y border-r border-gray-200 hover:cursor-pointer"
                    >
                      <GoGrabber className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          <div className="flex justify-between w-full pt-2 text-gray-500 hover:text-gray-600 text-xs font-medium">
            <div className="flex gap-4">
              <button
                onClick={addCondition}
                className="flex items-center gap-1 p-2 hover:cursor-pointer"
              >
                <GoPlus className="w-4 h-4" />
                Add condition
              </button>
              <button
                className="flex items-center gap-1 p-2 hover:cursor-pointer"
              >
                <GoPlus className="w-4 h-4" />
                Add condition group
              </button>
            </div>
            <button
              className="flex items-center gap-1 p-2 hover:cursor-pointer"
            >
              Copy from another view
            </button>
          </div>
        </div>
      </DropdownBase>
    </div>
  );
};