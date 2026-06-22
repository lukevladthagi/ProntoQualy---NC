"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink } from "@/lib/router-shim";
import { useSession } from "@/lib/auth-client";
import {
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Não Conformidades", href: "/nc", icon: ClipboardList },
  { name: "Tratativas", href: "/tratativas", icon: ListChecks },
  { name: "Indicadores", href: "/indicadores", icon: TrendingUp },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
];

const secondaryNav = [
  { name: "Notificações", href: "/notificacoes", icon: Bell },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

function getInitials(value?: string | null) {
  const raw = value?.trim();

  if (!raw) {
    return "U";
  }

  const base = raw.includes("@") ? raw.split("@")[0] : raw;
  const parts = base.split(/[.\s_-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const session = useSession();
  const user = session.data?.user;
  const displayName = user?.name || user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "Equipe Qualidade";
  const initials = getInitials(user?.name || user?.email);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[245px] transform bg-sidebar text-sidebar-foreground transition-all duration-200 lg:relative lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[76px]" : "lg:w-[245px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              "flex items-center gap-3 border-b border-sidebar-border px-3 py-4",
              sidebarCollapsed && "lg:justify-center lg:px-2",
            )}
          >
            <div
              className={cn(
                "flex min-h-16 flex-1 items-center rounded-lg bg-white px-3 py-2 shadow-sm",
                sidebarCollapsed &&
                  "lg:min-h-11 lg:w-11 lg:flex-none lg:overflow-hidden lg:px-1.5",
              )}
            >
              <img
                src="/brand/prontoqualy-logo.png"
                alt="ProntoQualy"
                className={cn(
                  "h-auto w-full object-contain",
                  sidebarCollapsed &&
                    "lg:h-8 lg:w-32 lg:max-w-none lg:object-left",
                )}
              />
            </div>
            <button
              className="ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav
            className={cn(
              "flex-1 space-y-1 overflow-y-auto px-3 py-4",
              sidebarCollapsed && "lg:px-2",
            )}
          >
            <p
              className={cn(
                "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40",
                sidebarCollapsed && "lg:sr-only",
              )}
            >
              Menu Principal
            </p>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/"}
                title={item.name}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                    sidebarCollapsed && "lg:justify-center lg:px-0",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className={cn(sidebarCollapsed && "lg:hidden")}>
                  {item.name}
                </span>
              </NavLink>
            ))}

            <div className="pt-6">
              <p
                className={cn(
                  "mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40",
                  sidebarCollapsed && "lg:sr-only",
                )}
              >
                Sistema
              </p>
              {secondaryNav.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  title={item.name}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                      sidebarCollapsed && "lg:justify-center lg:px-0",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className={cn(sidebarCollapsed && "lg:hidden")}>
                    {item.name}
                  </span>
                </NavLink>
              ))}
            </div>
          </nav>

          <div
            className={cn(
              "space-y-3 border-t border-sidebar-border p-4",
              sidebarCollapsed && "lg:px-2",
            )}
          >
            <button
              className={cn(
                "hidden w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex",
                sidebarCollapsed && "lg:justify-center lg:px-0",
              )}
              onClick={() => setSidebarCollapsed((value) => !value)}
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5 shrink-0" />
              ) : (
                <PanelLeftClose className="h-5 w-5 shrink-0" />
              )}
              <span className={cn(sidebarCollapsed && "lg:hidden")}>
                {sidebarCollapsed ? "Expandir" : "Recolher"}
              </span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    sidebarCollapsed && "lg:justify-center",
                  )}
                  title="Abrir menu do usuário"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
                    {initials}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1",
                      sidebarCollapsed && "lg:hidden",
                    )}
                  >
                    <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs text-sidebar-foreground/60">
                      {displayEmail}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                align="end"
                className="w-64 rounded-lg"
              >
                <DropdownMenuLabel className="space-y-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {displayEmail}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive">
                  <a href="/account/logout?callbackUrl=/account/signin">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[58px] items-center gap-4 border-b border-border bg-card px-4 py-3 lg:px-6">
          <button
            className="-ml-2 rounded-lg p-2 hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <a href="/notificacoes" className="relative rounded-lg p-2 hover:bg-muted">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </a>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
