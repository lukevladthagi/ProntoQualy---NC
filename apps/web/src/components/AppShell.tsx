"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/lib/router-shim";
import Layout from "@/components/Layout";

const publicPrefixes = ["/account"];
const publicPaths = ["/notificar"];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublic =
    publicPaths.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    return <>{children}</>;
  }

  return <Layout>{children}</Layout>;
}
