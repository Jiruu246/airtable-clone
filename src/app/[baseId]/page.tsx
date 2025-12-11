"use client";

import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
import { use, useEffect } from "react";

interface BaseDetailPageProps {
  params: Promise<{
    baseId: string;
  }>;
}

export default function BaseDetailPage({ params }: BaseDetailPageProps) {
  const baseId = use(params).baseId;
  const { data: tables, isLoading } = api.table.getByBaseId.useQuery({ baseId });

  useEffect(() => {
    if (!isLoading && tables && tables.length > 0) {
      redirect(`/${baseId}/${tables[0]!.id}`);
    }
  }, [baseId, tables, isLoading]);

  if (isLoading) {
    return (
      <div className="bg-white p-12">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-3">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="bg-white p-12">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-3">
            No tables found from base page
          </div>
          <div className="text-gray-400 text-base">
            This base does not have any tables yet. Create your first table to get started.
          </div>
        </div>
      </div>
    );
  }

  return null;
}