"use client";

import { Button } from "@/components/ui/button";

export default function Erro({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        {error.message ||
          "Não foi possível carregar esta página. Tente novamente."}
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
