import Link from "next/link";
import {
  CalendarClock,
  CalendarX2,
  CircleDollarSign,
  FileText,
  Hourglass,
  ShoppingBag,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { EstadoVazio } from "@/components/estado-vazio";
import { PageHeader } from "@/components/page-header";
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
import { carregarDashboard } from "@/lib/dashboard";
import { formatarDataHora, formatarData, formatarMoeda } from "@/lib/format";

export const dynamic = "force-dynamic";

const TONS = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
  verde: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  ambar: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  violeta: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
};

function Indicador({
  titulo,
  valor,
  icone: Icone,
  tom,
}: {
  titulo: string;
  valor: string;
  icone: LucideIcon;
  tom: keyof typeof TONS;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {valor}
          </p>
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONS[tom]}`}
        >
          <Icone className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function LinhaLink({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/pedidos/${id}`} className="block hover:underline">
      {children}
    </Link>
  );
}

export default async function DashboardPage() {
  const d = await carregarDashboard();

  return (
    <div className="space-y-8">
      <PageHeader titulo="Dashboard" descricao="Visão geral da operação." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Pedidos no mês"
          valor={String(d.totalPedidosMes)}
          icone={ShoppingBag}
          tom="indigo"
        />
        <Indicador
          titulo="Faturado no mês"
          valor={formatarMoeda(d.valorFaturadoMes)}
          icone={CircleDollarSign}
          tom="verde"
        />
        <Indicador
          titulo="A receber"
          valor={formatarMoeda(d.valorAReceber)}
          icone={Wallet}
          tom="violeta"
        />
        <Indicador
          titulo="Pendentes de agendamento"
          valor={String(d.pendentesAgendamento)}
          icone={Hourglass}
          tom="ambar"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-primary" />
            Próximas instalações (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Data e hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.proximasInstalacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EstadoVazio
                      icone={CalendarX2}
                      titulo="Nenhuma instalação nos próximos 7 dias"
                      descricao="Pedidos agendados aparecem aqui."
                    />
                  </TableCell>
                </TableRow>
              )}
              {d.proximasInstalacoes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <LinhaLink id={p.id}>{p.cliente?.nome ?? "—"}</LinhaLink>
                  </TableCell>
                  <TableCell>
                    <LinhaLink id={p.id}>{p.cliente?.endereco ?? "—"}</LinhaLink>
                  </TableCell>
                  <TableCell>
                    <LinhaLink id={p.id}>{p.tecnico?.nome ?? "—"}</LinhaLink>
                  </TableCell>
                  <TableCell>
                    <LinhaLink id={p.id}>
                      {p.data_instalacao
                        ? formatarDataHora(p.data_instalacao)
                        : "—"}
                    </LinhaLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" />
            Orçamentos aguardando aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor total</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.orcamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EstadoVazio
                      icone={FileText}
                      titulo="Nenhum orçamento aguardando aprovação"
                      descricao="Novos orçamentos aparecem aqui."
                    />
                  </TableCell>
                </TableRow>
              )}
              {d.orcamentos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <LinhaLink id={p.id}>{p.cliente?.nome ?? "—"}</LinhaLink>
                  </TableCell>
                  <TableCell>
                    <LinhaLink id={p.id}>{formatarMoeda(p.valor_total)}</LinhaLink>
                  </TableCell>
                  <TableCell>
                    <LinhaLink id={p.id}>{formatarData(p.created_at)}</LinhaLink>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <LinhaLink id={p.id}>{p.observacoes ?? "—"}</LinhaLink>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
