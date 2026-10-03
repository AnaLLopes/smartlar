"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MudarStatusDialog } from "@/components/mudar-status-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatarDataHora,
  formatarMoeda,
  PAGAMENTO_LABEL,
} from "@/lib/format";
import { notificarErro } from "@/lib/erros";
import { acoesDisponiveis } from "@/lib/pedido-fluxo";
import { supabase } from "@/lib/supabase";
import type {
  Cliente,
  HistoricoStatus,
  ItemPedido,
  Pedido,
  StatusPedido,
} from "@/types/database";

type PedidoDetalhe = Pedido & {
  cliente: Cliente | null;
  tecnico: { nome: string } | null;
  itens_pedido: (ItemPedido & { produto: { nome: string } | null })[];
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd>{children ?? "—"}</dd>
    </div>
  );
}

export default function PedidoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [destino, setDestino] = useState<StatusPedido | null>(null);

  const buscar = useCallback(async () => {
    const [p, h] = await Promise.all([
      supabase
        .from("pedidos")
        .select(
          "*, cliente:clientes(*), tecnico:tecnicos(nome), itens_pedido(*, produto:produtos(nome))"
        )
        .eq("id", id)
        .maybeSingle<PedidoDetalhe>(),
      supabase
        .from("historico_status")
        .select("*")
        .eq("pedido_id", id)
        .order("changed_at", { ascending: false })
        .returns<HistoricoStatus[]>(),
    ]);
    return { p, h };
  }, [id]);

  const aplicar = useCallback(
    ({ p, h }: Awaited<ReturnType<typeof buscar>>) => {
      const e = p.error ?? h.error;
      if (e) notificarErro(e, "Erro ao carregar o pedido");
      setErro(!!e);
      setPedido(p.data);
      setHistorico(h.data ?? []);
      setCarregando(false);
    },
    []
  );

  useEffect(() => {
    buscar().then(aplicar);
  }, [buscar, aplicar]);

  const voltar = (
    <Button
      variant="ghost"
      size="sm"
      className="mb-4"
      render={<Link href="/pedidos" />}
    >
      <ArrowLeft className="size-4" />
      Pedidos
    </Button>
  );

  if (carregando)
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!pedido)
    return (
      <div>
        {voltar}
        <p className={erro ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {erro ? "Não foi possível carregar o pedido." : "Pedido não encontrado."}
        </p>
      </div>
    );

  const acoes = acoesDisponiveis(pedido.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        {voltar}
        <PageHeader
          titulo={`Pedido de ${pedido.cliente?.nome ?? "—"}`}
          descricao={`Criado em ${formatarDataHora(pedido.created_at)}`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={pedido.status} />
          {acoes.map((a) => (
            <Button
              key={a.destino}
              size="sm"
              variant={a.destino === "cancelado" ? "destructive" : "default"}
              onClick={() => setDestino(a.destino)}
            >
              {a.rotulo}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <Campo rotulo="Nome">{pedido.cliente?.nome}</Campo>
              <Campo rotulo="Telefone">{pedido.cliente?.telefone}</Campo>
              <Campo rotulo="Endereço">{pedido.cliente?.endereco}</Campo>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <Campo rotulo="Técnico">{pedido.tecnico?.nome}</Campo>
              <Campo rotulo="Data de instalação">
                {pedido.data_instalacao
                  ? formatarDataHora(pedido.data_instalacao)
                  : null}
              </Campo>
              <Campo rotulo="Forma de pagamento">
                {pedido.forma_pagamento
                  ? (PAGAMENTO_LABEL[pedido.forma_pagamento] ?? pedido.forma_pagamento)
                  : null}
              </Campo>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedido.itens_pedido.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.produto?.nome ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{i.quantidade}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoeda(Number(i.preco_unitario))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoeda(Number(i.subtotal))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center justify-end gap-4 border-t pt-4">
            <span className="text-muted-foreground">Valor total</span>
            <span className="text-2xl font-semibold tabular-nums">
              {formatarMoeda(Number(pedido.valor_total))}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{pedido.observacoes || "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Sem registros.
                  </TableCell>
                </TableRow>
              )}
              {historico.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    {h.status_anterior ? <StatusBadge status={h.status_anterior} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={h.status_novo} />
                  </TableCell>
                  <TableCell>{formatarDataHora(h.changed_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MudarStatusDialog
        pedido={pedido}
        destino={destino}
        onFechar={() => setDestino(null)}
        onConcluido={() => {
          setDestino(null);
          buscar().then(aplicar);
        }}
      />
    </div>
  );
}
