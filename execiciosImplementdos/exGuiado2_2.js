import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function classifyPriority(text){
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite", 
      contents: [
      { role: "user", parts: [{ text: "O site foi abaixo e ninguém consegue comprar." }]},
      { role: "model", parts: [{ text: `{"priority": "Alto"}` }] },
    
      { role: "user", parts: [{ text: "Gostava de mudar a cor do ícone para azul." }] },
      { role: "model", parts: [{ text: `{"priority": "Baixo"}` }] },
    
      { role: "user", parts: [{ text: text }] },
     
      ]  
    }); 
    
    const responseText = response.candidates[0].content.parts[0].text.trim();
    
    console.log(`\nTarefa: "${text}"`);
    console.log(`Resposta da IA: ${responseText}`);
    
    return responseText;

}

// Testando
await classifyPriority("O formulário de contacto não envia emails."); 


