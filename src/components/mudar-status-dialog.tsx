"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNativo } from "@/components/select-nativo";
import { notificarErro } from "@/lib/erros";
import { PAGAMENTO_LABEL, STATUS_LABEL } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import {
  FORMAS_PAGAMENTO,
  type FormaPagamento,
  type Pedido,
  type StatusPedido,
  type Tecnico,
} from "@/types/database";

// "YYYY-MM-DDTHH:mm" (datetime-local) interpretado como horário de Brasília.
const paraIso = (local: string) => new Date(`${local}:00-03:00`).toISOString();

function paraLocal(iso: string | null) {
  if (!iso) return "";
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
  return p.replace(" ", "T");
}

interface Props {
  pedido: Pedido;
  destino: StatusPedido | null;
  onFechar: () => void;
  onConcluido: () => void;
}

export function MudarStatusDialog(props: Props) {
  const { destino, onFechar } = props;
  return (
    <Dialog open={!!destino} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent>
        {/* key: o formulário reinicia a cada abertura */}
        {destino && <Formulario key={destino} {...props} destino={destino} />}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({
  pedido,
  destino,
  onFechar,
  onConcluido,
}: Props & { destino: StatusPedido }) {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicoId, setTecnicoId] = useState(pedido.tecnico_id ?? "");
  const [dataHora, setDataHora] = useState(paraLocal(pedido.data_instalacao));
  const [pagamento, setPagamento] = useState<FormaPagamento | "">(
    pedido.forma_pagamento ?? ""
  );
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (destino !== "agendado") return;
    supabase
      .from("tecnicos")
      .select("*")
      .eq("ativo", true)
      .order("nome")
      .returns<Tecnico[]>()
      .then(({ data, error }) => {
        if (error) notificarErro(error, "Erro ao carregar técnicos");
        setTecnicos(data ?? []);
      });
  }, [destino]);

  const pedePagamento = destino === "aprovado" || destino === "concluido";
  const pagamentoObrigatorio = destino === "concluido" && !pedido.forma_pagamento;

  async function confirmar() {
    const e: Record<string, string> = {};
    if (destino === "agendado") {
      if (!tecnicoId) e.tecnico = "Selecione o técnico.";
      if (!dataHora) e.data = "Informe a data e a hora da instalação.";
    }
    if (pagamentoObrigatorio && !pagamento)
      e.pagamento = "Informe a forma de pagamento.";
    setErros(e);
    if (Object.keys(e).length > 0) return;

    const alteracoes: Partial<Pedido> = { status: destino };
    if (destino === "agendado") {
      alteracoes.tecnico_id = tecnicoId;
      alteracoes.data_instalacao = paraIso(dataHora);
    }
    if (pedePagamento && pagamento) alteracoes.forma_pagamento = pagamento;

    setSalvando(true);
    const { error } = await supabase
      .from("pedidos")
      .update(alteracoes)
      .eq("id", pedido.id);
    setSalvando(false);

    if (error) {
      notificarErro(error);
      return;
    }
    toast.success(`Pedido ${STATUS_LABEL[destino].toLowerCase()}.`);
    onConcluido();
  }

  return (
    <>
        <DialogHeader>
          <DialogTitle>
            {destino === "cancelado"
              ? "Cancelar pedido"
              : `Alterar status para "${STATUS_LABEL[destino]}"`}
          </DialogTitle>
          <DialogDescription>
            {destino === "cancelado"
              ? "O pedido cancelado não poderá mais ser alterado."
              : "Confirme os dados da mudança de status."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {destino === "agendado" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="tecnico">Técnico *</Label>
                <SelectNativo
                  id="tecnico"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  aria-invalid={!!erros.tecnico}
                >
                  <option value="">Selecione...</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </SelectNativo>
                {erros.tecnico && (
                  <p className="text-sm text-destructive">{erros.tecnico}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data-instalacao">Data e hora da instalação *</Label>
                <Input
                  id="data-instalacao"
                  type="datetime-local"
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  aria-invalid={!!erros.data}
                />
                {erros.data && (
                  <p className="text-sm text-destructive">{erros.data}</p>
                )}
              </div>
            </>
          )}

          {pedePagamento && (
            <div className="space-y-1.5">
              <Label htmlFor="pagamento">
                Forma de pagamento{pagamentoObrigatorio ? " *" : " (opcional)"}
              </Label>
              <SelectNativo
                id="pagamento"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value as FormaPagamento | "")}
                aria-invalid={!!erros.pagamento}
              >
                <option value="">Selecione...</option>
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f} value={f}>
                    {PAGAMENTO_LABEL[f]}
                  </option>
                ))}
              </SelectNativo>
              {erros.pagamento && (
                <p className="text-sm text-destructive">{erros.pagamento}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>
              Voltar
            </Button>
            <Button
              type="button"
              variant={destino === "cancelado" ? "destructive" : "default"}
              onClick={confirmar}
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </div>
    </>
  );
}
