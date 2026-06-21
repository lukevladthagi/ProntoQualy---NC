"use client";

import type { ComponentType } from "react";
import nextDynamic from "next/dynamic";


type RouteComponentProps = Record<string, unknown>;
type RouteComponent = ComponentType<RouteComponentProps>;

const NCListPage = nextDynamic<RouteComponentProps>(
  () =>
    import("@/views/NCList").then(
      (mod) => mod.default as unknown as RouteComponent
    ),
  {
    ssr: false,
  }
);

export default function ClientPage() {
  return <NCListPage />;
}
