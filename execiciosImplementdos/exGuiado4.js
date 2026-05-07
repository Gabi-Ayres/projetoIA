import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function callGemini(userPrompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  });
  return response.candidates[0].content.parts[0].text;
}

async function suggestTags(descricaoTarefa) {
  const prompt = `Analise a tarefa ${descricaoTarefa}. Sugira 2 ou 3 tags relevantes a tarefa. 
    E devolva a tarefa em formato JSON puro. O formato deve ser exatamente: 
    {"tarefa": "texto original da tarefa", "tags": ["tag1", "tag2", "tag3"]}`;
  const respostaJson = await callGemini(prompt);

  try {
    const jsonLimpo = respostaJson.replace(/```json|```/g, "").trim();

    // E aqui você faz o parse na variável limpa
    const tagSugerida = JSON.parse(jsonLimpo);
    return tagSugerida;
  } catch (error) {
    console.error("Erro ao parsear JSON:", error);
    return null;
  }
}
