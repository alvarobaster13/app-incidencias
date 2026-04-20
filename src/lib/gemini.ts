import { GoogleGenAI } from "@google/genai";
import { Incident } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateDailySummary(incidents: Incident[]) {
  if (incidents.length === 0) return "No se registraron incidencias hoy.";

  const prompt = `
    Eres un analista de operaciones en Glovo. 
    A continuación tienes una lista de incidencias operativas del día de hoy:
    ${JSON.stringify(incidents.map(i => ({ type: i.type, zone: i.zone, severity: i.severity })), null, 2)}

    Por favor, genera un resumen ejecutivo breve (máximo 150 palabras) en español que:
    1. Identifique la zona más problemática.
    2. Resuma los tipos de problemas más frecuentes.
    3. Sugiera una acción inmediata para mejorar la operativa mañana.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Error al generar el resumen.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "No se pudo generar el resumen automático.";
  }
}
