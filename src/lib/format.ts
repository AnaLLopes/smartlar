import type { StatusPedido } from "@/types/database";

export const FUSO = "America/Sao_Paulo";

export const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    valor
  );

export const formatarData = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: FUSO }).format(new Date(iso));

export const formatarDataHora = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
  }).format(new Date(iso));

export const STATUS_LABEL: Record<StatusPedido, string> = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  agendado: "Agendado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const PAGAMENTO_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  boleto: "Boleto",
};
