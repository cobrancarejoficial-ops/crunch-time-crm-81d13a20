CREATE TYPE public.parcela_status AS ENUM ('pendente','pago','atrasado');

CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes acesso publico" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  vencimento DATE NOT NULL,
  status public.parcela_status NOT NULL DEFAULT 'pendente',
  lembrete_enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parcelas TO anon, authenticated;
GRANT ALL ON public.parcelas TO service_role;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parcelas acesso publico" ON public.parcelas FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX parcelas_vencimento_idx ON public.parcelas (vencimento);

CREATE TABLE public.whatsapp_config (
  id INT NOT NULL PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider TEXT NOT NULL DEFAULT 'meta',
  api_token TEXT NOT NULL DEFAULT '',
  instance_url TEXT NOT NULL DEFAULT '',
  phone_number_id TEXT NOT NULL DEFAULT '',
  business_account_id TEXT NOT NULL DEFAULT '',
  session_name TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'desconectado',
  testado_em TIMESTAMPTZ,
  mensagem_padrao TEXT NOT NULL DEFAULT 'Olá {{cliente}}, sua parcela de {{valor}} referente a {{descricao}} vence em {{vencimento}}. Qualquer dúvida, estamos por aqui!',
  enviar_automatico BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_config TO anon, authenticated;
GRANT ALL ON public.whatsapp_config TO service_role;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp config acesso publico" ON public.whatsapp_config FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.whatsapp_config (id) VALUES (1);

INSERT INTO public.clientes (id, nome, telefone) VALUES
  ('11111111-1111-4111-8111-000000000001','Marina Albuquerque','+55 11 98832-1044'),
  ('11111111-1111-4111-8111-000000000002','Rafael Tavares','+55 21 99120-7781'),
  ('11111111-1111-4111-8111-000000000003','Studio Nord Arquitetura','+55 11 3355-2210'),
  ('11111111-1111-4111-8111-000000000004','Camila Bezerra','+55 85 98771-3390'),
  ('11111111-1111-4111-8111-000000000005','Otávio Lins','+55 31 99604-2255'),
  ('11111111-1111-4111-8111-000000000006','Padaria Trigo & Sal','+55 41 3022-8890'),
  ('11111111-1111-4111-8111-000000000007','Beatriz Moraes','+55 51 98410-6677');

INSERT INTO public.parcelas (cliente_id, descricao, valor, vencimento, status, lembrete_enviado_em) VALUES
  ('11111111-1111-4111-8111-000000000001','Plano Anual — Parcela 4/12',890,CURRENT_DATE,'pendente',NULL),
  ('11111111-1111-4111-8111-000000000002','Consultoria Tributária 2/3',2400,CURRENT_DATE,'pendente',NULL),
  ('11111111-1111-4111-8111-000000000003','Licença CRM Equipe 7/12',1580.50,CURRENT_DATE + 2,'pendente',NULL),
  ('11111111-1111-4111-8111-000000000004','Projeto Identidade Visual 1/2',3200,CURRENT_DATE + 4,'pendente',NULL),
  ('11111111-1111-4111-8111-000000000005','Manutenção Mensal',450,CURRENT_DATE + 6,'pendente',NULL),
  ('11111111-1111-4111-8111-000000000006','Equipamento — Parcela 3/6',1120,CURRENT_DATE + 9,'pendente',NULL),
  ('11111111-1111-4111-8111-000000000007','Assessoria Jurídica 5/8',760,CURRENT_DATE - 3,'atrasado',now() - interval '1 day'),
  ('11111111-1111-4111-8111-000000000002','Consultoria Tributária 1/3',2400,CURRENT_DATE - 11,'atrasado',NULL),
  ('11111111-1111-4111-8111-000000000005','Setup Inicial',1900,CURRENT_DATE - 6,'atrasado',NULL),
  ('11111111-1111-4111-8111-000000000001','Plano Anual — Parcela 3/12',890,CURRENT_DATE - 18,'pago',NULL),
  ('11111111-1111-4111-8111-000000000003','Licença CRM Equipe 6/12',1580.50,CURRENT_DATE - 22,'pago',NULL),
  ('11111111-1111-4111-8111-000000000004','Briefing e Pesquisa',1400,CURRENT_DATE - 14,'pago',NULL),
  ('11111111-1111-4111-8111-000000000006','Equipamento — Parcela 2/6',1120,CURRENT_DATE - 9,'pago',NULL),
  ('11111111-1111-4111-8111-000000000007','Assessoria Jurídica 4/8',760,CURRENT_DATE - 25,'pago',NULL);