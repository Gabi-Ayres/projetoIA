import "dotenv/config";
import {GoogleGenAI  } from "@google/genai";
import { ai, MODEL_NAME } from "../config/gemini.js";
import db from "../db.js";

export async function callGeminiStream(userPrompt) {
  
  const result = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
    systemInstruction: "És um assistente de viagens especializado. Ajuda os utilizadores a criar itinerários detalhados dia a dia."
     }
  });
  return result;
}