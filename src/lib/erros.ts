import { toast } from "sonner";
import { mensagemErro, type ErroSupabase } from "@/lib/mensagem-erro";

export function notificarErro(error: ErroSupabase, contexto?: string) {
  const msg = mensagemErro(error);
  toast.error(contexto ? `${contexto}: ${msg}` : msg);
}
