import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search, Send, Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell, StatusPill } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  brl,
  dataCurta,
  diasAte,
  hojeISO,
  useCrm,
  type Parcela,
  type ParcelaStatus,
} from "@/lib/crm-store";

export const Route = createFileRoute("/parcelas")({
  head: () => ({
    meta: [
      { title: "Gestão de Parcelas — Cobrança CRM" },
      {
        name: "description",
        content:
          "Organize parcelas em lista ou Kanban por status, filtre por período e cadastre novas cobranças.",
      },
      { property: "og:title", content: "Gestão de Parcelas — Cobrança CRM" },
      {
        property: "og:description",
        content: "Kanban de cobrança com colunas por vencimento e cadastro de clientes no mesmo fluxo.",
      },
    ],
  }),
  component: ParcelasPage,
});

type Coluna = "breve" | "hoje" | "atrasado" | "pago";

const colunas: { key: Coluna; label: string; accent: string }[] = [
  { key: "breve", label: "Vence em breve", accent: "bg-primary" },
  { key: "hoje", label: "Vence hoje", accent: "bg-warning" },
  { key: "atrasado", label: "Atrasado", accent: "bg-destructive" },
  { key: "pago", label: "Pago", accent: "bg-success" },
];

const colunaDe = (p: Parcela): Coluna => {
  if (p.status === "pago") return "pago";
  if (p.status === "atrasado") return "atrasado";
  return diasAte(p.vencimento) === 0 ? "hoje" : "breve";
};

function ParcelasPage() {
  const { parcelas, clientes, clienteDe, addCliente, addParcela, marcarPago, registrarLembrete } =
    useCrm();
  const [view, setView] = useState<"lista" | "kanban">("kanban");
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState("todos");
  const [aberto, setAberto] = useState(false);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return parcelas
      .filter((p) => {
        const nome = clienteDe(p.clienteId)?.nome.toLowerCase() ?? "";
        if (termo && !nome.includes(termo) && !p.descricao.toLowerCase().includes(termo)) return false;
        const d = diasAte(p.vencimento);
        if (periodo === "7") return d >= 0 && d <= 7;
        if (periodo === "30") return d >= 0 && d <= 30;
        if (periodo === "vencidas") return d < 0;
        return true;
      })
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [parcelas, busca, periodo, clienteDe]);

  const enviar = (p: Parcela) => {
    registrarLembrete(p.id);
    toast.success(`Lembrete enfileirado para ${clienteDe(p.clienteId)?.nome}`);
  };

  return (
    <AppShell
      title="Gestão de parcelas"
      subtitle={`${filtradas.length} parcelas no filtro atual`}
      actions={
        <NovaParcelaDialog
          aberto={aberto}
          setAberto={setAberto}
          clientes={clientes}
          addCliente={addCliente}
          addParcela={addParcela}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por cliente ou descrição"
            className="bg-card pl-9"
          />
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo o período</SelectItem>
            <SelectItem value="7">Próximos 7 dias</SelectItem>
            <SelectItem value="30">Próximos 30 dias</SelectItem>
            <SelectItem value="vencidas">Já vencidas</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={view} onValueChange={(v) => setView(v as "lista" | "kanban")}>
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="mr-1.5 size-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="lista">
              <List className="mr-1.5 size-4" /> Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "kanban" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {colunas.map((col) => {
            const itens = filtradas.filter((p) => colunaDe(p) === col.key);
            const total = itens.reduce((s, p) => s + p.valor, 0);
            return (
              <section key={col.key} className="rounded-xl bg-surface p-3">
                <header className="mb-3 flex items-center justify-between px-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className={`size-2 rounded-full ${col.accent}`} />
                    {col.label}
                    <span className="num text-xs text-muted-foreground">{itens.length}</span>
                  </span>
                  <span className="num text-xs text-muted-foreground">{brl(total)}</span>
                </header>
                <div className="space-y-2.5">
                  {itens.map((p) => {
                    const cliente = clienteDe(p.clienteId);
                    return (
                      <article key={p.id} className="panel p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{cliente?.nome}</p>
                          <span className="num text-sm font-semibold">{brl(p.valor)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{p.descricao}</p>
                        <p className="num mt-2 text-xs text-muted-foreground">
                          {cliente?.telefone} · {dataCurta(p.vencimento)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <StatusPill status={p.status} />
                          {p.status !== "pago" && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" title="Enviar lembrete" onClick={() => enviar(p)}>
                                <Send className="size-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Marcar como pago"
                                onClick={() => {
                                  marcarPago(p.id);
                                  toast.success("Parcela baixada como paga");
                                }}
                              >
                                <Check className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {itens.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                      Nenhuma parcela aqui.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-3 py-2.5 font-medium">Telefone</th>
                <th className="px-3 py-2.5 font-medium">Descrição</th>
                <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                <th className="px-3 py-2.5 font-medium">Vencimento</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => {
                const cliente = clienteDe(p.clienteId);
                return (
                  <tr key={p.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-3 font-medium">{cliente?.nome}</td>
                    <td className="num px-3 py-3 text-muted-foreground">{cliente?.telefone}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.descricao}</td>
                    <td className="num px-3 py-3 text-right font-medium">{brl(p.valor)}</td>
                    <td className="num px-3 py-3">{dataCurta(p.vencimento)}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.status !== "pago" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => enviar(p)}>
                            <Send className="size-3.5" /> Lembrete
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              marcarPago(p.id);
                              toast.success("Parcela baixada como paga");
                            }}
                          >
                            Baixar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Quitada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma parcela encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function NovaParcelaDialog({
  aberto,
  setAberto,
  clientes,
  addCliente,
  addParcela,
}: {
  aberto: boolean;
  setAberto: (v: boolean) => void;
  clientes: { id: string; nome: string; telefone: string }[];
  addCliente: (c: { nome: string; telefone: string }) => { id: string };
  addParcela: (p: {
    clienteId: string;
    descricao: string;
    valor: number;
    vencimento: string;
    status: ParcelaStatus;
  }) => void;
}) {
  const [modo, setModo] = useState<"existente" | "novo">("existente");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState(hojeISO());

  const salvar = () => {
    const valorNum = Number(valor.replace(",", "."));
    if (!descricao || !valorNum) {
      toast.error("Informe descrição e valor da parcela.");
      return;
    }
    let id = clienteId;
    if (modo === "novo") {
      if (!nome || !telefone) {
        toast.error("Informe nome e telefone do novo cliente.");
        return;
      }
      id = addCliente({ nome, telefone }).id;
    }
    if (!id) {
      toast.error("Selecione um cliente.");
      return;
    }
    addParcela({
      clienteId: id,
      descricao,
      valor: valorNum,
      vencimento,
      status: diasAte(vencimento) < 0 ? "atrasado" : "pendente",
    });
    toast.success("Parcela cadastrada");
    setAberto(false);
    setDescricao("");
    setValor("");
    setNome("");
    setTelefone("");
    setModo("existente");
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nova parcela
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova parcela</DialogTitle>
          <DialogDescription>
            Vincule a um cliente existente ou cadastre um novo no mesmo fluxo.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={modo} onValueChange={(v) => setModo(v as "existente" | "novo")}>
          <TabsList className="w-full">
            <TabsTrigger value="existente" className="flex-1">
              Cliente existente
            </TabsTrigger>
            <TabsTrigger value="novo" className="flex-1">
              Novo cliente
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4">
          {modo === "existente" ? (
            <div className="grid gap-1.5">
              <Label>Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} — {c.telefone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="nome">Nome do cliente</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ana Ribeiro" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tel">Telefone (WhatsApp)</Label>
                <Input
                  id="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="+55 11 90000-0000"
                />
              </div>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="desc">Descrição</Label>
            <Input
              id="desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Plano Anual — Parcela 5/12"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="890,00" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="venc">Vencimento</Label>
              <Input id="venc" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar}>Cadastrar parcela</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
