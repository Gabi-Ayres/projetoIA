import "dotenv/config";
import {GoogleGenAI  } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ai, MODEL_NAME } from "../config/gemini.js";
import db from "../db.js";

export async function callGeminiStream(userPrompt) {
  // buscar histórico da BD
    const [rows] = await db.execute( // [rows] so queremos as linhas nao as colunas [fields]
        'SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 5'
    );

    // converter para o formato do Gemini
    const history = rows.reverse().flatMap(row => [//flatMap transforma cada linha em duas mensagens
        { role: "user",  parts: [{ text: row.user_message }] },
        { role: "model", parts: [{ text: row.ai_response }] }
    ]);

    //adicionar a mensagem atual no fim
    history.push({ role: "user", parts: [{ text: userPrompt }] });
  
  const result = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: history,
    config: {
    systemInstruction: "És um assistente de viagens especializado. Ajuda os utilizadores a criar itinerários detalhados dia a dia."
     }
  });
  return result;
}

const roteiroSchema = z.object({
    resposta: z.string().describe("Resposta amigável ao utilizador"),
    viagem_nome: z.string().describe("Nome da viagem"),
    itinerario: z.array(z.object({
        dia: z.number().describe("Número do dia da viagem"),
        local: z.string("Local ou cidade a visitar"),
        transporte: z.string("Transporte a usar"),
        descricao: z.string("O que fazer neste dia")
    }))
});

export async function callGeminiRoteiro(userPrompt) {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(roteiroSchema),
            systemInstruction: "És um assistente de viagens. Cria itinerários detalhados dia a dia."
        }
    });

    return response.text;
}