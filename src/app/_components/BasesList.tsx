"use client";

import { api } from "~/trpc/react";
import { BaseCard } from "./BaseCard";

interface Base {
  id: string;
  name: string;
  userId: string;
}

interface BasesListProps {
  initialBases: Base[];
}

export function BasesList({ initialBases }: BasesListProps) {
  const { data: bases = initialBases } = api.base.list.useQuery(undefined, {
    initialData: initialBases,
  });

  const utils = api.useUtils();

  const handleDeleteBase = (deletedId: string) => {
    utils.base.list.setData(undefined, (oldData) => 
      oldData ? oldData.filter(base => base.id !== deletedId) : []
    );
  };

  if (bases.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No bases found. Create your first base to get started.
      </div>
    );
  }

  return (
    <div 
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
      {bases.map((base) => (
        <BaseCard
          key={base.id}
          id={base.id}
          name={base.name}
          onDelete={handleDeleteBase}
        />
      ))}
    </div>
  );
}