import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const configPadrao: WhatsappConfig = {
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
};

type ParcelaRow = {
  id: string;
  cliente_id: string;
  descricao: string;
  valor: number | string;
  vencimento: string;
  status: ParcelaStatus;
  lembrete_enviado_em: string | null;
};

const mapParcela = (row: ParcelaRow): Parcela => ({
  id: row.id,
  clienteId: row.cliente_id,
  descricao: row.descricao,
  valor: Number(row.valor),
  vencimento: row.vencimento,
  status: row.status,
  ...(row.lembrete_enviado_em ? { lembreteEnviadoEm: row.lembrete_enviado_em } : {}),
});

type CrmContextValue = {
  clientes: Cliente[];
  parcelas: Parcela[];
  whatsapp: WhatsappConfig;
  carregando: boolean;
  setWhatsapp: (patch: Partial<WhatsappConfig>) => void;
  addCliente: (input: Omit<Cliente, "id">) => Promise<Cliente | null>;
  addParcela: (input: Omit<Parcela, "id">) => Promise<void>;
  marcarPago: (id: string) => Promise<void>;
  registrarLembrete: (id: string) => Promise<void>;
  clienteDe: (id: string) => Cliente | undefined;
};

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [whatsapp, setWhatsappState] = useState<WhatsappConfig>(configPadrao);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    const [cl, pa, cfg] = await Promise.all([
      supabase.from("clientes").select("id, nome, telefone").order("nome"),
      supabase
        .from("parcelas")
        .select("id, cliente_id, descricao, valor, vencimento, status, lembrete_enviado_em")
        .order("vencimento"),
      supabase.from("whatsapp_config").select("*").eq("id", 1).maybeSingle(),
    ]);

    if (cl.data) setClientes(cl.data as Cliente[]);
    if (pa.data) setParcelas((pa.data as ParcelaRow[]).map(mapParcela));
    if (cfg.data) {
      const c = cfg.data;
      setWhatsappState({
        provider: (c.provider as WhatsappProvider) ?? "meta",
        apiToken: c.api_token ?? "",
        instanceUrl: c.instance_url ?? "",
        phoneNumberId: c.phone_number_id ?? "",
        businessAccountId: c.business_account_id ?? "",
        sessionName: c.session_name ?? "default",
        status: (c.status as WhatsappConfig["status"]) ?? "desconectado",
        ...(c.testado_em ? { testadoEm: c.testado_em } : {}),
        mensagemPadrao: c.mensagem_padrao ?? configPadrao.mensagemPadrao,
        enviarAutomatico: c.enviar_automatico ?? true,
      });
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const setWhatsapp = useCallback((patch: Partial<WhatsappConfig>) => {
    setWhatsappState((prev) => {
      const next = { ...prev, ...patch };
      void supabase
        .from("whatsapp_config")
        .update({
          provider: next.provider,
          api_token: next.apiToken,
          instance_url: next.instanceUrl,
          phone_number_id: next.phoneNumberId,
          business_account_id: next.businessAccountId,
          session_name: next.sessionName,
          status: next.status,
          testado_em: next.testadoEm ?? null,
          mensagem_padrao: next.mensagemPadrao,
          enviar_automatico: next.enviarAutomatico,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      return next;
    });
  }, []);

  const value = useMemo<CrmContextValue>(
    () => ({
      clientes,
      parcelas,
      whatsapp,
      carregando,
      setWhatsapp,
      addCliente: async (input) => {
        const { data, error } = await supabase
          .from("clientes")
          .insert({ nome: input.nome, telefone: input.telefone })
          .select("id, nome, telefone")
          .single();
        if (error || !data) return null;
        const cliente = data as Cliente;
        setClientes((prev) => [...prev, cliente]);
        return cliente;
      },
      addParcela: async (input) => {
        const { data } = await supabase
          .from("parcelas")
          .insert({
            cliente_id: input.clienteId,
            descricao: input.descricao,
            valor: input.valor,
            vencimento: input.vencimento,
            status: input.status,
          })
          .select("id, cliente_id, descricao, valor, vencimento, status, lembrete_enviado_em")
          .single();
        if (data) setParcelas((prev) => [...prev, mapParcela(data as ParcelaRow)]);
      },
      marcarPago: async (id) => {
        setParcelas((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "pago" as ParcelaStatus } : p)),
        );
        await supabase.from("parcelas").update({ status: "pago" }).eq("id", id);
      },
      registrarLembrete: async (id) => {
        const agora = new Date().toISOString();
        setParcelas((prev) =>
          prev.map((p) => (p.id === id ? { ...p, lembreteEnviadoEm: agora } : p)),
        );
        await supabase.from("parcelas").update({ lembrete_enviado_em: agora }).eq("id", id);
      },
      clienteDe: (id) => clientes.find((c) => c.id === id),
    }),
    [clientes, parcelas, whatsapp, carregando, setWhatsapp],
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
