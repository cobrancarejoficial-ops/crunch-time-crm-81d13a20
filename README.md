# Payment Partner

Prompt 1: Dashboard de Cobrança e Visão Geral

"Crie um painel do CRM focado em gestão de vencimentos de parcelas. Inclua no topo 4 cards de métricas (KPIs): Total a Receber no Mês, Parcelas Vencendo Hoje, Parcelas em Atraso e Total Recebido. Abaixo, adicione um gráfico de rosca mostrando a distribuição do status das parcelas (Pendente, Pago, Atrasado) e uma tabela com as próximas parcelas a vencer, exibindo: Cliente, Telefone, Descrição, Valor, Data de Vencimento, Status e um botão de ação rápida 'Enviar Lembrete Manual'."

Prompt 2: Gestão de Clientes e Parcelas (Kanban/Tabela)

"Crie uma tela de gestão de parcelas com suporte a visualização em Lista e Kanban. Na visão Kanban, organize as colunas por status: 'Vence em Breve', 'Vence Hoje', 'Atrasado' e 'Pago'. Permita filtrar por período e pesquisar por nome do cliente. Adicione um modal para cadastrar uma nova parcela associada a um cliente existente ou criar um novo cliente no mesmo fluxo."

Prompt 3: Painel de Configuração da Integração com WhatsApp

"Crie uma página de Configurações para integração com WhatsApp. Adicione um seletor para escolher o provedor: 'Meta Official API', 'WAHA (Open-Source)' ou 'uazapiGO'. Dependendo da escolha, exiba os campos necessários (API Token, URL da Instância, Phone Number ID). Inclua um botão 'Testar Conexão' que faz uma chamada de teste e um status visual de conexão (Conectado / Desconectado)."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41822bb7-e01f-4e53-a7c2-1256a939e02a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
