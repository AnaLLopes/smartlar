"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  STATUS_LABEL,
} from "@/lib/format";
import { notificarErro } from "@/lib/erros";
import { supabase } from "@/lib/supabase";
import { STATUS_PEDIDO, type Pedido, type StatusPedido } from "@/types/database";

type PedidoLista = Pedido & {
  cliente: { nome: string } | null;
  tecnico: { nome: string } | null;
};

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function PedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoLista[] | null>(null);
  const [erro, setErro] = useState(false);
  const [status, setStatus] = useState<StatusPedido | "todos">("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("*, cliente:clientes(nome), tecnico:tecnicos(nome)")
      .order("created_at", { ascending: false })
      .returns<PedidoLista[]>()
      .then(({ data, error }) => {
        if (error) notificarErro(error, "Erro ao carregar pedidos");
        setErro(!!error);
        setPedidos(data ?? []);
      });
  }, []);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (pedidos ?? []).filter(
      (p) =>
        (status === "todos" || p.status === status) &&
        (!termo || normalizar(p.cliente?.nome ?? "").includes(termo))
    );
  }, [pedidos, status, busca]);

  return (
    <div>
      <PageHeader
        titulo="Pedidos"
        descricao="Acompanhe e atualize o status dos pedidos."
      />

      <div className="mb-4 flex flex-wrap gap-1.5 rounded-xl bg-muted p-1.5">
        {(["todos", ...STATUS_PEDIDO] as const).map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={status === s ? "default" : "ghost"}
            onClick={() => setStatus(s)}
          >
            {s === "todos" ? "Todos" : STATUS_LABEL[s]}
          </Button>
        ))}
      </div>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nome do cliente"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-10 bg-card pl-9"
        />
      </div>

      {erro && (
        <p className="mb-4 text-sm text-destructive">
          Não foi possível carregar os pedidos. Recarregue a página.
        </p>
      )}

      <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor total</TableHead>
            <TableHead className="hidden md:table-cell">Técnico</TableHead>
            <TableHead className="hidden md:table-cell">Instalação</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos === null && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {pedidos && filtrados.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <EstadoVazio
                  icone={SearchX}
                  titulo="Nenhum pedido encontrado"
                  descricao="Ajuste o filtro de status ou a busca."
                />
              </TableCell>
            </TableRow>
          )}
          {filtrados.map((p) => (
            <TableRow
              key={p.id}
              className="cursor-pointer"
              onClick={() => router.push(`/pedidos/${p.id}`)}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/pedidos/${p.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {p.cliente?.nome ?? "—"}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatarMoeda(Number(p.valor_total))}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {p.tecnico?.nome ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {p.data_instalacao ? formatarDataHora(p.data_instalacao) : "—"}
              </TableCell>
              <TableCell>{formatarData(p.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>
    </div>
  );
}
