// Respuestas reales de Biller test (2026-10-30, empresa de prueba PEPITO 12),
// recortadas. Los vacíos llegan como [] porque Biller arma el JSON desde XML.
export const eFacturaRow = {
  id: 445329, tipo_comprobante: 111, serie: "MF", numero: 672167, sucursal: 928,
  numero_interno: "PROBE-OCT-1", moneda: "UYU", numero_orden: "OC-1", total: "14640.00",
  estado: "Pendiente DGI", adenda: "Servicio de octubre",
  cliente: {
    id: 54109, tipo_documento: "RUT", documento: "219667740019", razon_social: "DGI RUC PRUEBA CEDE", nombre_fantasia: "",
    sucursal: { id: 60757, direccion: "FERNANDEZ CRESPO AVDA. DANIEL 1534", ciudad: "Montevideo", departamento: "Montevideo", pais: "UY" },
  },
  fecha_creacion: "2026-10-30 11:57:05", fecha_emision: "2026-10-15", fecha_vencimiento: "2026-11-15",
  cae: { numero: "90275401928", serie: "MF", inicio: 1, fin: 9999999, fecha_expiracion: "2028-10-30" },
};

const item = (concepto: string, precio: string) => ({
  id: 741472, codigo: null, codigo_ean: [], codigo_dun: [], cantidad: "1.000", concepto, descripcion: [],
  precio, indicador_facturacion: 3, impuesto_tasa: "0.220", descuento_tipo: "$", descuento_cantidad: "0.000",
  recargo_tipo: "$", recargo_cantidad: "0.000", indicador_agente_responsable: [], retenciones_percepciones: [],
});

const ciClient = {
  id: 54110, tipo_documento: "CI", documento: "47395795", razon_social: "", nombre_fantasia: "Cliente Prueba",
  sucursal: { id: 60758, direccion: "", ciudad: "", departamento: "", pais: "UY" },
};

export const eTicketDetail = {
  id: 445330, tipo_comprobante: 101, serie: "MT", numero: 963088, sucursal: 928, numero_interno: "PROBE-OCT-2",
  moneda: "UYU", numero_compra: "OC-2", items: [item("Limpieza de hogar - octubre 2026", "5400.000000")],
  total: "6588.00", estado: "Envío no corresponde", cliente: ciClient, referencias: [],
  referenciado_por: [{ id: 445331, tipo_comprobante: 102, serie: "MA", numero: 120423, fecha_emision: "2026-10-30" }],
  adenda: null, fecha_creacion: "2026-10-30 11:57:38", fecha_emision: "2026-10-20", fecha_vencimiento: null,
};

export const creditNoteDetail = {
  ...eTicketDetail, id: 445331, tipo_comprobante: 102, serie: "MA", numero: 120423, numero_interno: null,
  referencias: [{ id: 445330, tipo_comprobante: 101, serie: "MT", numero: 963088, fecha_emision: "2026-10-20" }],
  referenciado_por: [], fecha_creacion: "2026-10-30 11:57:42", fecha_emision: "2026-10-30",
};

export const eFacturaDetail = {
  ...eFacturaRow, numero_compra: "OC-1", referencias: [], referenciado_por: [],
  items: [item("Limpieza de oficina - octubre 2026", "12000.000000")],
};

const withoutDetail = ({ items, referencias, referenciado_por, ...row }: Record<string, unknown>) => {
  void items; void referencias; void referenciado_por;
  return row;
};

export const listRows = [eFacturaRow, withoutDetail(eTicketDetail), withoutDetail(creditNoteDetail)];
export const detailsById = new Map<number, unknown>([
  [445329, eFacturaDetail],
  [445330, eTicketDetail],
  [445331, creditNoteDetail],
]);
