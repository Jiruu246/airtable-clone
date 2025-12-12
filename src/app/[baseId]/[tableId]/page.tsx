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

  return null;
}
