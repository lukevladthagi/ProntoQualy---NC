"use client";

import type { ComponentType } from "react";
import nextDynamic from "next/dynamic";

type RouteComponentProps = Record<string, unknown>;
type RouteComponent = ComponentType<RouteComponentProps>;

const Notificacoes = nextDynamic<RouteComponentProps>(
  () =>
    import("@/views/Notificacoes").then(
      (mod) => mod.default as unknown as RouteComponent,
    ),
  { ssr: false },
);

export default function NotificacoesClientPage() {
  return <Notificacoes />;
}
