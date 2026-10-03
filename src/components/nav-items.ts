import {
  CalendarDays,
  LayoutDashboard,
  ListOrdered,
  Package,
  PlusCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/pedidos/novo", label: "Novo Pedido", icon: PlusCircle },
  { href: "/pedidos", label: "Pedidos", icon: ListOrdered },
  { href: "/agenda", label: "Agenda dos Técnicos", icon: CalendarDays },
];
