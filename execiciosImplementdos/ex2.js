import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function callGemini(userPrompt) {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{role: "user", parts: [{text: userPrompt}]}],

    });
    const result =  response.candidates[0].content.parts[0].text;
    return result;
}

async function processarTarefas(listaTarefas) {
    const prompt = `Transforma esta lista de tarefas num objeto JSON estruturado com os campos 'tarefa' e 'horario'. Devolve APENAS o JSON. Lista: ${listaTarefas}`;
    const respostaJSON = await callGemini(prompt);
    try {
        const objetoTarefas = JSON.parse(respostaJSON);
        return objetoTarefas;
    } catch (error) {
        console.error("Erro ao parsear JSON:", error);
        return null;
    }
}

// Teste: processar lista de tarefas
const res = await processarTarefas("tenho de comprar ovos, ir ao ginásio às 18h e ligar à mãe");
console.log(res); // Deve imprimir "18h"