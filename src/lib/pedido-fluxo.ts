import type { StatusPedido } from "@/types/database";

// Único fluxo permitido na interface. O banco valida de novo.
const PROXIMO: Partial<Record<StatusPedido, StatusPedido>> = {
  orcamento: "aprovado",
  aprovado: "agendado",
  agendado: "em_andamento",
  em_andamento: "concluido",
};

const PODE_CANCELAR: StatusPedido[] = ["orcamento", "aprovado"];

const ROTULO_AVANCAR: Partial<Record<StatusPedido, string>> = {
  aprovado: "Aprovar",
  agendado: "Agendar",
  em_andamento: "Iniciar execução",
  concluido: "Concluir",
};

export function acoesDisponiveis(status: StatusPedido) {
  const acoes: { destino: StatusPedido; rotulo: string }[] = [];
  const proximo = PROXIMO[status];
  if (proximo) acoes.push({ destino: proximo, rotulo: ROTULO_AVANCAR[proximo]! });
  if (PODE_CANCELAR.includes(status))
    acoes.push({ destino: "cancelado", rotulo: "Cancelar pedido" });
  return acoes;
}
