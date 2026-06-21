"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

type AuthResponse = {
  status?: boolean;
  message?: string;
  code?: string;
};

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  try {
    const data = (await response.json()) as AuthResponse;
    return data;
  } catch {
    return {};
  }
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    token ? null : "Link de recuperação inválido ou expirado.",
  );
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError("Link de recuperação inválido ou expirado.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não conferem.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newPassword: password,
        token,
      }),
    });
    const data = await readAuthResponse(response);

    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Não foi possível redefinir a senha.");
      return;
    }

    setMessage("Senha redefinida com sucesso. Você já pode entrar novamente.");
  };

  return (
    <AuthShell
      eyebrow="Acesso ao painel"
      title="Defina uma nova senha para continuar."
      description="Use uma senha forte e exclusiva para proteger as tratativas e dados internos do ProntoQualy."
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-950">Nova senha</h2>
        <p className="mt-2 text-sm text-slate-600">
          Informe e confirme sua nova senha de acesso.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-medium text-slate-700">
          Nova senha
          <span className="relative mt-2 block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              disabled={!token}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12 disabled:bg-slate-100"
              placeholder="Mínimo de 8 caracteres"
            />
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Confirmar senha
          <span className="relative mt-2 block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={8}
              disabled={!token}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-base outline-none transition focus:border-[#1f5b93] focus:ring-4 focus:ring-[#1f5b93]/12 disabled:bg-slate-100"
              placeholder="Repita a nova senha"
            />
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#001f53] px-4 text-base font-semibold text-white transition hover:bg-[#07336f] disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Redefinir senha"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <a
        href={`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#001f53] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </a>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
