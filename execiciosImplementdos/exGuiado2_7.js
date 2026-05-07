import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Array history global (preenchido para teste)
let history = [
    { role: "user", parts: [{ text: "Olá! O meu nome é Carlos." }] },
    { role: "model", parts: [{ text: "Olá Carlos! Como posso ajudar?" }] },
    { role: "user", parts: [{ text: "Vivo no Porto e sou programador JavaScript." }] },
    { role: "model", parts: [{ text: "O Porto é uma cidade linda. E JS é uma ótima linguagem!" }] },
    { role: "user", parts: [{ text: "Tenho um cão chamado Bobby." }] },
    { role: "model", parts: [{ text: "Como é que o Bobby se está a portar?" }] },
    { role: "user", parts: [{ text: "O Bobby portou-se mal hoje, roeu os meus chinelos." }] }
];

async function summarizeHistory() {
   
    try {
        //Chamar o Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite", 
            contents: history, 
            config: {
                systemInstruction: "És um assistente de IA especialista em processamento de linguagem. A tua tarefa é ler o histórico de conversa fornecido e criar um resumo muito curto, objetivo e factual. Foca nos detalhes do utilizador (nomes, localizações, profissões, preferências). Responde apenas com o resumo, sem introduções."
            }
        });
        const summaryText = response.candidates[0].content.parts[0].text.trim();

        console.log("\n=== RESUMO DO HISTÓRICO ===\n");
        console.log(summaryText);

        return summaryText;

    } catch (error) {
        console.error("Erro ao resumir com systemInstruction:", error);
        return "Erro ao gerar resumo.";
    }
}

summarizeHistory();