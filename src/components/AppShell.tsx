import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Wallet, Settings, CircleDollarSign } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/parcelas", label: "Parcelas", icon: Wallet },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <CircleDollarSign className="size-5" />
          </span>
          <span>
            <span className="block font-display text-sm font-semibold leading-tight">Cobrança CRM</span>
            <span className="block text-[11px] text-sidebar-foreground/60">Gestão de vencimentos</span>
          </span>
        </div>
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            }}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
        <div className="mt-auto rounded-lg bg-sidebar-accent/60 p-3 text-[11px] leading-relaxed text-sidebar-foreground/70">
          Lembretes de WhatsApp saem 3 dias antes, no dia e após o vencimento.
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex flex-wrap items-end justify-between gap-3 border-b border-border bg-background/85 px-5 py-4 backdrop-blur md:px-8">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
        <div className="px-5 py-6 md:px-8 md:py-8">{children}</div>
        <nav className="sticky bottom-0 flex border-t border-border bg-card md:hidden">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary font-medium" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}

export function StatusPill({ status }: { status: "pendente" | "pago" | "atrasado" }) {
  const map = {
    pendente: "bg-warning-soft text-warning-foreground",
    pago: "bg-success-soft text-success",
    atrasado: "bg-danger-soft text-destructive",
  } as const;
  const label = { pendente: "Pendente", pago: "Pago", atrasado: "Atrasado" }[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${map[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
