"use client";

import type { ReactNode } from "react";
import { ClipboardPlus } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function AuthShell({
  children,
  eyebrow = "Não conformidades",
  title = "Identificar, analisar, tratar, prevenir e evoluir.",
  description = "O painel interno é destinado à equipe da Qualidade, NSP e gestores responsáveis por análise de causa, plano de ação e verificação de eficácia.",
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(31,91,147,0.14),_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_48%,#ffffff_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
          <img
            src="/brand/prontoqualy-logo.png"
            alt="ProntoQualy"
            className="h-auto w-full max-w-[420px] object-contain"
          />

          <div className="my-12 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-[#001f53] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
              Registro rastreável
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
              Tratativa por etapa
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-4">
              Verificação de eficácia
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center border-t border-slate-200 bg-white/82 px-6 py-10 backdrop-blur lg:border-l lg:border-t-0">
          <div className="w-full max-w-[430px]">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function PublicNotificationCallout() {
  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <ClipboardPlus className="mt-0.5 h-5 w-5 text-[#1f5b93]" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Vai apenas registrar uma ocorrência?
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Abra o formulário público de notificação. O tratamento fica restrito
            ao painel interno.
          </p>
          <a
            href="/notificar"
            className="mt-3 inline-flex text-sm font-semibold text-[#001f53] hover:underline"
          >
            Registrar não conformidade
          </a>
        </div>
      </div>
    </div>
  );
}
