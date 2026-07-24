/**
 * Marca del proveedor del software (quien vende el sistema).
 * Distinta de la empresa que factura (esa se configura en Ajustes).
 * Aparece de forma discreta en el pie de los PDFs y en metadatos.
 */
export const MARCA = {
  nombre: "JM Nexus Designs",
  email: "jm.nexus.designs@gmail.com",
  whatsapp: "849-442-1919",
  whatsappUrl: "https://wa.me/18494421919",
  instagram: "@jm.nexus.designs",
  instagramUrl: "https://instagram.com/jm.nexus.designs",
} as const;

/** Línea de pie compacta para documentos. */
export const MARCA_PIE = `Diseñado por ${MARCA.nombre} · ${MARCA.email} · WhatsApp ${MARCA.whatsapp} · ${MARCA.instagram}`;
