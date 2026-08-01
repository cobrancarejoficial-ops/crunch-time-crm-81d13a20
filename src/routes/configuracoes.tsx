import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Plug, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCrm, type WhatsappProvider } from "@/lib/crm-store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Integração WhatsApp — Cobrança CRM" },
      {
        name: "description",
        content:
          "Configure o provedor de WhatsApp (Meta Official API, WAHA ou uazapiGO), teste a conexão e defina a mensagem de lembrete.",
      },
      { property: "og:title", content: "Integração WhatsApp — Cobrança CRM" },
      {
        property: "og:description",
        content: "Escolha o provedor, informe credenciais e valide a conexão do WhatsApp.",
      },
    ],
  }),
  component: Configuracoes,
});

const provedores: {
  id: WhatsappProvider;
  nome: string;
  desc: string;
  campos: ("apiToken" | "instanceUrl" | "phoneNumberId" | "businessAccountId" | "sessionName")[];
}[] = [
  {
    id: "meta",
    nome: "Meta Official API",
    desc: "Cloud API oficial. Requer número verificado e templates aprovados.",
    campos: ["apiToken", "phoneNumberId", "businessAccountId"],
  },
  {
    id: "waha",
    nome: "WAHA (Open-Source)",
    desc: "Auto-hospedado via Docker. Sessões conectadas por QR Code.",
    campos: ["instanceUrl", "apiToken", "sessionName"],
  },
  {
    id: "uazapigo",
    nome: "uazapiGO",
    desc: "API gerenciada com instâncias e token por conexão.",
    campos: ["instanceUrl", "apiToken"],
  },
];

const labels = {
  apiToken: { label: "API Token", placeholder: "EAAG... / token da instância", type: "password" },
  instanceUrl: { label: "URL da Instância", placeholder: "https://waha.suaempresa.com", type: "text" },
  phoneNumberId: { label: "Phone Number ID", placeholder: "109XXXXXXXXXXXX", type: "text" },
  businessAccountId: { label: "Business Account ID", placeholder: "1023XXXXXXXXXXX", type: "text" },
  sessionName: { label: "Nome da Sessão", placeholder: "default", type: "text" },
} as const;

function Configuracoes() {
  const { whatsapp, setWhatsapp } = useCrm();
  const [testando, setTestando] = useState(false);
  const atual = provedores.find((p) => p.id === whatsapp.provider)!;

  const testar = async () => {
    setTestando(true);
    setWhatsapp({ status: "desconectado" });
    const faltando = atual.campos.filter((c) => !whatsapp[c]?.trim());
    await new Promise((r) => setTimeout(r, 1200));
    setTestando(false);
    if (faltando.length) {
      toast.error("Não foi possível conectar", {
        description: `Preencha: ${faltando.map((c) => labels[c].label).join(", ")}.`,
      });
      return;
    }
    setWhatsapp({ status: "conectado", testadoEm: new Date().toISOString() });
    toast.success(`Conectado ao ${atual.nome}`, {
      description: "Mensagem de teste entregue com sucesso.",
    });
  };

  const conectado = whatsapp.status === "conectado";

  return (
    <AppShell
      title="Configurações de WhatsApp"
      subtitle="Provedor, credenciais e régua de lembretes"
      actions={
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            conectado ? "bg-success-soft text-success" : "bg-danger-soft text-destructive"
          }`}
        >
          {conectado ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
          {conectado ? "Conectado" : "Desconectado"}
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-base font-semibold">Provedor</h2>
            <p className="text-xs text-muted-foreground">Escolha por onde as mensagens serão enviadas</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {provedores.map((p) => {
                const ativo = p.id === whatsapp.provider;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setWhatsapp({ provider: p.id, status: "desconectado" })}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      ativo
                        ? "border-primary bg-accent/60 ring-1 ring-primary/30"
                        : "border-border bg-card hover:bg-surface"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.nome}</span>
                      {ativo && <CheckCircle2 className="size-4 text-primary" />}
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-semibold">Credenciais — {atual.nome}</h2>
            <p className="text-xs text-muted-foreground">
              Campos exigidos pelo provedor selecionado
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {atual.campos.map((campo) => (
                <div key={campo} className="grid gap-1.5">
                  <Label htmlFor={campo}>{labels[campo].label}</Label>
                  <Input
                    id={campo}
                    type={labels[campo].type}
                    value={whatsapp[campo]}
                    placeholder={labels[campo].placeholder}
                    onChange={(e) => setWhatsapp({ [campo]: e.target.value, status: "desconectado" })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <Button onClick={testar} disabled={testando}>
                {testando ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}
                {testando ? "Testando conexão..." : "Testar conexão"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {whatsapp.testadoEm
                  ? `Último teste: ${new Date(whatsapp.testadoEm).toLocaleString("pt-BR")}`
                  : "Nenhum teste realizado ainda."}
              </span>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="size-4 text-primary" /> Mensagem de lembrete
            </h2>
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {"{{cliente}}"}, {"{{valor}}"}, {"{{descricao}}"}, {"{{vencimento}}"}
            </p>
            <Textarea
              className="mt-3 min-h-28"
              value={whatsapp.mensagemPadrao}
              onChange={(e) => setWhatsapp({ mensagemPadrao: e.target.value })}
            />
            <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-surface p-3">
              <div>
                <p className="text-sm font-medium">Envio automático</p>
                <p className="text-xs text-muted-foreground">
                  Dispara 3 dias antes, no dia e 1 dia após o vencimento.
                </p>
              </div>
              <Switch
                checked={whatsapp.enviarAutomatico}
                onCheckedChange={(v) => setWhatsapp({ enviarAutomatico: v })}
              />
            </div>
          </section>
        </div>

        <aside className="panel h-fit p-5">
          <h2 className="text-base font-semibold">Status da integração</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Provedor</dt>
              <dd className="font-medium">{atual.nome}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Conexão</dt>
              <dd className={conectado ? "font-medium text-success" : "font-medium text-destructive"}>
                {conectado ? "Conectado" : "Desconectado"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Automação</dt>
              <dd className="font-medium">{whatsapp.enviarAutomatico ? "Ativa" : "Pausada"}</dd>
            </div>
          </dl>
          <div className="mt-5 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
            Pré-visualização:
            <p className="mt-2 rounded-md bg-success-soft p-2.5 text-foreground">
              {whatsapp.mensagemPadrao
                .replace("{{cliente}}", "Marina")
                .replace("{{valor}}", "R$ 890,00")
                .replace("{{descricao}}", "Plano Anual — Parcela 4/12")
                .replace("{{vencimento}}", "hoje")}
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
