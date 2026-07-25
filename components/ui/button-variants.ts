import { cva, type VariantProps } from "class-variance-authority";

/**
 * Variantes del botón, en un módulo sin "use client" para que también
 * puedan usarse en Componentes de Servidor (p. ej. estilar un <Link>).
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-field text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-contrast hover:bg-accent-hover shadow-soft hover:shadow-card",
        secondary:
          "bg-elevated text-fg border border-line hover:border-accent/60",
        outline:
          "border border-line text-fg hover:bg-elevated hover:border-accent/60",
        ghost: "text-muted hover:bg-elevated hover:text-fg",
        danger: "bg-danger text-white hover:opacity-90 shadow-soft",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
