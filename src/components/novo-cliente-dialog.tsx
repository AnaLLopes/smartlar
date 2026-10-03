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
import { supabase } from "@/lib/supabase";
import { mascararTelefone, telefoneValido } from "@/lib/telefone";
import type { Cliente, ClienteInsert } from "@/types/database";

type Erros = Partial<Record<"nome" | "telefone" | "email" | "endereco", string>>;

const VAZIO = { nome: "", telefone: "", email: "", endereco: "" };

export function NovoClienteDialog({
  onCriado,
  rotulo = "Novo cliente",
  variante = "default",
}: {
  onCriado: (cliente: Cliente) => void;
  rotulo?: string;
  variante?: React.ComponentProps<typeof Button>["variant"];
}) {
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

  const campo = (k: keyof typeof VAZIO, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validar(): Erros {
    const e: Erros = {};
    if (!form.nome.trim()) e.nome = "Informe o nome.";
    if (!form.telefone.trim()) e.telefone = "Informe o telefone.";
    else if (!telefoneValido(form.telefone))
      e.telefone = "Telefone inválido. Use DDD + número, ex.: (11) 91234-5678.";
    if (!form.endereco.trim()) e.endereco = "Informe o endereço.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      e.email = "E-mail inválido.";
    return e;
  }

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validar();
    setErros(e);
    if (Object.keys(e).length > 0) return;

    const payload: ClienteInsert = {
      nome: form.nome.trim(),
      telefone: form.telefone,
      email: form.email.trim() || null,
      endereco: form.endereco.trim(),
    };
    setSalvando(true);
    const { data, error } = await supabase
      .from("clientes")
      .insert(payload)
      .select()
      .single<Cliente>();
    setSalvando(false);

    if (error) {
      notificarErro(error, "Não foi possível cadastrar o cliente");
      return;
    }
    toast.success("Cliente cadastrado.");
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
      <DialogTrigger render={<Button type="button" variant={variante} />}>
        <Plus className="size-4" />
        {rotulo}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Nome, telefone e endereço são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => campo("nome", e.target.value)}
              aria-invalid={!!erros.nome}
            />
            {erros.nome && <p className="text-sm text-destructive">{erros.nome}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input
              id="telefone"
              inputMode="tel"
              placeholder="(11) 91234-5678"
              value={form.telefone}
              onChange={(e) => campo("telefone", mascararTelefone(e.target.value))}
              aria-invalid={!!erros.telefone}
            />
            {erros.telefone && (
              <p className="text-sm text-destructive">{erros.telefone}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => campo("email", e.target.value)}
              aria-invalid={!!erros.email}
            />
            {erros.email && <p className="text-sm text-destructive">{erros.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={form.endereco}
              onChange={(e) => campo("endereco", e.target.value)}
              aria-invalid={!!erros.endereco}
            />
            {erros.endereco && (
              <p className="text-sm text-destructive">{erros.endereco}</p>
            )}
          </div>
          <Button type="submit" disabled={salvando} className="w-full">
            {salvando ? "Salvando..." : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
