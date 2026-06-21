"use client";

import type { ComponentType } from "react";
import nextDynamic from "next/dynamic";


type RouteComponentProps = Record<string, unknown>;
type RouteComponent = ComponentType<RouteComponentProps>;

const NCFormPage = nextDynamic<RouteComponentProps>(
  () =>
    import("@/views/NCForm").then(
      (mod) => mod.default as unknown as RouteComponent
    ),
  {
    ssr: false,
  }
);

export default function ClientPage() {
  return <NCFormPage />;
}
