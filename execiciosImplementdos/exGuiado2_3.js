import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function generateNames(temp) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{ role: "user", parts: [{ text: "Sugira 3 nomes criativos para um novo sabor de sorvete de chocolate com pimenta." }] 
            }
        ],
        config: {
            // Aqui é onde o "termômetro" é definido!
            temperature: temp 
        }
    });

    const responseText = response.candidates[0].content.parts[0].text.trim();
    
    console.log(`\n--- Teste com Temperatura: ${temp} ---`);
    console.log(responseText);
    
    return responseText;
}

// Roteiro de Testes sugerido pelo exercício:
console.log("Iniciando a comparação de criatividade...");

await generateNames(0.2); // Mais sério/óbvio
await generateNames(0.8); // Equilibrado
await generateNames(1.2); // Mais "louco"/criativo