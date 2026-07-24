import {
  LayoutDashboard,
  FileText,
  ReceiptText,
  ShoppingCart,
  HandCoins,
  Wallet,
  Users,
  Package,
  BarChart3,
  TrendingUp,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Tanda en la que se construye el módulo (para el estado "próximamente"). */
  tanda: number;
  descripcion: string;
};

export type NavGroup = {
  titulo: string;
  items: NavItem[];
};

/** Estructura de navegación de los 11 módulos, agrupada. */
export const navGroups: NavGroup[] = [
  {
    titulo: "General",
    items: [
      {
        label: "Panel",
        href: "/dashboard",
        icon: LayoutDashboard,
        tanda: 11,
        descripcion: "KPIs, gráficos y actividad del negocio.",
      },
    ],
  },
  {
    titulo: "Ventas",
    items: [
      {
        label: "Cotizaciones",
        href: "/cotizaciones",
        icon: FileText,
        tanda: 5,
        descripcion: "Cotizaciones profesionales y su conversión a factura.",
      },
      {
        label: "Facturas",
        href: "/facturas",
        icon: ReceiptText,
        tanda: 6,
        descripcion: "Facturación con costo por línea y margen en vivo.",
      },
      {
        label: "Cobros",
        href: "/cobros",
        icon: HandCoins,
        tanda: 9,
        descripcion: "Pagos, abonos y cuentas por cobrar.",
      },
    ],
  },
  {
    titulo: "Operación",
    items: [
      {
        label: "Compras",
        href: "/compras",
        icon: ShoppingCart,
        tanda: 8,
        descripcion: "Costos de compra a suplidores por operación.",
      },
      {
        label: "Gastos",
        href: "/gastos",
        icon: Wallet,
        tanda: 10,
        descripcion: "Gastos operativos del negocio por categoría.",
      },
      {
        label: "Clientes",
        href: "/clientes",
        icon: Users,
        tanda: 4,
        descripcion: "CRM ligero con historial y rentabilidad por cliente.",
      },
      {
        label: "Catálogo",
        href: "/catalogo",
        icon: Package,
        tanda: 4,
        descripcion: "Productos y servicios recurrentes con precio y costo.",
      },
    ],
  },
  {
    titulo: "Análisis",
    items: [
      {
        label: "Finanzas",
        href: "/finanzas",
        icon: TrendingUp,
        tanda: 15,
        descripcion: "Flujo de caja, resultados, proyección y rentabilidad.",
      },
      {
        label: "Reportes",
        href: "/reportes",
        icon: BarChart3,
        tanda: 11,
        descripcion: "Estado de resultados y libro de movimientos.",
      },
      {
        label: "Bitácora",
        href: "/bitacora",
        icon: ScrollText,
        tanda: 14,
        descripcion: "Auditoría inviolable de toda acción.",
      },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      {
        label: "Ajustes",
        href: "/ajustes",
        icon: Settings,
        tanda: 13,
        descripcion: "Datos de empresa, numeración, ITBIS y accesos demo.",
      },
    ],
  },
];

/** Lista plana de todos los ítems de navegación. */
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
