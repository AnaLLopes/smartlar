export function PageHeader({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
      {descricao && (
        <p className="mt-1.5 text-muted-foreground">{descricao}</p>
      )}
    </div>
  );
}
