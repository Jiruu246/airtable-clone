import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { BaseSidebar } from "~/app/_components/BaseSidebar";
import { BaseHeader } from "~/app/_components/BaseHeader";

interface BaseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BaseDetailPage({ params }: BaseDetailPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { id: baseId } = await params;

  const base = await api.base.getById({ id: baseId });

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Header */}
      <BaseSidebar user={session.user}/>

      <div className="flex-1">
        <BaseHeader baseName={base.name} />

        {/* Main Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {base.name}
              </h1>
              <p className="text-gray-600 mb-4">Base ID: {baseId}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}