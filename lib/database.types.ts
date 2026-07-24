/**
 * Tipos de la base de datos (Tanda 3).
 * Escritos a mano para reflejar el esquema aplicado en Supabase.
 * Formato compatible con `createClient<Database>()` de supabase-js.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------- Enumerados ----------
export type RolUsuario = "admin" | "usuario" | "demo";
export type TipoCliente = "persona" | "empresa";
export type TipoItem = "producto" | "servicio";
export type TipoDocumento = "cotizacion" | "factura";
export type EstadoCotizacion =
  | "borrador"
  | "enviada"
  | "aprobada"
  | "rechazada"
  | "vencida"
  | "convertida";
export type EstadoFactura =
  | "borrador"
  | "emitida"
  | "cobrada_parcial"
  | "cobrada"
  | "vencida"
  | "anulada";
export type MetodoPago = "efectivo" | "transferencia" | "tarjeta" | "cheque";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Timestamps & {
          id: string;
          email: string | null;
          nombre_completo: string | null;
          rol: RolUsuario;
          is_active: boolean;
          access_expires_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          nombre_completo?: string | null;
          rol?: RolUsuario;
          is_active?: boolean;
          access_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nombre_completo?: string | null;
          email?: string | null;
          rol?: RolUsuario;
          is_active?: boolean;
          access_expires_at?: string | null;
        };
        Relationships: [];
      };
      empresa_config: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          nombre: string;
          rnc: string | null;
          direccion: string | null;
          telefono: string | null;
          email: string | null;
          logo_path: string | null;
          firma_path: string | null;
          prefijo_cotizacion: string;
          prefijo_factura: string;
          numero_inicial_cotizacion: number;
          numero_inicial_factura: number;
          itbis_tasa: number;
          itbis_activo: boolean;
          terminos_cotizacion: string | null;
          terminos_factura: string | null;
          cuentas_bancarias: Json;
        };
        Insert: {
          owner_id: string;
          nombre?: string;
          rnc?: string | null;
          direccion?: string | null;
          telefono?: string | null;
          email?: string | null;
          logo_path?: string | null;
          firma_path?: string | null;
          prefijo_cotizacion?: string;
          prefijo_factura?: string;
          numero_inicial_cotizacion?: number;
          numero_inicial_factura?: number;
          itbis_tasa?: number;
          itbis_activo?: boolean;
          terminos_cotizacion?: string | null;
          terminos_factura?: string | null;
          cuentas_bancarias?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["empresa_config"]["Insert"]>;
        Relationships: [];
      };
      clientes: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          nombre: string;
          tipo: TipoCliente;
          rnc_cedula: string | null;
          persona_contacto: string | null;
          telefono: string | null;
          email: string | null;
          direccion: string | null;
          limite_credito: number;
          notas: string | null;
          activo: boolean;
        };
        Insert: {
          owner_id: string;
          nombre: string;
          tipo?: TipoCliente;
          rnc_cedula?: string | null;
          persona_contacto?: string | null;
          telefono?: string | null;
          email?: string | null;
          direccion?: string | null;
          limite_credito?: number;
          notas?: string | null;
          activo?: boolean;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [];
      };
      suplidores: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          nombre: string;
          contacto: string | null;
          telefono: string | null;
          notas: string | null;
          activo: boolean;
        };
        Insert: {
          owner_id: string;
          nombre: string;
          contacto?: string | null;
          telefono?: string | null;
          notas?: string | null;
          activo?: boolean;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suplidores"]["Insert"]>;
        Relationships: [];
      };
      catalogo_items: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          descripcion: string;
          tipo: TipoItem;
          precio_sugerido: number;
          costo_referencial: number;
          unidad: string;
          activo: boolean;
        };
        Insert: {
          owner_id: string;
          descripcion: string;
          tipo?: TipoItem;
          precio_sugerido?: number;
          costo_referencial?: number;
          unidad?: string;
          activo?: boolean;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["catalogo_items"]["Insert"]>;
        Relationships: [];
      };
      categorias_gasto: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          nombre: string;
        };
        Insert: {
          owner_id: string;
          nombre: string;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categorias_gasto"]["Insert"]>;
        Relationships: [];
      };
      documento_secuencias: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          tipo: TipoDocumento;
          anio: number;
          ultimo_numero: number;
        };
        Insert: {
          owner_id: string;
          tipo: TipoDocumento;
          anio: number;
          ultimo_numero?: number;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documento_secuencias"]["Insert"]>;
        Relationships: [];
      };
      cotizaciones: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          numero: string;
          cliente_id: string | null;
          fecha: string;
          validez_dias: number;
          fecha_validez: string | null;
          estado: EstadoCotizacion;
          itbis_tasa: number;
          itbis_activo: boolean;
          subtotal: number;
          itbis: number;
          total: number;
          notas: string | null;
          condiciones: string | null;
          factura_id: string | null;
        };
        Insert: {
          owner_id: string;
          numero?: string;
          cliente_id?: string | null;
          fecha?: string;
          validez_dias?: number;
          estado?: EstadoCotizacion;
          itbis_tasa?: number;
          itbis_activo?: boolean;
          notas?: string | null;
          condiciones?: string | null;
          factura_id?: string | null;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cotizaciones"]["Insert"]>;
        Relationships: [];
      };
      facturas: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          numero: string;
          cliente_id: string | null;
          cotizacion_id: string | null;
          fecha: string;
          fecha_vencimiento: string | null;
          estado: EstadoFactura;
          itbis_tasa: number;
          itbis_activo: boolean;
          descuento: number;
          subtotal: number;
          itbis: number;
          total: number;
          costo_total: number;
          utilidad: number;
          margen_pct: number;
          monto_cobrado: number;
          saldo: number;
          notas: string | null;
          motivo_anulacion: string | null;
        };
        Insert: {
          owner_id: string;
          numero?: string;
          cliente_id?: string | null;
          cotizacion_id?: string | null;
          fecha?: string;
          fecha_vencimiento?: string | null;
          estado?: EstadoFactura;
          itbis_tasa?: number;
          itbis_activo?: boolean;
          descuento?: number;
          notas?: string | null;
          motivo_anulacion?: string | null;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["facturas"]["Insert"]>;
        Relationships: [];
      };
      cotizacion_lineas: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          cotizacion_id: string;
          catalogo_item_id: string | null;
          descripcion: string;
          cantidad: number;
          precio_unitario: number;
          itbis_aplicable: boolean;
          subtotal_linea: number;
          orden: number;
        };
        Insert: {
          owner_id: string;
          cotizacion_id: string;
          catalogo_item_id?: string | null;
          descripcion: string;
          cantidad?: number;
          precio_unitario?: number;
          itbis_aplicable?: boolean;
          orden?: number;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cotizacion_lineas"]["Insert"]>;
        Relationships: [];
      };
      factura_lineas: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          factura_id: string;
          catalogo_item_id: string | null;
          suplidor_id: string | null;
          descripcion: string;
          cantidad: number;
          precio_unitario: number;
          costo_unitario: number;
          itbis_aplicable: boolean;
          subtotal_linea: number;
          utilidad_linea: number;
          orden: number;
        };
        Insert: {
          owner_id: string;
          factura_id: string;
          catalogo_item_id?: string | null;
          suplidor_id?: string | null;
          descripcion: string;
          cantidad?: number;
          precio_unitario?: number;
          costo_unitario?: number;
          itbis_aplicable?: boolean;
          orden?: number;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["factura_lineas"]["Insert"]>;
        Relationships: [];
      };
      compras: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          factura_id: string | null;
          suplidor_id: string | null;
          descripcion: string | null;
          monto: number;
          fecha: string;
          metodo_pago: MetodoPago;
          numero_comprobante: string | null;
          recibo_path: string | null;
        };
        Insert: {
          owner_id: string;
          factura_id?: string | null;
          suplidor_id?: string | null;
          descripcion?: string | null;
          monto?: number;
          fecha?: string;
          metodo_pago?: MetodoPago;
          numero_comprobante?: string | null;
          recibo_path?: string | null;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["compras"]["Insert"]>;
        Relationships: [];
      };
      pagos: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          factura_id: string;
          monto: number;
          fecha: string;
          metodo_pago: MetodoPago;
          referencia: string | null;
          notas: string | null;
        };
        Insert: {
          owner_id: string;
          factura_id: string;
          monto?: number;
          fecha?: string;
          metodo_pago?: MetodoPago;
          referencia?: string | null;
          notas?: string | null;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pagos"]["Insert"]>;
        Relationships: [];
      };
      gastos: {
        Row: Timestamps & {
          id: string;
          owner_id: string;
          categoria_id: string | null;
          descripcion: string;
          monto: number;
          fecha: string;
          metodo_pago: MetodoPago;
          comprobante_path: string | null;
          es_recurrente: boolean;
        };
        Insert: {
          owner_id: string;
          categoria_id?: string | null;
          descripcion: string;
          monto?: number;
          fecha?: string;
          metodo_pago?: MetodoPago;
          comprobante_path?: string | null;
          es_recurrente?: boolean;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gastos"]["Insert"]>;
        Relationships: [];
      };
      bitacora: {
        Row: {
          id: string;
          owner_id: string;
          usuario_email: string | null;
          accion: string;
          entidad: string;
          entidad_id: string | null;
          descripcion: string | null;
          datos_antes: Json | null;
          datos_despues: Json | null;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          usuario_email?: string | null;
          accion: string;
          entidad: string;
          entidad_id?: string | null;
          datos_antes?: Json | null;
          datos_despues?: Json | null;
          ip?: string | null;
          id?: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      rol_usuario: RolUsuario;
      tipo_cliente: TipoCliente;
      tipo_item: TipoItem;
      tipo_documento: TipoDocumento;
      estado_cotizacion: EstadoCotizacion;
      estado_factura: EstadoFactura;
      metodo_pago: MetodoPago;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ---------- Atajos de tipos por tabla ----------
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Cliente = Tables<"clientes">;
export type Suplidor = Tables<"suplidores">;
export type CatalogoItem = Tables<"catalogo_items">;
export type Cotizacion = Tables<"cotizaciones">;
export type CotizacionLinea = Tables<"cotizacion_lineas">;
export type Factura = Tables<"facturas">;
export type FacturaLinea = Tables<"factura_lineas">;
export type Compra = Tables<"compras">;
export type Pago = Tables<"pagos">;
export type Gasto = Tables<"gastos">;
export type CategoriaGasto = Tables<"categorias_gasto">;
export type EmpresaConfig = Tables<"empresa_config">;
export type Profile = Tables<"profiles">;
export type Bitacora = Tables<"bitacora">;
