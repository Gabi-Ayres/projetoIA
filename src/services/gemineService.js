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
  
  try {  
  const result = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: history,
    config: {
    maxOutputTokens:1000,
    systemInstruction:  `
És o TravelBot, um assistente especialista em viagens.
Respondes sempre em português de Portugal de forma simpática e entusiasmada.
Responde sempre em texto natural, NUNCA em JSON!
Responde em máximo 1 frase!

Regras OBRIGATÓRIAS:
- Só respondes sobre viagens
- Quando o utilizador pedir para criar, editar ou apagar apenas diz "A processar o teu pedido... ⏳"- NUNCA confirmes que fizeste uma ação - não sabes o que o sistema fez!
- Quando o utilizador pedir para VER ou LISTAR viagens diz apenas "A processar o teu pedido... ⏳"

- Se o tema não for viagens, resposde simpaticamente que só podes falar sobre viagens e pergunta se queres ajuda para planear uma viagem.
    `
     }
  });
  return result;
} catch (error) {
      console.error('Erro ao chamar Gemini Stream:', error.message);

       if (error.status === 429) {
        throw new Error('GEMINI_RATE_LIMIT'); // demasiados pedidos
    }
    if (error.status === 503) {
        throw new Error('GEMINI_UNAVAILABLE'); // serviço indisponível
    }
        throw new Error('GEMINI_ERROR'); // erro genérico;
}
}
