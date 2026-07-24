/** Resultado estándar de una server action. */
export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};
