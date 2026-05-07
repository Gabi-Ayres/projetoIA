import zodToJsonSchema from "zod-to-json-schema";
import { ai, MODEL_NAME } from "../config/gemini.js";
import { createSystemPrompt } from '../utils/createSystemPrompt.js';
import { z } from "zod";

async function callGemini(userPrompt) {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  });
  return response.candidates[0].content.parts[0].text;
} 

export async function createTask(text) {
  const prompt = `Cria um objeto JSON com os campos "titulo", "descricao","prioridade" e "tags" a partir do seguinte texto: ${text}. Responde APENAS com o JSON puro, sem blocos de código.`;
  const respostaJson = await callGemini(prompt);

  try {
    const tarefa = JSON.parse(respostaJson);
    return tarefa;
  } catch (error) {
    console.error("Erro ao parsear JSON:", error);
    return null;
  }
}

export async function refineTask(taskObjeto) {
  const taskString = JSON.stringify(taskObjeto);
  const prompt = `Refina o objeto JSON, tornando-a mais clara e específica: ${taskString}.
    Responde apenas com a tarefa refinada, sem expliacações adicionais e sem mudar o nome das propriedades. Responde APENAS com o JSON puro, sem blocos de código.`;
  const respostaJson = await callGemini(prompt);

  try {
    const jsonLimpo = respostaJson.replace(/```json|```/g, "").trim();
    const tarefaRefinada = JSON.parse(jsonLimpo);
    return tarefaRefinada;
  } catch (error) {
    console.error("Erro ao parsear JSON:", error);
    return null;
  }
  
}

export async function summarizeTask(logDescription) {
  const prompt = `Resuma o texto da tarefa em apenas uma frase curta, direta e objetiva.
    Retorne a resposta estritamente no formato JSON puro: {"resumo": "sua frase aqui"}.
    Não adicione texto fora do JSON. Texto para resumir: ${logDescription}`;
  const respostaJson = await callGemini(prompt);

  try {
    const jsonLimpo = respostaJson.replace(/```json|```/g, "").trim();
    const taskResumida = JSON.parse(jsonLimpo);
    return taskResumida;
  } catch (error) {
    console.error("Erro ao parsear JSON:", error);
    return null;
  }
}

export async function suggestTags(descricaoTarefa) {
  const prompt = `Analise a tarefa ${descricaoTarefa}. Sugira 2 ou 3 tags relevantes a tarefa.
    E devolva a tarefa em formato JSON puro. O formato deve ser exatamente:
    {"tarefa": "texto original da tarefa", "tags": ["tag1", "tag2", "tag3"]}`;
  const respostaJson = await callGemini(prompt);

  try {
    const jsonLimpo = respostaJson.replace(/```json|```/g, "").trim();
    const tagSugerida = JSON.parse(jsonLimpo);
    return tagSugerida;
  } catch (error) {
    console.error("Erro ao parsear JSON:", error);
    return null;
  }
}

let history = [];

/* export async function chatMessage(userMessage) {
    history.push({role: "user", parts:[{text: userMessage}]}) // aqui para guardar a resposta do user
  
    const historyLimited = history.slice(-5); // para resolver o exercicio 6
   
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: historyLimited, 
        config: {
        systemInstruction: "És um assistente virtual e deves responder objetivamente."
        }
            
})
    const responseText = response.candidates[0].content.parts[0].text.trim();
    console.log(responseText)

        history.push({role: "model", parts:[{text: responseText}]})// aqui está a guardar a resposta da IA

} */

// chat stream
export async function callGeminiStream(userPrompt) {
  const systemPrompt = createSystemPrompt();
  const result = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemPrompt,
  });
  return result;
}

// transcrição reuniões Exercicio 03
export async function streamMeetingSummary(text) {
  const result = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text:`Transcrição: ${text}` }] }],
    systemInstruction: "Você é um assistente executivo. Analise a transcrição a aseguir e gere um resumo estruturado com: Ponto chave, decisões tomadas e próximas ações.",
  });
  return result;
}

// exercicio 04

const ticketsBugsSchema = z.object({
    erro_type: z.enum(["UI", "API", "Database"]),
    severity: z.number().describe("Nível de gravidade de 1 (baixo) a 10 (crítico)"),
    fix_sugestion: z.string().describe("Uma breve sugestão de como corrigir o erro")
});

export async function triageBugs(text) {
  const resultBug = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{role: "user", parts: [{text: text }]}],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(ticketsBugsSchema),
    }
  })
    const inputString = resultBug.text;
    const javascriptObject = JSON.parse(inputString);
  
    return javascriptObject;
}