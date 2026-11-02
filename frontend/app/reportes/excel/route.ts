import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";
import { RESPONSABLES } from "@/lib/constantes";
import { obtenerDetalle, obtenerReporte, resolverPeriodo } from "@/lib/reporte";

// Colores de la marca en formato ARGB de Excel.
const NEGRO = "FF0A0D14";
const AZUL = "FF1D4ED8";
const ROJO = "FFE11D2A";
const GRIS = "FFF1F5F9";
const BLANCO = "FFFFFFFF";
const Q = '"Q"#,##0.00;[Red]-"Q"#,##0.00';

// Mismos colores por persona que en la página (lib/constantes.ts).
const COLOR_RESPONSABLE: Record<(typeof RESPONSABLES)[number]["nombre"], string> = {
  Zoel: "FFF87171",
  Darwin: "FFFDE047",
  Mama: "FF4ADE80",
  Joelmir: "FF7DD3FC",
};

const ESTATUS_COLOR: Record<string, string> = {
  Programado: "FFDBEAFE",
  "En ruta": "FFFEF3C7",
  Entregado: "FFBBF7D0",
  Cancelado: "FFE2E8F0",
};

const relleno = (argb: string): ExcelJS.Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const borde: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

// "2026-09-16" -> fecha real de Excel (sin corrimiento de zona horaria).
const aFecha = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};

type Columna = {
  titulo: string;
  ancho: number;
  formato?: string;
  alinear?: "left" | "center" | "right";
};

// Escribe una tabla con encabezado negro, bordes, filtro y fila de total opcional.
function tabla(
  hoja: ExcelJS.Worksheet,
  filaInicio: number,
  columnas: Columna[],
  filas: (string | number | Date)[][],
  total?: { etiqueta: string; columnas: number[] },
) {
  columnas.forEach((c, i) => {
    const col = hoja.getColumn(i + 1);
    col.width = Math.max(col.width ?? 0, c.ancho);
  });

  const encabezado = hoja.getRow(filaInicio);
  columnas.forEach((c, i) => {
    const celda = encabezado.getCell(i + 1);
    celda.value = c.titulo;
    celda.font = { bold: true, color: { argb: BLANCO } };
    celda.fill = relleno(NEGRO);
    celda.alignment = { horizontal: c.alinear ?? "left", vertical: "middle" };
    celda.border = borde;
  });
  encabezado.height = 22;

  filas.forEach((valores, r) => {
    const fila = hoja.getRow(filaInicio + 1 + r);
    valores.forEach((v, i) => {
      const celda = fila.getCell(i + 1);
      celda.value = v;
      celda.border = borde;
      celda.alignment = { horizontal: columnas[i].alinear ?? "left" };
      if (columnas[i].formato) celda.numFmt = columnas[i].formato!;
      if (r % 2 === 1) celda.fill = relleno("FFF8FAFC");
    });
  });

  const ultima = filaInicio + filas.length;
  if (total && filas.length > 0) {
    const fila = hoja.getRow(ultima + 1);
    columnas.forEach((c, i) => {
      const celda = fila.getCell(i + 1);
      celda.fill = relleno(GRIS);
      celda.font = { bold: true };
      celda.border = { ...borde, top: { style: "medium", color: { argb: NEGRO } } };
      celda.alignment = { horizontal: c.alinear ?? "left" };
      if (c.formato) celda.numFmt = c.formato;
    });
    fila.getCell(1).value = total.etiqueta;
    for (const n of total.columnas) {
      const letra = hoja.getColumn(n).letter;
      fila.getCell(n).value = {
        formula: `SUM(${letra}${filaInicio + 1}:${letra}${ultima})`,
      };
    }
  }

  if (filas.length > 0) {
    hoja.autoFilter = {
      from: { row: filaInicio, column: 1 },
      to: { row: ultima, column: columnas.length },
    };
  }
  return ultima + (total ? 1 : 0);
}

function titulo(hoja: ExcelJS.Worksheet, texto: string, subtitulo: string, columnas: number) {
  hoja.mergeCells(1, 1, 1, columnas);
  const t = hoja.getCell(1, 1);
  t.value = texto;
  t.font = { bold: true, size: 14, color: { argb: BLANCO } };
  t.fill = relleno(AZUL);
  t.alignment = { vertical: "middle", horizontal: "center" };
  hoja.getRow(1).height = 26;

  hoja.mergeCells(2, 1, 2, columnas);
  const s = hoja.getCell(2, 1);
  s.value = subtitulo;
  s.font = { italic: true, color: { argb: "FF475569" } };
  s.alignment = { horizontal: "center" };
}

export async function GET(request: NextRequest) {
  const sp = Object.fromEntries(request.nextUrl.searchParams);
  const { periodo } = await resolverPeriodo(sp);
  const [reporte, detalle] = await Promise.all([
    obtenerReporte(periodo),
    obtenerDetalle(periodo),
  ]);
  const { anio, desde, hasta } = periodo;
  const rango = `Año ${anio} · semanas ${desde} a ${hasta}`;

  const libro = new ExcelJS.Workbook();
  libro.creator = "TransVelsa";
  libro.created = new Date();
  libro.calcProperties.fullCalcOnLoad = true;

  // ---- Resumen ----
  const resumen = libro.addWorksheet("Resumen", {
    views: [{ showGridLines: false }],
  });
  resumen.getColumn(1).width = 34;
  resumen.getColumn(2).width = 14;
  resumen.getColumn(3).width = 18;

  try {
    const logo = await readFile(path.join(process.cwd(), "public", "Transveliz.jpeg"));
    const id = libro.addImage({ buffer: logo as unknown as ExcelJS.Buffer, extension: "jpeg" });
    resumen.addImage(id, { tl: { col: 3.2, row: 0 }, ext: { width: 130, height: 130 } });
  } catch {
    // Sin logo el reporte sigue siendo válido.
  }

  resumen.getCell("A1").value = "TRANSVELSA";
  resumen.getCell("A1").font = { bold: true, size: 20, color: { argb: NEGRO } };
  resumen.getCell("A2").value = "Reporte de viajes y gastos";
  resumen.getCell("A2").font = { bold: true, size: 12, color: { argb: AZUL } };
  resumen.getCell("A3").value = rango;
  resumen.getCell("A3").font = { color: { argb: "FF475569" } };

  const kpis: [string, number, string?][] = [
    ["Ingresos por fletes entregados", reporte.total.ingresos, Q],
    ["Viajes entregados", reporte.total.viajes, "0"],
    ["Gasto en diésel", reporte.total.diesel, Q],
    ["Gasto en repuestos y otros", reporte.total.repuestos, Q],
    ["Total gastos", reporte.total.gastos, Q],
    ["Resultado (ingresos − gastos)", reporte.total.resultado, Q],
    ["Margen", reporte.total.margen / 100, "0%"],
    ["Por entregar (programados / en ruta)", reporte.pendiente.ingresos, Q],
  ];
  kpis.forEach(([etiqueta, valor, formato], i) => {
    const fila = resumen.getRow(6 + i);
    fila.getCell(1).value = etiqueta;
    fila.getCell(2).value = valor;
    fila.getCell(2).numFmt = formato ?? Q;
    fila.getCell(2).alignment = { horizontal: "right" };
    [1, 2].forEach((c) => (fila.getCell(c).border = borde));
    if (etiqueta.startsWith("Resultado")) {
      [1, 2].forEach((c) => {
        fila.getCell(c).fill = relleno(AZUL);
        fila.getCell(c).font = { bold: true, color: { argb: BLANCO } };
      });
    }
  });
  resumen.mergeCells(5, 1, 5, 2);
  resumen.getCell("A5").value = "RESUMEN";
  resumen.getCell("A5").font = { bold: true, color: { argb: BLANCO } };
  resumen.getCell("A5").fill = relleno(ROJO);

  let fila = 6 + kpis.length + 2;
  const seccion = (texto: string) => {
    resumen.mergeCells(fila, 1, fila, 3);
    const c = resumen.getCell(fila, 1);
    c.value = texto;
    c.font = { bold: true, color: { argb: BLANCO } };
    c.fill = relleno(ROJO);
    fila++;
  };

  seccion("INGRESOS POR CAMIÓN");
  fila = tabla(
    resumen,
    fila,
    [
      { titulo: "Placa", ancho: 34 },
      { titulo: "Viajes", ancho: 14, formato: "0", alinear: "right" },
      { titulo: "Ingresos", ancho: 18, formato: Q, alinear: "right" },
    ],
    reporte.porCamion.map((c) => [c.etiqueta, c.viajes, c.valor]),
    { etiqueta: "Total", columnas: [2, 3] },
  ) + 2;

  seccion("INGRESOS POR DESTINO");
  fila = tabla(
    resumen,
    fila,
    [
      { titulo: "Destino / Producto", ancho: 34 },
      { titulo: "Viajes", ancho: 14, formato: "0", alinear: "right" },
      { titulo: "Ingresos", ancho: 18, formato: Q, alinear: "right" },
    ],
    reporte.porDestino.map((d) => [`${d.destino} / ${d.producto}`, d.viajes, d.valor]),
    { etiqueta: "Total", columnas: [2, 3] },
  ) + 2;

  seccion("VIAJES POR PILOTO");
  fila = tabla(
    resumen,
    fila,
    [
      { titulo: "Piloto", ancho: 34 },
      { titulo: "Viajes", ancho: 14, formato: "0", alinear: "right" },
      { titulo: "Ingresos", ancho: 18, formato: Q, alinear: "right" },
    ],
    reporte.porPiloto.map((p) => [p.etiqueta, p.viajes, p.valor]),
    { etiqueta: "Total", columnas: [2, 3] },
  ) + 2;

  seccion("GASTOS POR QUIÉN PAGÓ");
  tabla(
    resumen,
    fila,
    [
      { titulo: "Pagado por", ancho: 34 },
      { titulo: "", ancho: 14 },
      { titulo: "Monto", ancho: 18, formato: Q, alinear: "right" },
    ],
    RESPONSABLES.map((r) => [
      r.nombre,
      "",
      reporte.porResponsable.find((p) => p.etiqueta === r.nombre)?.valor ?? 0,
    ]),
    { etiqueta: "Total", columnas: [3] },
  );
  // Las tablas del resumen no llevan autofiltro (solo cabe uno por hoja).
  resumen.autoFilter = undefined as unknown as ExcelJS.AutoFilter;

  // ---- Por semana ----
  const semanal = libro.addWorksheet("Por semana", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  titulo(semanal, "INGRESOS VS GASTOS POR SEMANA", rango, 6);
  const finSemanal = tabla(
    semanal,
    3,
    [
      { titulo: "Semana", ancho: 12, formato: "0", alinear: "center" },
      { titulo: "Viajes", ancho: 10, formato: "0", alinear: "right" },
      { titulo: "Ingresos", ancho: 16, formato: Q, alinear: "right" },
      { titulo: "Diésel", ancho: 16, formato: Q, alinear: "right" },
      { titulo: "Repuestos", ancho: 16, formato: Q, alinear: "right" },
      { titulo: "Resultado", ancho: 16, formato: Q, alinear: "right" },
    ],
    reporte.semanas.map((s) => [
      s.semana,
      s.viajes,
      s.ingresos,
      s.diesel,
      s.repuestos,
      s.ingresos - s.diesel - s.repuestos,
    ]),
    { etiqueta: "Total", columnas: [2, 3, 4, 5, 6] },
  );
  if (reporte.semanas.length > 0) semanal.getCell(finSemanal, 1).alignment = { horizontal: "left" };

  // ---- Viajes (mismo orden de columnas que el Excel original) ----
  const hojaViajes = libro.addWorksheet("Viajes", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  titulo(hojaViajes, "PLANIFICACIÓN Y PROGRAMACIÓN DE VIAJES", rango, 10);
  tabla(
    hojaViajes,
    3,
    [
      { titulo: "Pedido", ancho: 13, alinear: "center" },
      { titulo: "Año", ancho: 8, formato: "0", alinear: "center" },
      { titulo: "Semana", ancho: 9, formato: "0", alinear: "center" },
      { titulo: "Fecha", ancho: 12, formato: "dd/mm/yyyy", alinear: "center" },
      { titulo: "Placa", ancho: 10, alinear: "center" },
      { titulo: "Piloto", ancho: 16, alinear: "center" },
      { titulo: "Planta", ancho: 8, alinear: "center" },
      { titulo: "Destino / Producto", ancho: 36, alinear: "center" },
      { titulo: "Estatus", ancho: 13, alinear: "center" },
      { titulo: "Tarifa Flete", ancho: 15, formato: Q, alinear: "right" },
    ],
    detalle.viajes.map((v) => [
      v.pedido,
      v.anio,
      v.semana,
      aFecha(v.fecha),
      v.placa,
      v.piloto,
      v.planta,
      `${v.destino} / ${v.producto}`,
      v.estatus,
      v.tarifaFlete,
    ]),
    { etiqueta: "Total", columnas: [10] },
  );
  detalle.viajes.forEach((v, i) => {
    hojaViajes.getCell(4 + i, 9).fill = relleno(ESTATUS_COLOR[v.estatus] ?? BLANCO);
  });

  // ---- Diésel y Repuestos ----
  for (const categoria of ["Diesel", "Repuestos"] as const) {
    const lista = detalle.gastos.filter((g) => g.categoria === categoria);
    const hoja = libro.addWorksheet(categoria === "Diesel" ? "Diésel" : "Repuestos", {
      views: [{ state: "frozen", ySplit: 3 }],
    });
    titulo(hoja, categoria === "Diesel" ? "DIÉSEL" : "REPUESTOS", rango, 6);
    tabla(
      hoja,
      3,
      [
        { titulo: "Año", ancho: 8, formato: "0", alinear: "center" },
        { titulo: "Semana", ancho: 9, formato: "0", alinear: "center" },
        { titulo: "Fecha", ancho: 12, formato: "dd/mm/yyyy", alinear: "center" },
        { titulo: "Descripción", ancho: 34 },
        { titulo: "Costo", ancho: 15, formato: Q, alinear: "right" },
        { titulo: "Pagado por", ancho: 13, alinear: "center" },
      ],
      lista.map((g) => [g.anio, g.semana, aFecha(g.fecha), g.descripcion, g.monto, g.pagadoPor]),
      { etiqueta: "Total", columnas: [5] },
    );
    // Como en el Excel original: el año se pinta con el color de quien pagó.
    lista.forEach((g, i) => {
      const color = COLOR_RESPONSABLE[g.pagadoPor as keyof typeof COLOR_RESPONSABLE] ?? BLANCO;
      hoja.getCell(4 + i, 1).fill = relleno(color);
      hoja.getCell(4 + i, 6).fill = relleno(color);
    });
  }

  // ---- Liquidación de pilotos ----
  const hojaPilotos = libro.addWorksheet("Pilotos", {
    views: [{ state: "frozen", ySplit: 3 }],
  });
  titulo(hojaPilotos, "LIQUIDACIÓN DE PILOTOS", `${rango} · solo viajes entregados`, 9);
  tabla(
    hojaPilotos,
    3,
    [
      { titulo: "Piloto", ancho: 18 },
      { titulo: "Viajes", ancho: 9, formato: "0", alinear: "right" },
      { titulo: "Pago viajes", ancho: 14, formato: Q, alinear: "right" },
      { titulo: "Viáticos", ancho: 14, formato: Q, alinear: "right" },
      { titulo: "Base", ancho: 14, formato: Q, alinear: "right" },
      { titulo: "Total", ancho: 14, formato: Q, alinear: "right" },
      { titulo: "Adelanto viático", ancho: 16, formato: Q, alinear: "right" },
      { titulo: "Desc. préstamo", ancho: 15, formato: Q, alinear: "right" },
      { titulo: "Total líquido", ancho: 15, formato: Q, alinear: "right" },
    ],
    detalle.liquidaciones.map((l) => [
      l.piloto,
      l.cantidadViajes,
      l.pagoViajes,
      l.viaticos,
      l.base,
      l.total,
      l.adelantos,
      l.prestamos,
      l.liquido,
    ]),
    { etiqueta: "Total", columnas: [2, 3, 4, 5, 6, 7, 8, 9] },
  );
  detalle.liquidaciones.forEach((_, i) => {
    const celda = hojaPilotos.getCell(4 + i, 9);
    celda.font = { bold: true, color: { argb: AZUL } };
  });

  const buffer = await libro.xlsx.writeBuffer();
  const nombre = `Reporte-TransVelsa-${anio}-S${desde}-S${hasta}.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
