"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserX, Users } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ClienteDetalhe } from "@/components/cliente-detalhe";
import { NovoClienteDialog } from "@/components/novo-cliente-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notificarErro } from "@/lib/erros";
import { supabase } from "@/lib/supabase";
import { apenasDigitos } from "@/lib/telefone";
import type { Cliente } from "@/types/database";

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);

  useEffect(() => {
    supabase
      .from("clientes")
      .select("*")
      .order("nome")
      .returns<Cliente[]>()
      .then(({ data, error }) => {
        if (error) notificarErro(error, "Erro ao carregar clientes");
        setErro(!!error);
        setClientes(data ?? []);
      });
  }, []);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const digitos = apenasDigitos(busca);
    if (!termo) return clientes ?? [];
    return (clientes ?? []).filter(
      (c) =>
        normalizar(c.nome).includes(termo) ||
        (digitos.length > 0 && apenasDigitos(c.telefone ?? "").includes(digitos))
    );
  }, [clientes, busca]);

  return (
    <div>
      <PageHeader titulo="Clientes" descricao="Cadastro e consulta de clientes." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou telefone"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 bg-card pl-9"
          />
        </div>
        <NovoClienteDialog
          onCriado={(c) =>
            setClientes((lista) =>
              [...(lista ?? []), c].sort((a, b) =>
                a.nome.localeCompare(b.nome, "pt-BR")
              )
            )
          }
        />
      </div>

      {erro && (
        <p className="mb-4 text-sm text-destructive">
          Não foi possível carregar os clientes. Recarregue a página.
        </p>
      )}

      <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead className="hidden md:table-cell">E-mail</TableHead>
            <TableHead className="hidden lg:table-cell">Endereço</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes === null && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          )}
          {clientes && filtrados.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <EstadoVazio
                  icone={busca ? UserX : Users}
                  titulo={busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                  descricao={busca ? "Tente buscar por outro nome ou telefone." : "Use “Novo cliente” para cadastrar o primeiro."}
                />
              </TableCell>
            </TableRow>
          )}
          {filtrados.map((c) => (
            <TableRow
              key={c.id}
              tabIndex={0}
              role="button"
              className="cursor-pointer"
              onClick={() => setSelecionado(c)}
              onKeyDown={(e) => e.key === "Enter" && setSelecionado(c)}
            >
              <TableCell className="font-medium">{c.nome}</TableCell>
              <TableCell>{c.telefone ?? "—"}</TableCell>
              <TableCell className="hidden md:table-cell">{c.email ?? "—"}</TableCell>
              <TableCell className="hidden lg:table-cell">{c.endereco ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Card>

      <ClienteDetalhe cliente={selecionado} onFechar={() => setSelecionado(null)} />
    </div>
  );
}
