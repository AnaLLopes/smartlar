"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { PackageOpen } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  EditarPrecoDialog,
  NovoProdutoDialog,
} from "@/components/produto-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda } from "@/lib/format";
import { notificarErro } from "@/lib/erros";
import { supabase } from "@/lib/supabase";
import type { Produto } from "@/types/database";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [erro, setErro] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);

  useEffect(() => {
    supabase
      .from("produtos")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .returns<Produto[]>()
      .then(({ data, error }) => {
        if (error) notificarErro(error, "Erro ao carregar produtos");
        setErro(!!error);
        setProdutos(data ?? []);
      });
  }, []);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Produto[]>();
    for (const p of produtos ?? []) {
      mapa.set(p.categoria, [...(mapa.get(p.categoria) ?? []), p]);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [produtos]);

  const categorias = grupos.map(([c]) => c);

  return (
    <div>
      <PageHeader titulo="Produtos" descricao="Catálogo de produtos e serviços." />

      <div className="mb-6 flex justify-end">
        <NovoProdutoDialog
          categorias={categorias}
          onCriado={(p) => setProdutos((l) => [...(l ?? []), p])}
        />
      </div>

      {erro && (
        <p className="mb-4 text-sm text-destructive">
          Não foi possível carregar os produtos. Recarregue a página.
        </p>
      )}
      {produtos === null && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}
      {produtos?.length === 0 && !erro && (
        <Card>
          <EstadoVazio
            icone={PackageOpen}
            titulo="Nenhum produto ativo cadastrado"
            descricao="Use “Novo produto” para montar o catálogo."
          />
        </Card>
      )}

      <div className="space-y-8">
        {grupos.map(([categoria, itens]) => (
          <section key={categoria}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              {categoria}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {itens.length}
              </span>
            </h2>
            <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">
                        {p.descricao ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatarMoeda(Number(p.preco_unitario))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar preço de ${p.nome}`}
                          onClick={() => setEditando(p)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            </Card>
          </section>
        ))}
      </div>

      <EditarPrecoDialog
        produto={editando}
        onFechar={() => setEditando(null)}
        onSalvo={(atualizado) => {
          setProdutos((l) =>
            (l ?? []).map((p) => (p.id === atualizado.id ? atualizado : p))
          );
          setEditando(null);
        }}
      />
    </div>
  );
}
