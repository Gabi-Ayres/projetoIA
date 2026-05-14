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

const roteiroSchema = z.object({
    action: z.enum(['CREATE', 'DELETE','DELETE_DIA', 'UPDATE','SEARCH', 'NONE']).describe("Tipo de ação a realizar"),
    resposta: z.string().describe("Resposta amigável ao utilizador"),
    viagem_id: z.number().optional().describe("ID da viagem associada"),
    viagem_nome: z.string().optional().describe("Nome da viagem"),
    dia_id: z.number().optional().describe("ID do dia a apagar"),
    itinerario: z.array(z.object({
        dia: z.number().describe("Número do dia da viagem"),
        local: z.string().describe("Local ou cidade a visitar"),
        transporte: z.string().describe("Transporte a usar"),
        descricao: z.string().describe("O que fazer neste dia")
    })).optional()
});

export async function callGeminiRoteiro(userPrompt) {
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
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: history,
        config: {
            maxOutputTokens:2000,
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(roteiroSchema),
            systemInstruction:  `
És o TravelBot, um assistente especialista em viagens.
Respondes sempre em português de Portugal de forma simpática e entusiasmada.

Devolves SEMPRE um JSON com o campo "action" preenchido:

- action "CREATE": quando o utilizador quer criar uma viagem
  → preenches viagem_nome e itinerario com todos os dias
  → O viagem_nome deve ser SEMPRE único e criativo
 
- action "DELETE": quando o utilizador quer apagar uma viagem
  → preenches viagem_id com o id confirmado pelo utilizador

- action "DELETE_DIA": quando o utilizador quer apagar um dia E já sabes o id
  → preenches dia_id com o id confirmado pelo utilizador

- action "UPDATE": quando o utilizador quer editar uma viagem 
 → se NÃO souberes o id → usa SEARCH primeiro para encontrar o id
  → mostra as viagens encontradas e pede confirmação do id
  → só depois usa UPDATE com o id confirmado
  → preenches viagem_id e viagem_nome com o novo nome

- action "SEARCH": quando precisas de buscar viagens para confirmar antes de apagar ou editar
  → usas quando o utilizador menciona um nome mas não sabes o id
  → NUNCA apagues ou edites sem confirmar o id com o utilizador!

- action "NONE": quando é só conversa normal
  → só preenches a resposta

Regras:
- Só crias itinerário quando o utilizador indicar destino e número de dias
- Cada dia deve ter local, transporte e descrição detalhada
- NUNCA executes DELETE ou UPDATE sem saberes o id correto
- SEMPRE usa SEARCH quando o utilizador mencionar um nome sem id
- Após SEARCH lista as opções e pede confirmação antes de agir
- Se o utilizador perguntar sobre outro tema que não seja viagens → action "NONE" e não respondes.

`
        }
    });

    return response.text;
} catch (erro) {
       console.error('Erro ao chamar Gemini Roteiro:', erro.message);

        if (erro.status === 429) {
            throw new Error('GEMINI_RATE_LIMIT');
        }
        if (erro.status === 503) {
            throw new Error('GEMINI_UNAVAILABLE');
        }
        throw new Error('GEMINI_ERROR');
    
}
}