"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarCheck, CalendarX2, MapPin, Phone, UserRound, X } from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { MudarStatusDialog } from "@/components/mudar-status-dialog";
import { PageHeader } from "@/components/page-header";
import { SelectNativo } from "@/components/select-nativo";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notificarErro } from "@/lib/erros";
import { FUSO } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Cliente, Pedido, StatusPedido, Tecnico } from "@/types/database";

type Instalacao = Pedido & {
  cliente: Pick<Cliente, "nome" | "endereco" | "telefone"> | null;
};

const chaveDia = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(d); // YYYY-MM-DD

const hora = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
    timeZone: FUSO,
  }).format(new Date(iso));

function rotuloDia(chave: string, hoje: string, amanha: string) {
  if (chave === hoje) return "Hoje";
  if (chave === amanha) return "Amanhã";
  const [a, m, d] = chave.split("-").map(Number);
  const txt = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(a, m - 1, d)));
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export default function AgendaPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicoId, setTecnicoId] = useState("");
  const [dados, setDados] = useState<{
    tecnicoId: string;
    versao: number;
    itens: Instalacao[];
  } | null>(null);
  const [versao, setVersao] = useState(0);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [erro, setErro] = useState(false);
  const [concluindo, setConcluindo] = useState<Instalacao | null>(null);
  const [emAcao, setEmAcao] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("tecnicos")
      .select("*")
      .order("nome")
      .returns<Tecnico[]>()
      .then(({ data, error }) => {
        if (error) notificarErro(error, "Erro ao carregar técnicos");
        setTecnicos(data ?? []);
      });
  }, []);

  useEffect(() => {
    if (!tecnicoId) return;
    let cancelado = false;
    supabase
      .from("pedidos")
      .select("*, cliente:clientes(nome, endereco, telefone)")
      .eq("tecnico_id", tecnicoId)
      .in("status", ["agendado", "em_andamento"])
      .order("data_instalacao", { ascending: true })
      .returns<Instalacao[]>()
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) notificarErro(error, "Erro ao carregar a agenda");
        setErro(!!error);
        setDados({ tecnicoId, versao, itens: data ?? [] });
      });
    return () => {
      cancelado = true;
    };
  }, [tecnicoId, versao]);

  const carregando =
    !!tecnicoId && (dados?.tecnicoId !== tecnicoId || dados.versao !== versao);
  // Mantém a lista na tela durante o recarregamento após uma ação.
  const itens = useMemo(
    () => (dados && dados.tecnicoId === tecnicoId ? dados.itens : []),
    [dados, tecnicoId]
  );

  const periodoInvalido = !!de && !!ate && de > ate;
  const filtrando = !!de || !!ate;

  const { grupos, hoje, amanha } = useMemo(() => {
    const agora = new Date();
    const hoje = chaveDia(agora);
    const amanha = chaveDia(new Date(agora.getTime() + 24 * 60 * 60 * 1000));
    const mapa = new Map<string, Instalacao[]>();
    for (const i of itens) {
      if (!i.data_instalacao) continue;
      const k = chaveDia(new Date(i.data_instalacao));
      // Compara só o dia (YYYY-MM-DD, fuso de São Paulo), com limites inclusivos.
      if ((de && k < de) || (ate && k > ate)) continue;
      mapa.set(k, [...(mapa.get(k) ?? []), i]);
    }
    return { grupos: [...mapa.entries()], hoje, amanha };
  }, [itens, de, ate]);

  async function iniciar(i: Instalacao) {
    setEmAcao(i.id);
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "em_andamento" satisfies StatusPedido })
      .eq("id", i.id);
    setEmAcao(null);
    if (error) return notificarErro(error);
    toast.success("Instalação iniciada.");
    setVersao((v) => v + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Agenda dos Técnicos"
        descricao="Instalações agendadas e em andamento por técnico."
      />

      <div className="mb-6 max-w-sm space-y-1.5">
        <Label htmlFor="tecnico">Técnico</Label>
        <SelectNativo
          id="tecnico"
          value={tecnicoId}
          onChange={(e) => setTecnicoId(e.target.value)}
        >
          <option value="">Selecione um técnico...</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </SelectNativo>
      </div>

      {tecnicoId && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="de">De</Label>
            <Input
              id="de"
              type="date"
              value={de}
              max={ate || undefined}
              onChange={(e) => setDe(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ate">Até</Label>
            <Input
              id="ate"
              type="date"
              value={ate}
              min={de || undefined}
              onChange={(e) => setAte(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const d = chaveDia(new Date());
                setDe(d);
                setAte(d);
              }}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const agora = new Date();
                setDe(chaveDia(agora));
                setAte(chaveDia(new Date(agora.getTime() + 6 * 86400000)));
              }}
            >
              Próximos 7 dias
            </Button>
            {filtrando && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDe("");
                  setAte("");
                }}
              >
                <X className="size-4" />
                Limpar
              </Button>
            )}
          </div>
          {periodoInvalido && (
            <p className="w-full text-sm text-destructive">
              A data inicial não pode ser maior que a final.
            </p>
          )}
        </div>
      )}

      {erro && (
        <p className="mb-4 text-sm text-destructive">
          Não foi possível carregar a agenda. Tente novamente.
        </p>
      )}
      {!tecnicoId && (
        <Card>
          <EstadoVazio
            icone={UserRound}
            titulo="Selecione um técnico"
            descricao="A agenda de instalações aparece aqui."
          />
        </Card>
      )}
      {carregando && dados?.tecnicoId !== tecnicoId && (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      )}
      {tecnicoId && !carregando && !erro && !periodoInvalido && grupos.length === 0 && (
        <Card>
          <EstadoVazio
            icone={CalendarX2}
            titulo={
              filtrando
                ? "Nenhuma instalação neste período"
                : "Nenhuma instalação para este técnico"
            }
            descricao={
              filtrando
                ? "Ajuste ou limpe o filtro de datas."
                : "Não há pedidos agendados ou em andamento."
            }
          />
        </Card>
      )}

      <div className="space-y-8">
        {grupos.map(([dia, lista]) => (
          <section key={dia}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CalendarCheck className="size-5 text-primary" />
              {rotuloDia(dia, hoje, amanha)}
            </h2>
            <div className="space-y-3">
              {lista.map((i) => (
                <Card key={i.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-accent px-2.5 py-1 text-sm font-semibold text-accent-foreground tabular-nums">
                          {hora(i.data_instalacao!)}
                        </span>
                        <StatusBadge status={i.status} />
                      </div>
                      <Link
                        href={`/pedidos/${i.id}`}
                        className="block font-medium hover:underline"
                      >
                        {i.cliente?.nome ?? "—"}
                      </Link>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {i.cliente?.endereco ?? "—"}
                      </p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="size-3.5 shrink-0" />
                        {i.cliente?.telefone ?? "—"}
                      </p>
                    </div>
                    {i.status === "agendado" && (
                      <Button
                        disabled={emAcao === i.id}
                        onClick={() => iniciar(i)}
                      >
                        Iniciar
                      </Button>
                    )}
                    {i.status === "em_andamento" && (
                      <Button onClick={() => setConcluindo(i)}>Concluir</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Reaproveita o modal de Pedidos: exige forma de pagamento se faltar. */}
      {concluindo && (
        <MudarStatusDialog
          pedido={concluindo}
          destino="concluido"
          onFechar={() => setConcluindo(null)}
          onConcluido={() => {
            setConcluindo(null);
            setVersao((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
