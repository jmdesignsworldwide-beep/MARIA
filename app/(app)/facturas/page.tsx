import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Facturas",
};

export default function Page() {
  return <ComingSoon href="/facturas" />;
}
