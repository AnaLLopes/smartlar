"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

// Select pesquisável genérico (Combobox do shadcn/Base UI).
export function Selecionador<T extends { id: string }>({
  itens,
  valor,
  onChange,
  texto,
  filtro,
  renderItem,
  placeholder,
  vazio,
  id,
}: {
  itens: T[];
  valor: T | null;
  onChange: (item: T | null) => void;
  /** Texto exibido no campo quando o item está selecionado. */
  texto: (item: T) => string;
  /** Define se o item casa com o que foi digitado. */
  filtro: (item: T, busca: string) => boolean;
  renderItem: (item: T) => React.ReactNode;
  placeholder: string;
  vazio: string;
  id?: string;
}) {
  return (
    <Combobox
      items={itens}
      value={valor}
      onValueChange={(v) => onChange(v as T | null)}
      itemToStringLabel={texto}
      isItemEqualToValue={(a, b) => a.id === b.id}
      filter={(item, busca) => filtro(item as T, busca)}
    >
      <ComboboxInput id={id} placeholder={placeholder} showClear />
      <ComboboxContent>
        <ComboboxEmpty>{vazio}</ComboboxEmpty>
        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={item.id} value={item}>
              {renderItem(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
