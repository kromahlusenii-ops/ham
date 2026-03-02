import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SWRProvider from "@/components/SWRProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-snow">
      <DashboardHeader user={user} />
      <main className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <SWRProvider>{children}</SWRProvider>
      </main>
    </div>
  );
}
