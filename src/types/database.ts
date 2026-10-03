// Tipos das tabelas do Supabase da SmartLar.
// Colunas inferidas do enunciado: confira com o schema real
// (ex.: `npx supabase gen types typescript --project-id <id>`).

export const STATUS_PEDIDO = [
  "orcamento",
  "aprovado",
  "agendado",
  "em_andamento",
  "concluido",
  "cancelado",
] as const;

export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const FORMAS_PAGAMENTO = ["pix", "cartao", "dinheiro", "boleto"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  created_at: string;
}

export interface Tecnico {
  id: string;
  nome: string;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  preco_unitario: number;
  ativo: boolean;
  created_at: string;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  tecnico_id: string | null;
  status: StatusPedido;
  data_instalacao: string | null;
  observacoes: string | null;
  forma_pagamento: FormaPagamento | null;
  /** Calculado pelo banco: nunca enviar. */
  valor_total: number;
  created_at: string;
  updated_at: string;
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  /** Calculado pelo banco: nunca enviar. */
  subtotal: number;
}

export interface HistoricoStatus {
  id: string;
  pedido_id: string;
  status_anterior: StatusPedido | null;
  status_novo: StatusPedido;
  changed_at: string;
}

// Payloads de escrita: sem id, created_at e campos calculados pelo banco.
export type ClienteInsert = Omit<Cliente, "id" | "created_at">;
export type TecnicoInsert = Omit<Tecnico, "id">;
export type ProdutoInsert = Omit<Produto, "id" | "created_at">;
export type PedidoInsert = Pick<Pedido, "cliente_id"> &
  Partial<
    Pick<Pedido, "status" | "tecnico_id" | "data_instalacao" | "observacoes" | "forma_pagamento">
  >;
export type ItemPedidoInsert = Omit<ItemPedido, "id" | "subtotal">;

// Consultas com relacionamentos (select com join do PostgREST).
export type PedidoComRelacoes = Pedido & {
  cliente: Pick<Cliente, "id" | "nome"> | null;
  tecnico: Pick<Tecnico, "id" | "nome"> | null;
  itens_pedido?: (ItemPedido & { produto: Pick<Produto, "id" | "nome"> | null })[];
};
