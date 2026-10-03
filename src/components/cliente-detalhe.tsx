"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatarData, formatarMoeda } from "@/lib/format";
import { notificarErro } from "@/lib/erros";
import { supabase } from "@/lib/supabase";
import type { Cliente, Pedido } from "@/types/database";

type PedidoResumo = Pick<Pedido, "id" | "status" | "valor_total" | "created_at">;

export function ClienteDetalhe({
  cliente,
  onFechar,
}: {
  cliente: Cliente | null;
  onFechar: () => void;
}) {
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null);
  const [erro, setErro] = useState(false);
  const clienteId = cliente?.id;

  useEffect(() => {
    if (!clienteId) return;
    let cancelado = false;
    supabase
      .from("pedidos")
      .select("id, status, valor_total, created_at")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .returns<PedidoResumo[]>()
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) notificarErro(error, "Erro ao carregar pedidos do cliente");
        setErro(!!error);
        setPedidos(data ?? []);
      });
    return () => {
      cancelado = true;
      setPedidos(null);
      setErro(false);
    };
  }, [clienteId]);

  return (
    <Sheet open={!!cliente} onOpenChange={(o) => !o && onFechar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {cliente && (
          <>
            <SheetHeader>
              <SheetTitle>{cliente.nome}</SheetTitle>
              <SheetDescription>Dados do cliente e pedidos</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-4">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Telefone</dt>
                  <dd>{cliente.telefone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd>{cliente.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Endereço</dt>
                  <dd>{cliente.endereco ?? "—"}</dd>
                </div>
              </dl>

              <div>
                <h3 className="mb-2 font-medium">Pedidos</h3>
                {erro && (
                  <p className="text-sm text-destructive">
                    Não foi possível carregar os pedidos.
                  </p>
                )}
                {!erro && pedidos === null && (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                )}
                {!erro && pedidos?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Este cliente ainda não tem pedidos.
                  </p>
                )}
                {!erro && pedidos && pedidos.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidos.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Link href={`/pedidos/${p.id}`} className="hover:underline">
                              <StatusBadge status={p.status} />
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/pedidos/${p.id}`} className="hover:underline">
                              {formatarMoeda(p.valor_total)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/pedidos/${p.id}`} className="hover:underline">
                              {formatarData(p.created_at)}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
