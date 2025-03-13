import { Header } from "@/components/Header";
import { ToasterProvider } from "@/components/ToasterProvider";
import { BackgroundParticles } from "@/components/BackgroundParticles";
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
    <div className="flex min-h-screen flex-col bg-zinc-950 relative overflow-hidden">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0 mix-blend-overlay bg-noise"></div>
      
      {/* Background gradient effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-conic from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-slow-spin"></div>
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-3xl"></div>
      </div>

      {/* Floating particles */}
      <BackgroundParticles />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <Header />
      </div>
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="backdrop-blur-3xl bg-white/[0.02] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/[0.05] relative overflow-hidden">
          {/* Card inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
          
          {/* Content */}
          <div className="relative z-10 space-y-6">
            {children}
          </div>
        </div>
      </main>
      
      <ToasterProvider />
    </div>
  );
} 