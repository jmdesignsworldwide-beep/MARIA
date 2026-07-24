import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Ajustes",
};

export default function Page() {
  return <ComingSoon href="/ajustes" />;
}
