"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notificarErro } from "@/lib/erros";
import { parsePreco } from "@/lib/preco";
import { supabase } from "@/lib/supabase";
import type { Produto, ProdutoInsert } from "@/types/database";

type Erros = Partial<Record<"nome" | "categoria" | "preco", string>>;
const VAZIO = { nome: "", categoria: "", preco: "", descricao: "" };

export function NovoProdutoDialog({
  categorias,
  onCriado,
}: {
  categorias: string[];
  onCriado: (p: Produto) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

  const campo = (k: keyof typeof VAZIO, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Erros = {};
    const preco = parsePreco(form.preco);
    if (!form.nome.trim()) e.nome = "Informe o nome.";
    if (!form.categoria.trim()) e.categoria = "Informe a categoria.";
    if (preco === null) e.preco = "Informe um preço válido.";
    else if (preco < 0) e.preco = "O preço não pode ser negativo.";
    setErros(e);
    if (Object.keys(e).length > 0) return;

    // Reaproveita a grafia de uma categoria existente (ignora caixa).
    const digitada = form.categoria.trim();
    const categoria =
      categorias.find((c) => c.toLowerCase() === digitada.toLowerCase()) ??
      digitada;

    const payload: ProdutoInsert = {
      nome: form.nome.trim(),
      categoria,
      preco_unitario: preco!,
      descricao: form.descricao.trim() || null,
      ativo: true,
    };
    setSalvando(true);
    const { data, error } = await supabase
      .from("produtos")
      .insert(payload)
      .select()
      .single<Produto>();
    setSalvando(false);

    if (error) {
      notificarErro(error, "Não foi possível cadastrar o produto");
      return;
    }
    toast.success("Produto cadastrado.");
    onCriado(data);
    setForm(VAZIO);
    setAberto(false);
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        setAberto(o);
        if (!o) setErros({});
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Novo produto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            Nome, categoria e preço são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="p-nome">Nome *</Label>
            <Input
              id="p-nome"
              value={form.nome}
              onChange={(e) => campo("nome", e.target.value)}
              aria-invalid={!!erros.nome}
            />
            {erros.nome && <p className="text-sm text-destructive">{erros.nome}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-categoria">Categoria *</Label>
            <Input
              id="p-categoria"
              list="categorias-existentes"
              placeholder="Escolha uma existente ou digite uma nova"
              value={form.categoria}
              onChange={(e) => campo("categoria", e.target.value)}
              aria-invalid={!!erros.categoria}
            />
            <datalist id="categorias-existentes">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {erros.categoria && (
              <p className="text-sm text-destructive">{erros.categoria}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-preco">Preço unitário (R$) *</Label>
            <Input
              id="p-preco"
              inputMode="decimal"
              placeholder="0,00"
              value={form.preco}
              onChange={(e) => campo("preco", e.target.value)}
              aria-invalid={!!erros.preco}
            />
            {erros.preco && <p className="text-sm text-destructive">{erros.preco}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-descricao">Descrição</Label>
            <Input
              id="p-descricao"
              value={form.descricao}
              onChange={(e) => campo("descricao", e.target.value)}
            />
          </div>
          <Button type="submit" disabled={salvando} className="w-full">
            {salvando ? "Salvando..." : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditarPrecoDialog({
  produto,
  onFechar,
  onSalvo,
}: {
  produto: Produto | null;
  onFechar: () => void;
  onSalvo: (p: Produto) => void;
}) {
  return (
    <Dialog open={!!produto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        {/* key reinicia o formulário a cada produto aberto */}
        {produto && (
          <FormPreco key={produto.id} produto={produto} onSalvo={onSalvo} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormPreco({
  produto,
  onSalvo,
}: {
  produto: Produto;
  onSalvo: (p: Produto) => void;
}) {
  const [valor, setValor] = useState(
    String(produto.preco_unitario).replace(".", ",")
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    const preco = parsePreco(valor);
    if (preco === null) return setErro("Informe um preço válido.");
    if (preco < 0) return setErro("O preço não pode ser negativo.");
    setErro(null);

    setSalvando(true);
    const { data, error } = await supabase
      .from("produtos")
      .update({ preco_unitario: preco })
      .eq("id", produto.id)
      .select()
      .single<Produto>();
    setSalvando(false);

    if (error) {
      notificarErro(error, "Não foi possível atualizar o preço");
      return;
    }
    toast.success("Preço atualizado.");
    onSalvo(data);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar preço</DialogTitle>
        <DialogDescription>{produto.nome}</DialogDescription>
      </DialogHeader>
      <form onSubmit={salvar} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="e-preco">Preço unitário (R$)</Label>
          <Input
            id="e-preco"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            aria-invalid={!!erro}
            autoFocus
          />
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>
        <Button type="submit" disabled={salvando} className="w-full">
          {salvando ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </>
  );
}
