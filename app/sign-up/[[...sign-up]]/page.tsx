import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { dark } from '@clerk/themes'
import { Triangle } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="relative w-full max-w-md overflow-hidden border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl">
        {/* Card inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/5 via-transparent to-zinc-700/5" />
        
        {/* Logo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800/50 shadow-xl">
            <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900" />
            <div className="absolute inset-0 flex items-center justify-center">
            <Triangle className="w-6 h-6 text-zinc-200" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <CardHeader className="pt-8 pb-0 text-center space-y-0">
          <CardTitle className="text-lg font-bold bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent">Create Your Account</CardTitle>
        </CardHeader>
        <Separator className="my-2 bg-zinc-800/50" />
        <CardContent className="p-4">
          <div className="flex justify-center [&_.cl-card]:shadow-none [&_.cl-card]:border-0 [&_.cl-card]:p-0 [&_.cl-internal-b3fm6y]:hidden">
            <SignUp appearance={{
                baseTheme: dark,
                variables: {
                  colorBackground: "#18181b",
                  colorInputBackground: "#18181b",
                  colorInputText: "#ffffff",
                  colorText: "#ffffff",
                  colorTextSecondary: "#a1a1aa",
                  colorPrimary: "#3f3f46",
                  colorTextOnPrimaryBackground: "#ffffff",
                  borderRadius: "0.5rem",
                },
                elements: {
                  formButtonPrimary: "bg-zinc-800 hover:bg-zinc-700 transition-colors",
                  card: "bg-transparent",
                  headerTitle: "text-lg font-bold bg-gradient-to-br from-zinc-200 to-zinc-400 bg-clip-text text-transparent",
                  headerSubtitle: "text-zinc-400",
                  socialButtonsBlockButton: "bg-zinc-800 hover:bg-zinc-700 transition-colors border-zinc-700",
                  socialButtonsBlockButtonText: "text-zinc-200",
                  dividerLine: "bg-zinc-800",
                  dividerText: "text-zinc-400",
                  formFieldLabel: "text-zinc-400",
                  formFieldInput: "bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 focus:ring-zinc-600",
                  footerActionLink: "text-zinc-400 hover:text-zinc-200",
                  identityPreviewText: "text-zinc-200",
                  identityPreviewEditButton: "text-zinc-400 hover:text-zinc-200",
                }
              }}
              />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 