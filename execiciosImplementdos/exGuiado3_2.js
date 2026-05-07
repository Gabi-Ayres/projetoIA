import "dotenv/config";
import {GoogleGenAI  } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// 1. Corrigido para GoogleGenerativeAI e passado apenas a chave
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

const listTask = [];

// Defina o Schema ANTES de usar na função callGemini
const clickupTaskSchema = z.object({
    name: z.string().describe("Um titulo curto e profissional para a tarefa."),
    description: z.string().describe("Um resumo detalhado do que precisa ser feito."),
    priority: z.enum(["urgent", "high", "normal", "low"]),
    department: z.enum(["design", "dev", "marketing"])
});

async function callGemini(userPrompt) {
    // Modelo gemini-1.5-flash
    const response = await genAI.models.generateContent({
              model: "gemini-2.5-flash-lite",

        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(clickupTaskSchema),
        }
    });
    
  return response.text;
}

export async function createTask() {
  const prompt = `Preciso de um design para a home page até sexta com prioridade alta.`;
  
  try {
    const respostaJson = await callGemini(prompt);
    const tarefa = JSON.parse(respostaJson);
    console.log("Tarefa Criada:", tarefa);
    return tarefa;
  } catch (error) {
    console.error("Erro ao processar:", error);
    return null;
  }
}


createTask();
