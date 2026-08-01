import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ParcelaStatus = "pendente" | "pago" | "atrasado";

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
};

export type Parcela = {
  id: string;
  clienteId: string;
  descricao: string;
  valor: number;
  vencimento: string; // ISO yyyy-mm-dd
  status: ParcelaStatus;
  lembreteEnviadoEm?: string;
};

export type WhatsappProvider = "meta" | "waha" | "uazapigo";

export type WhatsappConfig = {
  provider: WhatsappProvider;
  apiToken: string;
  instanceUrl: string;
  phoneNumberId: string;
  businessAccountId: string;
  sessionName: string;
  status: "conectado" | "desconectado";
  testadoEm?: string;
  mensagemPadrao: string;
  enviarAutomatico: boolean;
};

const dayOffset = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const clientesIniciais: Cliente[] = [
  { id: "c1", nome: "Marina Albuquerque", telefone: "+55 11 98832-1044" },
  { id: "c2", nome: "Rafael Tavares", telefone: "+55 21 99120-7781" },
  { id: "c3", nome: "Studio Nord Arquitetura", telefone: "+55 11 3355-2210" },
  { id: "c4", nome: "Camila Bezerra", telefone: "+55 85 98771-3390" },
  { id: "c5", nome: "Otávio Lins", telefone: "+55 31 99604-2255" },
  { id: "c6", nome: "Padaria Trigo & Sal", telefone: "+55 41 3022-8890" },
  { id: "c7", nome: "Beatriz Moraes", telefone: "+55 51 98410-6677" },
];

const parcelasIniciais: Parcela[] = [
  { id: "p1", clienteId: "c1", descricao: "Plano Anual — Parcela 4/12", valor: 890, vencimento: dayOffset(0), status: "pendente" },
  { id: "p2", clienteId: "c2", descricao: "Consultoria Tributária 2/3", valor: 2400, vencimento: dayOffset(0), status: "pendente" },
  { id: "p3", clienteId: "c3", descricao: "Licença CRM Equipe 7/12", valor: 1580.5, vencimento: dayOffset(2), status: "pendente" },
  { id: "p4", clienteId: "c4", descricao: "Projeto Identidade Visual 1/2", valor: 3200, vencimento: dayOffset(4), status: "pendente" },
  { id: "p5", clienteId: "c5", descricao: "Manutenção Mensal", valor: 450, vencimento: dayOffset(6), status: "pendente" },
  { id: "p6", clienteId: "c6", descricao: "Equipamento — Parcela 3/6", valor: 1120, vencimento: dayOffset(9), status: "pendente" },
  { id: "p7", clienteId: "c7", descricao: "Assessoria Jurídica 5/8", valor: 760, vencimento: dayOffset(-3), status: "atrasado", lembreteEnviadoEm: dayOffset(-1) },
  { id: "p8", clienteId: "c2", descricao: "Consultoria Tributária 1/3", valor: 2400, vencimento: dayOffset(-11), status: "atrasado" },
  { id: "p9", clienteId: "c5", descricao: "Setup Inicial", valor: 1900, vencimento: dayOffset(-6), status: "atrasado" },
  { id: "p10", clienteId: "c1", descricao: "Plano Anual — Parcela 3/12", valor: 890, vencimento: dayOffset(-18), status: "pago" },
  { id: "p11", clienteId: "c3", descricao: "Licença CRM Equipe 6/12", valor: 1580.5, vencimento: dayOffset(-22), status: "pago" },
  { id: "p12", clienteId: "c4", descricao: "Briefing e Pesquisa", valor: 1400, vencimento: dayOffset(-14), status: "pago" },
  { id: "p13", clienteId: "c6", descricao: "Equipamento — Parcela 2/6", valor: 1120, vencimento: dayOffset(-9), status: "pago" },
  { id: "p14", clienteId: "c7", descricao: "Assessoria Jurídica 4/8", valor: 760, vencimento: dayOffset(-25), status: "pago" },
];

type CrmContextValue = {
  clientes: Cliente[];
  parcelas: Parcela[];
  whatsapp: WhatsappConfig;
  setWhatsapp: (patch: Partial<WhatsappConfig>) => void;
  addCliente: (input: Omit<Cliente, "id">) => Cliente;
  addParcela: (input: Omit<Parcela, "id">) => void;
  marcarPago: (id: string) => void;
  registrarLembrete: (id: string) => void;
  clienteDe: (id: string) => Cliente | undefined;
};

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [parcelas, setParcelas] = useState<Parcela[]>(parcelasIniciais);
  const [whatsapp, setWhatsappState] = useState<WhatsappConfig>({
    provider: "meta",
    apiToken: "",
    instanceUrl: "",
    phoneNumberId: "",
    businessAccountId: "",
    sessionName: "default",
    status: "desconectado",
    mensagemPadrao:
      "Olá {{cliente}}, sua parcela de {{valor}} referente a {{descricao}} vence em {{vencimento}}. Qualquer dúvida, estamos por aqui!",
    enviarAutomatico: true,
  });

  const value = useMemo<CrmContextValue>(
    () => ({
      clientes,
      parcelas,
      whatsapp,
      setWhatsapp: (patch) => setWhatsappState((prev) => ({ ...prev, ...patch })),
      addCliente: (input) => {
        const cliente: Cliente = { ...input, id: `c${Date.now()}` };
        setClientes((prev) => [...prev, cliente]);
        return cliente;
      },
      addParcela: (input) =>
        setParcelas((prev) => [...prev, { ...input, id: `p${Date.now()}` }]),
      marcarPago: (id) =>
        setParcelas((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "pago" as ParcelaStatus } : p)),
        ),
      registrarLembrete: (id) =>
        setParcelas((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, lembreteEnviadoEm: new Date().toISOString() } : p,
          ),
        ),
      clienteDe: (id) => clientes.find((c) => c.id === id),
    }),
    [clientes, parcelas, whatsapp],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm deve ser usado dentro de CrmProvider");
  return ctx;
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const hojeISO = () => dayOffset(0);

export const diasAte = (iso: string) => {
  const alvo = new Date(`${iso}T12:00:00`);
  const hoje = new Date(`${hojeISO()}T12:00:00`);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000);
};

export const dataCurta = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

export const statusLabel: Record<ParcelaStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};
