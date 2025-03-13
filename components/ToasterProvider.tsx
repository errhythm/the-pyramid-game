"use client";

import { Toaster } from "@/components/ui/sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      className="dark:bg-zinc-950 dark:text-zinc-50"
      toastOptions={{
        classNames: {
          toast: "dark:bg-zinc-900 dark:border-zinc-800",
          title: "dark:text-zinc-50",
          description: "dark:text-zinc-400",
          actionButton: "dark:bg-zinc-800 dark:text-zinc-50",
          cancelButton: "dark:bg-zinc-800 dark:text-zinc-50",
          closeButton: "dark:bg-zinc-800 dark:text-zinc-50",
        }
      }}
    />
  );
} 