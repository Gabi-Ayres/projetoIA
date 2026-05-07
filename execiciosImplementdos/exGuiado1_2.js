import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function callGemini(userPrompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{role: "user", parts: [{text: userPrompt}]}],

    });
    return response.candidates[0].content.parts[0].text; // o candidate ele pode trazer mais de uma resposta, mas quer q venha apenas a primeira 
}

//ctrl+alt+z usado para quebrar linha

const task = {
  "title": "Bug no login",
  "description": "login não funciona",
  "priority": "high",
  "tags": ["bug"]
}

async function refineTask(taskObjeto) {
    const taskString = JSON.stringify(taskObjeto)
    const prompt = `Refina o objeto JSON, tornando-a mais clara e específica: ${taskString}.
    Responde apenas com a tarefa refinada, sem expliacações adicionais e sem mudar o nome das propriedades. Responde APENAS com o JSON puro, sem blocos de código.`;
    const respostaJson = await callGemini(prompt);
    try {
        const jsonLimpo = respostaJson.replace(/```json|```/g, "").trim();
        
        // E aqui você faz o parse na variável limpa
        const tarefaRefinada = JSON.parse(jsonLimpo);
        return tarefaRefinada;      
    } catch (error) {
        console.error("Erro ao parsear JSON:", error);
        return null;
    }
}

const tarefa = await refineTask(task);
console.log(tarefa);