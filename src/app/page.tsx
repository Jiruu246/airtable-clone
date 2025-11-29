import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Header } from "./_components/Header";
import { Sidebar } from "./_components/Sidebar";
import { BasesList } from "./_components/BasesList";
import { QuickActions } from "./_components/QuickActions";

import { IoChevronDown } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { RxTable } from "react-icons/rx";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const bases = await api.base.list();

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <Header user={session.user} />

        <div className="pt-16">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main>
            <div className="p-8 max-w-[1920px] ml-72">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Home</h1>

              <div className="mb-8">
                <QuickActions />
              </div>

              {/* Recent Bases */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2 items-center text-gray-600 hover:text-gray-900 cursor-pointer">
                    <h2 className="text-md font-light">Opened anytime</h2>
                    <IoChevronDown className="w-4 h-4" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <RxHamburgerMenu className="w-4 h-4 text-gray-700 cursor-pointer" />
                    <div className="p-2 rounded-full bg-gray-200 cursor-pointer">
                      <RxTable className="w-4 h-4 text-gray-700 " />
                    </div>
                  </div>
                </div>

                <BasesList initialBases={bases} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </HydrateClient>
  );
}
