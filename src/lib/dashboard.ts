import { supabase } from "@/lib/supabase";
import { mensagemErro } from "@/lib/mensagem-erro";
import { FUSO } from "@/lib/format";
import type { PedidoComRelacoes } from "@/types/database";

// Limites do mês atual no fuso de São Paulo (UTC-3, sem horário de verão).
function limitesDoMes() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const ano = Number(partes.find((p) => p.type === "year")!.value);
  const mes = Number(partes.find((p) => p.type === "month")!.value);
  const iso = (a: number, m: number) =>
    `${a}-${String(m).padStart(2, "0")}-01T00:00:00-03:00`;
  return {
    inicio: iso(ano, mes),
    fim: mes === 12 ? iso(ano + 1, 1) : iso(ano, mes + 1),
  };
}

const soma = (linhas: { valor_total: number }[] | null) =>
  (linhas ?? []).reduce((acc, l) => acc + Number(l.valor_total), 0);

const SELECT_PEDIDO =
  "*, cliente:clientes(id, nome, endereco), tecnico:tecnicos(id, nome)";

export type PedidoDashboard = Omit<PedidoComRelacoes, "cliente"> & {
  cliente: { id: string; nome: string; endereco: string | null } | null;
};

export async function carregarDashboard() {
  const { inicio, fim } = limitesDoMes();
  const agora = new Date();
  const em7Dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [totalMes, faturado, aReceber, pendentes, proximas, orcamentos] =
    await Promise.all([
      supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .gte("created_at", inicio)
        .lt("created_at", fim),
      supabase
        .from("pedidos")
        .select("valor_total")
        .eq("status", "concluido")
        .gte("created_at", inicio)
        .lt("created_at", fim),
      supabase
        .from("pedidos")
        .select("valor_total")
        .in("status", ["aprovado", "agendado", "em_andamento"]),
      supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .eq("status", "aprovado"),
      supabase
        .from("pedidos")
        .select(SELECT_PEDIDO)
        .eq("status", "agendado")
        .gte("data_instalacao", agora.toISOString())
        .lte("data_instalacao", em7Dias.toISOString())
        .order("data_instalacao", { ascending: true })
        .returns<PedidoDashboard[]>(),
      supabase
        .from("pedidos")
        .select(SELECT_PEDIDO)
        .eq("status", "orcamento")
        .order("created_at", { ascending: false })
        .returns<PedidoDashboard[]>(),
    ]);

  const erro = [totalMes, faturado, aReceber, pendentes, proximas, orcamentos]
    .map((r) => r.error)
    .find(Boolean);
  if (erro) throw new Error(mensagemErro(erro));

  return {
    totalPedidosMes: totalMes.count ?? 0,
    valorFaturadoMes: soma(faturado.data),
    valorAReceber: soma(aReceber.data),
    pendentesAgendamento: pendentes.count ?? 0,
    proximasInstalacoes: proximas.data ?? [],
    orcamentos: orcamentos.data ?? [],
  };
}
