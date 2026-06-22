/**
 * Shipped v2 auth scaffolding note: keep <form onSubmit>,
 * e.preventDefault(), authClient.signUp.email, and callbackUrl redirect.
 */
"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  LockKeyhole,
  LogIn,
  Mail,
  UserRound,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  AuthShell,
  PublicNotificationCallout,
} from "@/components/auth/AuthShell";

type Setor = {
  id: number | string;
  nome: string;
  is_ativo?: boolean | number;
};

function isActive(value: unknown) {
  return value === undefined || value === true || value === 1;
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const signInHref = `/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [setor, setSetor] = useState("");
  const [password, setPassword] = useState("");
  const [setores, setSetores] = useState<Setor[]>([]);
  const [setoresLoading, setSetoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/config/setores", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Setor[]) => {
        if (!active) return;
        setSetores(data.filter((item) => item.nome && isActive(item.is_ativo)));
      })
      .catch(() => {
        if (active) setSetores([]);
      })
      .finally(() => {
        if (active) setSetoresLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!setor) {
      setError("Selecione o setor principal do usuário.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: name.trim(),
      setor,
      perfil: "usuario",
      setoresPermitidos: JSON.stringify([setor]),
    } as any);

    if (signUpError) {
      setError(signUpError.message ?? "Não foi possível criar o acesso");
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      window.location.href = callbackUrl;
    } else {
      console.warn("signup: window is undefined; cannot redirect to callbackUrl");
    }
  };

  return (
    <AuthShell>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Criar acesso interno
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cadastre seu usuário e vincule o setor principal de atuação.
          </p>
        </div>
        <a
          href={signInHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#001f53] transition hover:border-[#001f53] hover:bg-slate-50"
        >
          <LogIn className="h-4 w-4" />
          Entrar
        </a>
      </div>

      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-medium text-slate-700">
          Nome
          <span className="relative mt-2 block">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12"
              placeholder="Seu nome"
            />
          </span>
        </label>

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

        <label className="block text-sm font-medium text-slate-700">
          Setor principal
          <span className="relative mt-2 block">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              required
              value={setor}
              disabled={setoresLoading}
              onChange={(e) => setSetor(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12 disabled:bg-slate-100"
            >
              <option value="">
                {setoresLoading ? "Carregando setores..." : "Selecione o setor"}
              </option>
              {setores.map((item) => (
                <option key={item.id} value={item.nome}>
                  {item.nome}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Senha
          <span className="relative mt-2 block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12"
              placeholder="Mínimo de 8 caracteres"
            />
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          O cadastro entra como usuário comum. Gestores e admins devem ter
          setores adicionais liberados posteriormente por um administrador.
        </div>

        <button
          type="submit"
          disabled={loading || setoresLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#001f53] px-4 text-base font-semibold text-white transition hover:bg-[#07336f] disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar acesso"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <PublicNotificationCallout />

      <a
        href={signInHref}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-[#001f53] transition hover:border-[#001f53] hover:bg-slate-50"
      >
        <LogIn className="h-4 w-4" />
        Já tenho acesso interno
      </a>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
