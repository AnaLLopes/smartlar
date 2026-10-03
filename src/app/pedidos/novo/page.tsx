"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Trash2 } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { PageHeader } from "@/components/page-header";
import { NovoClienteDialog } from "@/components/novo-cliente-dialog";
import { Selecionador } from "@/components/selecionador";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatarMoeda } from "@/lib/format";
import { notificarErro } from "@/lib/erros";
import { mensagemErro } from "@/lib/mensagem-erro";
import { supabase } from "@/lib/supabase";
import { apenasDigitos } from "@/lib/telefone";
import type {
  Cliente,
  ItemPedidoInsert,
  Pedido,
  PedidoInsert,
  Produto,
} from "@/types/database";

interface Item {
  produto: Produto;
  quantidade: number;
  /** Preço do produto no momento em que foi adicionado. */
  preco: number;
}

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const arredondar = (n: number) => Math.round(n * 100) / 100;
const subtotal = (i: Item) => arredondar(i.quantidade * i.preco);

export default function NovoPedidoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);
  const [erros, setErros] = useState<{ cliente?: string; itens?: string; produto?: string }>({});

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [itens, setItens] = useState<Item[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("*").order("nome").returns<Cliente[]>(),
      supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome")
        .returns<Produto[]>(),
    ]).then(([c, p]) => {
      const erro = c.error ?? p.error;
      if (erro) notificarErro(erro, "Erro ao carregar clientes e produtos");
      setErroCarga(!!erro);
      setClientes(c.data ?? []);
      setProdutos(p.data ?? []);
      setCarregando(false);
    });
  }, []);

  const total = useMemo(
    () => arredondar(itens.reduce((acc, i) => acc + subtotal(i), 0)),
    [itens]
  );

  function adicionar() {
    const qtd = Math.floor(quantidade);
    if (!produto) return setErros((e) => ({ ...e, produto: "Escolha um produto." }));
    if (!(qtd >= 1))
      return setErros((e) => ({ ...e, produto: "A quantidade mínima é 1." }));
    setErros((e) => ({ ...e, produto: undefined, itens: undefined }));

    setItens((lista) => {
      const existe = lista.some((i) => i.produto.id === produto.id);
      return existe
        ? lista.map((i) =>
            i.produto.id === produto.id
              ? { ...i, quantidade: i.quantidade + qtd }
              : i
          )
        : [...lista, { produto, quantidade: qtd, preco: Number(produto.preco_unitario) }];
    });
    setProduto(null);
    setQuantidade(1);
  }

  const alterarQuantidade = (id: string, valor: number) =>
    setItens((lista) =>
      lista.map((i) =>
        i.produto.id === id
          ? { ...i, quantidade: Math.max(1, Math.floor(valor) || 1) }
          : i
      )
    );

  const remover = (id: string) =>
    setItens((lista) => lista.filter((i) => i.produto.id !== id));

  async function salvar() {
    const e = {
      cliente: cliente ? undefined : "Selecione um cliente.",
      itens: itens.length > 0 ? undefined : "Adicione pelo menos um item.",
    };
    setErros(e);
    if (!cliente || e.itens) return;

    setSalvando(true);
    try {
      // a) pedido: sem valor_total (calculado pelo banco)
      const novoPedido: PedidoInsert = {
        cliente_id: cliente.id,
        status: "orcamento",
        observacoes: observacoes.trim() || null,
      };
      const { data: pedido, error: erroPedido } = await supabase
        .from("pedidos")
        .insert(novoPedido)
        .select("id")
        .single<Pick<Pedido, "id">>();
      if (erroPedido) {
        notificarErro(erroPedido, "Não foi possível criar o pedido");
        return;
      }

      // b) itens: sem subtotal (calculado pelo banco)
      const linhas: ItemPedidoInsert[] = itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto.id,
        quantidade: i.quantidade,
        preco_unitario: i.preco,
      }));
      const { error: erroItens } = await supabase
        .from("itens_pedido")
        .insert(linhas);

      if (erroItens) {
        // c) não deixa pedido vazio
        const { error: erroLimpeza } = await supabase
          .from("pedidos")
          .delete()
          .eq("id", pedido.id);
        toast.error(
          erroLimpeza
            ? `Erro ao salvar os itens (${mensagemErro(erroItens)}) e o pedido ${pedido.id} não pôde ser removido: ${mensagemErro(erroLimpeza)}`
            : `Não foi possível salvar os itens: ${mensagemErro(erroItens)}`
        );
        return;
      }

      // d) valor oficial calculado pelo banco
      const { data: oficial } = await supabase
        .from("pedidos")
        .select("valor_total")
        .eq("id", pedido.id)
        .single<Pick<Pedido, "valor_total">>();
      toast.success("Orçamento salvo.", {
        description: oficial
          ? `Valor total: ${formatarMoeda(Number(oficial.valor_total))}`
          : undefined,
      });
      router.push(`/pedidos/${pedido.id}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader titulo="Novo Pedido" descricao="Monte um orçamento para o cliente." />

      {erroCarga && (
        <p className="text-sm text-destructive">
          Não foi possível carregar clientes e produtos. Recarregue a página.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <Selecionador
              id="cliente"
              itens={clientes}
              valor={cliente}
              onChange={(c) => {
                setCliente(c);
                if (c) setErros((e) => ({ ...e, cliente: undefined }));
              }}
              texto={(c) => c.nome}
              filtro={(c, busca) => {
                const q = normalizar(busca.trim());
                const d = apenasDigitos(busca);
                return (
                  normalizar(c.nome).includes(q) ||
                  (d.length > 0 && apenasDigitos(c.telefone ?? "").includes(d))
                );
              }}
              renderItem={(c) => (
                <span>
                  {c.nome}
                  {c.telefone && (
                    <span className="ml-2 text-muted-foreground">{c.telefone}</span>
                  )}
                </span>
              )}
              placeholder={
                carregando ? "Carregando clientes..." : "Buscar cliente por nome ou telefone"
              }
              vazio="Nenhum cliente encontrado."
            />
            {erros.cliente && (
              <p className="mt-1.5 text-sm text-destructive">{erros.cliente}</p>
            )}
          </div>
          <NovoClienteDialog
            rotulo="Cadastrar novo cliente"
            variante="outline"
            onCriado={(c) => {
              setClientes((l) =>
                [...l, c].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
              );
              setCliente(c);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
            Itens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="produto">Produto</Label>
              <Selecionador
                id="produto"
                itens={produtos}
                valor={produto}
                onChange={(p) => {
                  setProduto(p);
                  if (p) setErros((e) => ({ ...e, produto: undefined }));
                }}
                texto={(p) => `${p.nome} — ${formatarMoeda(Number(p.preco_unitario))}`}
                filtro={(p, busca) =>
                  normalizar(`${p.nome} ${p.categoria}`).includes(
                    normalizar(busca.trim())
                  )
                }
                renderItem={(p) => (
                  <span className="flex w-full justify-between gap-4">
                    <span>{p.nome}</span>
                    <span className="text-muted-foreground">
                      {formatarMoeda(Number(p.preco_unitario))}
                    </span>
                  </span>
                )}
                placeholder={carregando ? "Carregando produtos..." : "Buscar produto"}
                vazio="Nenhum produto encontrado."
              />
              {erros.produto && (
                <p className="text-sm text-destructive">{erros.produto}</p>
              )}
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min={1}
                step={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              />
            </div>
            <Button type="button" onClick={adicionar}>
              Adicionar
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-28">Quantidade</TableHead>
                <TableHead className="text-right">Preço unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EstadoVazio
                      icone={ShoppingCart}
                      titulo="Nenhum item adicionado"
                      descricao="Escolha um produto e clique em “Adicionar”."
                    />
                  </TableCell>
                </TableRow>
              )}
              {itens.map((i) => (
                <TableRow key={i.produto.id}>
                  <TableCell className="font-medium">{i.produto.nome}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={i.quantidade}
                      aria-label={`Quantidade de ${i.produto.nome}`}
                      onChange={(e) =>
                        alterarQuantidade(i.produto.id, Number(e.target.value))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoeda(i.preco)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatarMoeda(subtotal(i))}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${i.produto.nome}`}
                      onClick={() => remover(i.produto.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {erros.itens && (
            <p className="text-sm text-destructive">{erros.itens}</p>
          )}
          <div className="flex items-center justify-end gap-4 border-t pt-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-3xl font-semibold tracking-tight text-primary tabular-nums">
              {formatarMoeda(total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: portão eletrônico antigo, verificar compatibilidade"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" size="lg" className="h-11 px-6" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar como orçamento"}
        </Button>
      </div>
    </div>
  );
}
