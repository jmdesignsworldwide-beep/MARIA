import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Compras",
};

export default function Page() {
  return <ComingSoon href="/compras" />;
}
