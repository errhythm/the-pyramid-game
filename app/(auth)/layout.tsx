import { Header } from "@/components/Header";
import { ToasterProvider } from "@/components/ToasterProvider";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Header />
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 w-full">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <div className="p-6 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
      
      <ToasterProvider />
    </div>
  );
} 