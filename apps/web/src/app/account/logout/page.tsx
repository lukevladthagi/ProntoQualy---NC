/**
 * ⚠ ANYTHING PLATFORM - DO NOT REWRITE THIS FILE ⚠
 *
 * Shipped v2 auth scaffolding. The useEffect-on-mount -> authClient.signOut ->
 * window.location.href redirect is load-bearing for the mobile WebView's
 * "sign out" flow. Safe to restyle the spinner / copy; unsafe to bypass
 * authClient.signOut or change the redirect behavior.
 */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function LogoutHandler() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { error: signOutError } = await authClient.signOut();
      if (cancelled) return;
      if (signOutError) {
        setError(signOutError.message ?? "Não foi possível sair");
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = callbackUrl;
      } else {
        console.warn("logout: window is undefined; cannot redirect to callbackUrl");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [callbackUrl]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 text-sm text-slate-600 shadow-sm">
        <img
          src="/brand/prontoqualy-logo.png"
          alt="ProntoQualy"
          className="h-auto w-52 object-contain"
        />
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : (
          <span>Saindo...</span>
        )}
      </div>
    </main>
  );
}

export default function LogoutPage() {
  return (
    <Suspense>
      <LogoutHandler />
    </Suspense>
  );
}
