"use client";

import nextDynamic from "next/dynamic";

type RouteComponentProps = Record<string, never>;

const Tratativas = nextDynamic<RouteComponentProps>(
  () => import("@/views/Tratativas").then((mod) => mod.default),
  { ssr: false },
);

export default function TratativasClientPage() {
  return <Tratativas />;
}
