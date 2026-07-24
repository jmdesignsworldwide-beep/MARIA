import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Catálogo",
};

export default function Page() {
  return <ComingSoon href="/catalogo" />;
}
