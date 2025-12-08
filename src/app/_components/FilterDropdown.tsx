"use client";

import React, { useState, useEffect } from 'react';
import { Dropdown } from './Dropdown';
import { IoClose } from "react-icons/io5";
import { GoPlus } from "react-icons/go";
import { SelectDropdown } from './SelectDropdown';
import { DebounceInput } from './DebounceInput';
import type { TableColumn } from './types/DataTable.types';
import { ColumnTypes, type ColumnTypeValue } from '~/data/columnTypes';
import { FilterOperators, NumberFilterOperators, TextFilterOperators, type FilterOperatorValue } from '~/data/filterOperators';
import { LogicalOperators, type LogicalOperatorValue } from '~/data/logicalOperators';
import { api } from '~/trpc/react';

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
  value: op.value,
}));

const operatorsNotRequiringValue: FilterOperatorValue[] = [
  FilterOperators.IsEmpty.value,
  FilterOperators.IsNotEmpty.value,
];

interface FilterDropdownProps {
  isOpen: boolean;
  columns: TableColumn[];
  viewId?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  columns,
  viewId,
}) => {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [logicalOperator, setLogicalOperator] = useState<LogicalOperatorValue>(LogicalOperators.AND.value);
  const [isLoaded, setIsLoaded] = useState(false);

  // API hooks
  const utils = api.useUtils();
  const { data: viewFilters, refetch: refetchFilters } = api.view.getViewFilters.useQuery(
    { viewId: viewId! },
    { enabled: !!viewId && isOpen }
  );
  
  const addConditionMutation = api.view.addViewFilterCondition.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.invalidate();
    },
  });
  
  const removeConditionMutation = api.view.removeViewFilterCondition.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.invalidate();
    },
  });
  
  const updateConditionMutation = api.view.updateViewFilterCondition.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.invalidate();
    },
  });
  
  const updateOperatorMutation = api.view.updateViewFilterOperator.useMutation({
    onSuccess: () => {
      void refetchFilters();
      void utils.view.getViewRowsPaginated.invalidate();
    },
  });

  // Load filters when dropdown opens
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
    
    // Reset when dropdown closes
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
    
    // Optimistic update
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
      // Revert on error
      setConditions(prev => prev.map((c, i) =>
        i === index ? oldCondition! : c
      ));
      console.error('Failed to update condition:', error);
    }
  };

  const updateLogicalOperator = async (newOperator: LogicalOperatorValue) => {
    if (!viewId) return;
    
    const oldOperator = logicalOperator;
    
    // Optimistic update
    setLogicalOperator(newOperator);
    
    try {
      await updateOperatorMutation.mutateAsync({
        viewId,
        operator: newOperator,
      });
    } catch (error) {
      // Revert on error
      setLogicalOperator(oldOperator);
      console.error('Failed to update logical operator:', error);
    }
  };

  // Convert columns to SelectDropdown options
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
    <Dropdown
      isOpen={isOpen}
      positionClasses="top-full mt-1 right-[-80px]"
      width="w-124"
    >
      <div className="text-sm font-normal text-gray-500 px-4 pt-4">
        In this view, show records
      </div>
      <div className="p-2 space-y-2">
        {conditions.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500 mb-3">
              No conditions added
            </div>
            <button
              onClick={addCondition}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm font-medium mx-auto"
            >
              <GoPlus className="w-4 h-4" />
              Add condition
            </button>
          </div>
        ) : (
          <>
            {conditions.map((condition, index) => (
              <div key={index} className="rounded-lg p-2 space-y-2">
                <div className="flex items-center">
                  {index === 0 ? (
                    <div className="text-xs text-gray-500 mb-2">Where</div>
                  ) : index === 1 ? (
                    <div className="mb-2 min-w-[70px]">
                      <SelectDropdown
                        options={logicalOperatorOptions}
                        PreSelectedKey={logicalOperator}
                        onSelectItem={(operator) => updateLogicalOperator(operator as LogicalOperatorValue)}
                        className="w-full"
                        controlClassName="px-3 py-1 text-xs border"
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mb-2 min-w-[70px]">{logicalOperator}</div>
                  )}
                  {/* Column Selector */}
                  <SelectDropdown
                    options={columnOptions}
                    PreSelectedKey={condition.columnId}
                    onSelectItem={(columnId) => updateCondition(index, 'columnId', columnId)}
                    placeholder="Select field"
                    className="flex-1"
                    controlClassName="px-3 py-2 border"
                  />

                  {/* Operator Selector */}
                  <SelectDropdown
                    options={getOperatorsForColumn(columns.find(col => col.id === condition.columnId)?.columnType ?? ColumnTypes.Text.value)}
                    PreSelectedKey={condition.operator}
                    onSelectItem={(operator) => updateCondition(index, 'operator', operator as FilterOperatorValue)}
                    placeholder="Select operator"
                    className="flex-1"
                    controlClassName="px-3 py-2 border-y"
                  />

                  {/* Value Input */}
                  <div className="flex-1">
                    <DebounceInput
                      type="text"
                      value={condition.value}
                      onChange={(value) => updateCondition(index, 'value', value)}
                      placeholder="Enter value"
                      disabled={operatorsNotRequiringValue.includes(condition.operator)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                      delay={300}
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeCondition(index)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <IoClose className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <button
                onClick={addCondition}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm font-medium"
              >
                <GoPlus className="w-4 h-4" />
                Add condition
              </button>
            </div>
          </>
        )}
      </div>
    </Dropdown>
  );
};