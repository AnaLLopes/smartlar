import { STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatusPedido } from "@/types/database";

const COR: Record<StatusPedido, { chip: string; ponto: string }> = {
  orcamento: {
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    ponto: "bg-slate-400",
  },
  aprovado: {
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    ponto: "bg-sky-500",
  },
  agendado: {
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    ponto: "bg-violet-500",
  },
  em_andamento: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    ponto: "bg-amber-500",
  },
  concluido: {
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    ponto: "bg-emerald-500",
  },
  cancelado: {
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    ponto: "bg-rose-500",
  },
};

export function StatusBadge({ status }: { status: StatusPedido }) {
  const c = COR[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        c.chip
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.ponto)} />
      {STATUS_LABEL[status]}
    </span>
  );
}
