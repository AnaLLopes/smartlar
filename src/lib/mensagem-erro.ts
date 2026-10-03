export interface ErroSupabase {
  message: string;
  code?: string;
}

// Traduz erros comuns do Postgres/PostgREST. Mensagens levantadas por
// triggers do banco (ex.: transição de status inválida) passam como estão.
export function mensagemErro(error: ErroSupabase): string {
  if (/failed to fetch|networkerror|load failed/i.test(error.message))
    return "Sem conexão com o servidor. Verifique a internet e tente novamente.";
  switch (error.code) {
    case "42501":
      return "Sem permissão para esta operação. Verifique as políticas de acesso do banco.";
    case "23505":
      return "Já existe um registro com esses dados.";
    case "23503":
      return "Este registro está vinculado a outros dados.";
    case "23502":
      return "Há um campo obrigatório não preenchido.";
    case "23514":
      return "Algum valor informado não é permitido pelo banco.";
    case "PGRST301":
    case "PGRST303":
      return "Chave de acesso inválida ou expirada.";
  }
  return error.message;
}
