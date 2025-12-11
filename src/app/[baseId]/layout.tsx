"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { use } from "react";
import { api } from "~/trpc/react";
import { BaseSidebar } from "~/app/_components/BaseSidebar";
import { BaseHeader } from "~/app/_components/BaseHeader";

interface BaseLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    baseId: string;
  }>;
}

export default function BaseLayout({ children, params }: BaseLayoutProps) {
  const { data: session } = useSession();

  if (!session) {
    redirect("/login");
  }

  const baseId = use(params).baseId;
  const { data: base } = api.base.getById.useQuery({ id: baseId });

  return (
    <div className="h-screen bg-gray-100 grid grid-cols-[auto_1fr]">
      <BaseSidebar user={session.user} />
      
      <div className="grid grid-rows-[auto_1fr] overflow-hidden">
        <BaseHeader baseName={base?.name ?? "Loading..."} />
        {children}
      </div>
    </div>
  );
}
