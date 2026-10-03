import type { LucideIcon } from "lucide-react";

export function EstadoVazio({
  icone: Icone,
  titulo,
  descricao,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center whitespace-normal">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icone className="size-5" />
      </div>
      <p className="font-medium">{titulo}</p>
      {descricao && (
        <p className="max-w-xs text-sm text-muted-foreground">{descricao}</p>
      )}
    </div>
  );
}
