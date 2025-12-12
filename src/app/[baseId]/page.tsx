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

  return null;
}