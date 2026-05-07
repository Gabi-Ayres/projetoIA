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
    return response.candidates[0].content.parts[0].text;
}

async function summarize(logDescription) {
    const prompt = `Resuma o texto da tarefa em apenas uma frase curta, direta e objetiva.
    Retorne a resposta estritamente no formato JSON puro: {"resumo": "sua frase aqui"}.
    Não adicione texto fora do JSON. Texto para resumir: ${logDescription}` 
    const respostaJson = await callGemini(prompt);

       try {
        const jsonLimpo = respostaJson.replace(/```json|```/g, "").trim();
        
        // E aqui você faz o parse na variável limpa
        const taskResumida = JSON.parse(jsonLimpo);
        return taskResumida;      
    } catch (error) {
        console.error("Erro ao parsear JSON:", error);
        return null;
    }
    
}

