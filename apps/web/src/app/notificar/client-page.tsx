"use client";

import nextDynamic from "next/dynamic";

type RouteComponentProps = Record<string, never>;

const PublicNotification = nextDynamic<RouteComponentProps>(
  () => import("@/views/PublicNotification").then((mod) => mod.default),
  { ssr: false },
);

export default function PublicNotificationClientPage() {
  return <PublicNotification />;
}
