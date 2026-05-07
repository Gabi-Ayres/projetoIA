import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function planSprint() {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{
            role: "user",
            parts: [{
                text: `Organização de tarefa, analisa passo a passo, tem atenção ao tokens: Organiza sprint de 5 dias para lançar landing page. 
                
                1. analise em ordem descrescente.
                2. separe por prioridades.
     `
            }]
        }]
            
})
    const responseText = response.candidates[0].content.parts[0].text.trim();
    console.log(responseText)

}

await planSprint();