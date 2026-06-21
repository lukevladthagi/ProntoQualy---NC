"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
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

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/account/reset-password?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/account/reset-password";

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        redirectTo,
      }),
    });
    const data = await readAuthResponse(response);

    setLoading(false);

    if (!response.ok) {
      if (data.code === "RESET_PASSWORD_DISABLED") {
        setError(
          "A recuperação por e-mail ainda precisa de configuração de envio no servidor. Por enquanto, solicite a redefinição ao administrador do sistema.",
        );
        return;
      }

      setError(data.message ?? "Não foi possível solicitar a recuperação.");
      return;
    }

    setMessage(
      data.message ??
        "Se este e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
    );
  };

  return (
    <AuthShell
      eyebrow="Acesso ao painel"
      title="Recupere o acesso com segurança."
      description="Informe o e-mail cadastrado para receber o link de redefinição de senha do ProntoQualy."
    >
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-950">Esqueci a senha</h2>
        <p className="mt-2 text-sm text-slate-600">
          Use o e-mail do seu cadastro interno.
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
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#001f53] px-4 text-base font-semibold text-white transition hover:bg-[#07336f] disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar instruções"}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
