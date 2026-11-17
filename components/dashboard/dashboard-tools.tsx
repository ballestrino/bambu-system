import { Calculator, CircleDollarSign } from "lucide-react";

import { CalculatorTool } from "@/components/tools/Calculator";
import { NominalRateConverter } from "@/components/tools/NominalRateConverter";

// Herramientas rápidas que se abren en un diálogo: la barra lateral y la hoja
// "Más" de la app instalada muestran las mismas.
export const dashboardTools = [
  { title: "Conversor nominal", icon: CircleDollarSign, content: <NominalRateConverter /> },
  { title: "Calculadora", icon: Calculator, content: <CalculatorTool /> },
];
