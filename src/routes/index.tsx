import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Send, TrendingUp, CalendarClock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusPill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { brl, dataCurta, diasAte, useCrm } from "@/lib/crm-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Cobrança — Cobrança CRM" },
      {
        name: "description",
        content:
          "Acompanhe total a receber, parcelas vencendo hoje, atrasos e recebimentos do mês em um só painel.",
      },
      { property: "og:title", content: "Dashboard de Cobrança — Cobrança CRM" },
      {
        property: "og:description",
        content: "KPIs de cobrança, distribuição de status e próximas parcelas a vencer.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { parcelas, clienteDe, registrarLembrete, whatsapp } = useCrm();

  const doMes = parcelas.filter((p) => Math.abs(diasAte(p.vencimento)) <= 30);
  const aReceber = doMes.filter((p) => p.status !== "pago").reduce((s, p) => s + p.valor, 0);
  const hoje = parcelas.filter((p) => diasAte(p.vencimento) === 0 && p.status !== "pago");
  const atrasadas = parcelas.filter((p) => p.status === "atrasado");
  const recebido = doMes.filter((p) => p.status === "pago").reduce((s, p) => s + p.valor, 0);

  const kpis = [
    {
      label: "Total a receber (30 dias)",
      value: brl(aReceber),
      hint: `${doMes.filter((p) => p.status !== "pago").length} parcelas abertas`,
      icon: TrendingUp,
      tone: "text-primary bg-accent",
    },
    {
      label: "Vencendo hoje",
      value: brl(hoje.reduce((s, p) => s + p.valor, 0)),
      hint: `${hoje.length} parcelas para cobrar`,
      icon: CalendarClock,
      tone: "text-warning-foreground bg-warning-soft",
    },
    {
      label: "Parcelas em atraso",
      value: brl(atrasadas.reduce((s, p) => s + p.valor, 0)),
      hint: `${atrasadas.length} clientes inadimplentes`,
      icon: AlertTriangle,
      tone: "text-destructive bg-danger-soft",
    },
    {
      label: "Total recebido (30 dias)",
      value: brl(recebido),
      hint: `${doMes.filter((p) => p.status === "pago").length} baixas no mês`,
      icon: CheckCircle2,
      tone: "text-success bg-success-soft",
    },
  ];

  const donut = [
    { name: "Pendente", value: parcelas.filter((p) => p.status === "pendente").length, color: "var(--chart-1)" },
    { name: "Pago", value: parcelas.filter((p) => p.status === "pago").length, color: "var(--chart-2)" },
    { name: "Atrasado", value: parcelas.filter((p) => p.status === "atrasado").length, color: "var(--chart-3)" },
  ];
  const totalDonut = donut.reduce((s, d) => s + d.value, 0);

  const proximas = parcelas
    .filter((p) => p.status !== "pago")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
    .slice(0, 8);

  const enviar = (id: string, nome: string) => {
    registrarLembrete(id);
    if (whatsapp.status === "conectado") {
      toast.success(`Lembrete enviado para ${nome}`, {
        description: "Mensagem entregue via WhatsApp.",
      });
    } else {
      toast.warning("Lembrete registrado na fila", {
        description: "Conecte um provedor de WhatsApp em Configurações para enviar de verdade.",
      });
    }
  };

  return (
    <AppShell
      title="Dashboard de cobrança"
      subtitle="Visão geral dos vencimentos e da régua de lembretes"
      actions={
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          WhatsApp:{" "}
          <span className={whatsapp.status === "conectado" ? "text-success" : "text-destructive"}>
            {whatsapp.status === "conectado" ? "conectado" : "desconectado"}
          </span>
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <span className={`grid size-8 place-items-center rounded-lg ${k.tone}`}>
                <k.icon className="size-4" />
              </span>
            </div>
            <p className="num mt-3 text-2xl font-semibold">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[340px_1fr]">
        <div className="panel p-5">
          <h2 className="text-base font-semibold">Status das parcelas</h2>
          <p className="text-xs text-muted-foreground">Distribuição da carteira ativa</p>
          <div className="relative mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  isAnimationActive={false}
                  strokeWidth={0}
                >
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span className="num text-2xl font-semibold">{totalDonut}</span>
              <span className="text-[11px] text-muted-foreground">parcelas</span>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {donut.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="num text-muted-foreground">
                  {d.value} · {totalDonut ? Math.round((d.value / totalDonut) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Próximas parcelas a vencer</h2>
              <p className="text-xs text-muted-foreground">Ordenadas pela data de vencimento</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Telefone</th>
                  <th className="px-3 py-2.5 font-medium">Descrição</th>
                  <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                  <th className="px-3 py-2.5 font-medium">Vencimento</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {proximas.map((p) => {
                  const cliente = clienteDe(p.clienteId);
                  const dias = diasAte(p.vencimento);
                  return (
                    <tr key={p.id} className="border-b border-border/70 last:border-0">
                      <td className="px-5 py-3 font-medium">{cliente?.nome}</td>
                      <td className="num px-3 py-3 text-muted-foreground">{cliente?.telefone}</td>
                      <td className="px-3 py-3 text-muted-foreground">{p.descricao}</td>
                      <td className="num px-3 py-3 text-right font-medium">{brl(p.valor)}</td>
                      <td className="px-3 py-3">
                        <span className="num">{dataCurta(p.vencimento)}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">
                          {dias === 0 ? "hoje" : dias > 0 ? `em ${dias}d` : `${Math.abs(dias)}d atrás`}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant={p.lembreteEnviadoEm ? "outline" : "default"}
                          onClick={() => enviar(p.id, cliente?.nome ?? "cliente")}
                        >
                          <Send className="size-3.5" />
                          {p.lembreteEnviadoEm ? "Reenviar" : "Enviar lembrete"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
