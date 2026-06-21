"use client";

import NCFormPage from "@/views/NCForm";

export default function PublicNotificationPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <img
            src="/brand/prontoqualy-logo.png"
            alt="ProntoQualy"
            className="h-auto w-full max-w-[310px] object-contain"
          />
          <div className="max-w-xl text-sm leading-6 text-muted-foreground">
            Formulário público para registrar não conformidades e eventos. A análise, as ações e a verificação de eficácia são realizadas no painel interno pela equipe autorizada.
          </div>
        </div>
      </header>
      <NCFormPage />
    </main>
  );
}
