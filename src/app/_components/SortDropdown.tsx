"use client";

import React, { useState, useEffect } from 'react';
import { SelectDropdown } from './SelectDropdown';
import type { TableColumn } from './types/DataTable.types';
import { ColumnTypes, type ColumnTypeValue } from '~/data/columnTypes';
import { OrderDirections, type OrderDirectionValue } from '~/data/orderingType';
import { api } from '~/trpc/react';
import { GoPlus } from 'react-icons/go';
import { IoCloseOutline } from "react-icons/io5";
import { DropdownBase } from './DropdownBase';
import { LuArrowUpDown } from "react-icons/lu";

interface SortCondition {
  columnId: string;
  direction: OrderDirectionValue;
}

const getDirectionOptionsForColumn = (columnType: ColumnTypeValue) => {
  switch (columnType) {
    case ColumnTypes.Text.value:
      return [
        { key: OrderDirections.Ascending.value, value: 'A → Z' },
        { key: OrderDirections.Descending.value, value: 'Z → A' },
      ];
    case ColumnTypes.Number.value:
      return [
        { key: OrderDirections.Ascending.value, value: '1 → 9' },
        { key: OrderDirections.Descending.value, value: '9 → 1' },
      ];
    default:
      return [
        { key: OrderDirections.Ascending.value, value: 'A → Z' },
        { key: OrderDirections.Descending.value, value: 'Z → A' },
      ];
  }
};

interface SortDropdownProps {
  columns: TableColumn[];
  viewId: string;
  searchString?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  columns,
  viewId,
  searchString,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<SortCondition[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const utils = api.useUtils();
  
  const { data: viewOrdering, refetch: refetchOrdering } = api.view.getViewOrdering.useQuery(
    { viewId: viewId },
    { enabled: !!viewId && isOpen }
  );

  const addConditionMutation = api.view.addViewOrderingCondition.useMutation({
    onSuccess: () => {
      void refetchOrdering();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  const removeConditionMutation = api.view.removeViewOrderingCondition.useMutation({
    onSuccess: () => {
      void refetchOrdering();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  const updateConditionMutation = api.view.updateViewOrderingCondition.useMutation({
    onSuccess: () => {
      void refetchOrdering();
      void utils.view.getViewRowsPaginated.reset({viewId, limit: 80, searchString});
    },
  });

  useEffect(() => {
    if (isOpen && viewId && viewOrdering && !isLoaded) {
      if (viewOrdering.conditions) {
        setConditions(
          viewOrdering.conditions.map(condition => ({
            columnId: condition.column_id,
            direction: condition.direction,
          }))
        );
      }
      setIsLoaded(true);
    }

    if (!isOpen) {
      setIsLoaded(false);
    }
  }, [isOpen, viewId, viewOrdering, isLoaded]);



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

  const updateCondition = async (index: number, field: keyof SortCondition, value: string) => {
    if (!viewId) return;

    const oldCondition = conditions[index];
    let updatedCondition = { ...oldCondition!, [field]: value };

    if (field === 'columnId') {
      // Reset direction to default when column changes
      updatedCondition = {
        ...updatedCondition,
        direction: OrderDirections.Ascending.value,
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
          direction: updatedCondition.direction,
        },
      });
    } catch (error) {
      setConditions(prev => prev.map((c, i) =>
        i === index ? oldCondition! : c
      ));
      console.error('Failed to update condition:', error);
    }
  };

  const columnOptions = columns.map(col => ({
    key: col.id,
    value: col.name,
  }));

  const availableColumns = columns.filter(col =>
    !conditions.some(condition => condition.columnId === col.id)
  );

  const availableColumnOptions = availableColumns.map(col => ({
    key: col.id,
    value: col.name,
  }));

  const addConditionWithColumn = async (columnId: string) => {
    if (!viewId) return;

    const defaultDirection = OrderDirections.Ascending.value;

    const newCondition: SortCondition = {
      columnId,
      direction: defaultDirection,
    };

    // Optimistic update
    setConditions(prev => [...prev, newCondition]);

    try {
      await addConditionMutation.mutateAsync({
        viewId,
        condition: {
          column_id: newCondition.columnId,
          direction: newCondition.direction,
        },
      });
    } catch (error) {
      // Revert on error
      setConditions(prev => prev.slice(0, -1));
      console.error('Failed to add condition:', error);
    }
  };

  return (
    <div className="relative">
      <button
        className={`flex items-center gap-2 text-gray-600 px-2 py-1.5 rounded text-xs font-light
          ${viewOrdering?.conditions?.length ? 'bg-orange-200' : 'hover:bg-gray-100'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <LuArrowUpDown className="w-4 h-4" />
        <span>Sort</span>
      </button>
      <DropdownBase
        isOpen={isOpen}
        positionClasses="top-full mt-1 right-[-80px]"
        width="w-120"
        onClose={() => setIsOpen(false)}
      >
        <div className="text-sm font-normal text-gray-500 px-4 pt-4">
          Sort by
        </div>
        <div className="p-2">
          {conditions.length > 0 && (
            <>
              {conditions.map((condition, index) => {
                const column = columns.find(col => col.id === condition.columnId);
                const directionOptions = getDirectionOptionsForColumn(column?.columnType ?? ColumnTypes.Text.value);

                return (
                  <div key={index} className="rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      {/* Column Selector */}
                      <SelectDropdown
                        options={columnOptions}
                        condition={(key) => !(conditions.some(c => c.columnId === key) || key === condition.columnId)}
                        PreSelectedKey={condition.columnId}
                        onSelectItem={(columnId) => updateCondition(index, 'columnId', columnId)}
                        placeholder="Select field"
                        className="flex-1 min-w-0"
                        controlClassName="px-3 py-2 border rounded-md"
                      />
                      {/* Direction Selector */}
                      <SelectDropdown
                        options={directionOptions}
                        PreSelectedKey={condition.direction}
                        onSelectItem={(direction) => updateCondition(index, 'direction', direction as OrderDirectionValue)}
                        placeholder="Select direction"
                        className="flex-1 min-w-0"
                        controlClassName="px-3 py-2 border rounded-md"
                      />
                      {/* Remove Button */}
                      <button
                        onClick={() => removeCondition(index)}
                        className="p-2 hover:bg-gray-100 border-gray-200 hover:cursor-pointer rounded-md"
                      >
                        <IoCloseOutline className="w-4 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {availableColumns.length > 0 && (
            <div className="flex justify-between w-full pt-2">
              <div className="flex gap-4 w-full">
                <SelectDropdown
                  options={availableColumnOptions}
                  onSelectItem={addConditionWithColumn}
                  placeholder="Add another sort..."
                  trigger={
                    <div className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer p-2">
                      <GoPlus className="w-4 h-4" />
                      <span className="text-sm">
                        Add another sort
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </DropdownBase>
    </div>
  );
};