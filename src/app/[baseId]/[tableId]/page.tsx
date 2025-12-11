"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface TablePageProps {
  params: Promise<{
    baseId: string;
    tableId: string;
  }>;
}

export default function TablePage({ params }: TablePageProps) {
  const router = useRouter();
  const { baseId, tableId } = use(params);

  const { data: currentTable } = api.table.getById.useQuery({ id: tableId });
  
  useEffect(() => {
    if (currentTable?.views?.[0]?.id) {
      router.replace(`/${baseId}/${tableId}/${currentTable.views[0].id}`);
    }
  }, [currentTable, baseId, tableId, router]);

  if (!currentTable) {
    return (
      <div className="bg-white p-12">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-3">
            Table not found
          </div>
          <div className="text-gray-400 text-base">
            The requested table could not be found.
          </div>
        </div>
      </div>
    );
  }

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
