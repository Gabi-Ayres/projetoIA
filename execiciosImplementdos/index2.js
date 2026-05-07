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
    return response.candidates[0].content.parts[0].text;
}

async function traduzir(texto, idiomaDestino) {
    const prompt = `Age como um tradutor profissional. Traduz o seguinte texto para ${idiomaDestino}: ${texto}`;
    return await callGemini(prompt);
}

// Teste: traduzir para Alemão
const resultado = await traduzir("O meu código tem um bug que não consigo encontrar", "Alemão");
console.log(resultado);