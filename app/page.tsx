import { redirect } from "next/navigation";

// La raíz lleva al panel. El middleware ya envía a /login a quien no
// tenga sesión antes de llegar aquí.
export default function RootPage() {
  redirect("/dashboard");
}
