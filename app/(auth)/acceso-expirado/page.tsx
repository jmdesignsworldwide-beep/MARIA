import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MessageCircle, Mail, AtSign, ArrowLeft } from "lucide-react";
import { MARCA } from "@/lib/brand";

export const metadata: Metadata = { title: "Acceso expirado" };

export default function AccesoExpiradoPage() {
  return (
    <div className="animate-fade-in text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft ring-1 ring-accent/20">
        <Clock className="h-7 w-7 text-accent" aria-hidden />
      </div>

      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
        Tu acceso ha expirado
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
        Tu período de acceso al sistema ha finalizado. Contacta a{" "}
        <span className="font-medium text-fg">{MARCA.nombre}</span> para renovarlo y seguir usándolo.
      </p>

      <div className="mt-6 space-y-2">
        <a
          href={MARCA.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-field bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover"
        >
          <MessageCircle className="h-4 w-4" />
          Escribir por WhatsApp · {MARCA.whatsapp}
        </a>
        <a
          href={`mailto:${MARCA.email}`}
          className="flex items-center justify-center gap-2 rounded-field border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-elevated"
        >
          <Mail className="h-4 w-4" />
          {MARCA.email}
        </a>
        <a
          href={MARCA.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-field border border-line bg-surface px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-elevated"
        >
          <AtSign className="h-4 w-4" />
          {MARCA.instagram}
        </a>
      </div>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
