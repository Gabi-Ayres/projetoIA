import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createSystemPrompt } from '../src/utils/createSystemPrompt.js';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function callGemini() {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{role: "user", parts: [{text: "Olá!"}]}], // Aqui é o prompt de saída, ou seja, o imput do utilizador 
        config:
        {systemInstruction: createSystemPrompt()} 
        // estou chamando essa função que deve está com a lógica
        //  do codigo que devo passar indicando RTF, ou seja,  o role(o q é), tarefa(qual a tarefa que tem q executar)
        // e o formato(qual o formato/estrutura que vc quer q os dados venha);
    

    });
    return response.candidates[0].content.parts[0].text; 
}

const resposta =await callGemini();
console.log(resposta);

/* async function createTaskFromText(text) {
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
    
const tarefa = await createTaskFromText("Preciso de corrigir o bug do login que está a falhar para vários utilizadores e é urgente");
console.log(tarefa); */