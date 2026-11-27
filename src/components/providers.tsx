"use client";

import { PwaRegister } from "@/components/pwa-install";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister />
      {children}
    </>
  );
}
