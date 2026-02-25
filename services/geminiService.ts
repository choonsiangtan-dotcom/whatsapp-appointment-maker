
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractAppointmentInfo = async (text: string): Promise<ExtractionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract appointment details from this WhatsApp message: "${text}". 
      Return JSON with fields: name, address, date, time. 
      If a field is missing, return null for it.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
          }
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Extraction failed", error);
    return {};
  }
};
