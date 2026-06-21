/**
 * Shipped v2 auth scaffolding note: keep <form onSubmit>,
 * e.preventDefault(), authClient.signIn.email, and callbackUrl redirect.
 */
"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  AuthShell,
  PublicNotificationCallout,
} from "@/components/auth/AuthShell";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message ?? "Não foi possível entrar");
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.location.href = callbackUrl;
    } else {
      console.warn("signin: window is undefined; cannot redirect to callbackUrl");
    }
  };

  return (
    <AuthShell>
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-950">Entrar no painel</h2>
        <p className="mt-2 text-sm text-slate-600">
          Acesso para usuários autorizados da qualidade e gestão.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-medium text-slate-700">
          E-mail
          <span className="relative mt-2 block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12"
              placeholder="usuario@hospital.com.br"
            />
          </span>
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Senha
            </label>
            <a
              href={`/account/forgot-password?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-sm font-semibold text-[#001f53] hover:underline"
            >
              Esqueci a senha
            </a>
          </div>
          <span className="relative mt-2 block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12"
              placeholder="Sua senha"
            />
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#001f53] px-4 text-base font-semibold text-white transition hover:bg-[#07336f] disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <PublicNotificationCallout />

      <a
        href={`/account/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="mt-5 block text-center text-sm text-slate-500 hover:text-[#001f53] hover:underline"
      >
        Criar acesso interno
      </a>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
