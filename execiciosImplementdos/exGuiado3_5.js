import "dotenv/config";
import { GoogleGenAI } from "@google/genai"; // pede outra biblioteca para usar o stream

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const separador = "---AGENDA_JSON---";

async function smartPlannerSemanal() {
    // 1. Mudamos para generateContentStream
    const resultStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: "Tenho que entregar o logo, ir ao dentista na terça e estudar React todos os dias.",
        systemInstruction: `Você é um Smart Planner Semanal. Sua tarefa é organizar os compromissos do utilizador numa agenda semanal.

Siga estritamente esta ordem de resposta:
1. Comece a responder explicando o seu raciocínio em texto livre. Mostre como identificou os dias da semana, as tarefas recorrentes e os compromissos únicos.
2. Quando terminar o raciocínio, escreva a palavra-chave EXATA: "${separador}".
3. Imediatamente após a palavra-chave, gere um bloco JSON estruturado com a agenda. O JSON deve ter uma chave para cada dia da semana que contém atividades.

Formato do JSON esperado (exemplo):
{
  "segunda": ["atividade 1", "atividade 2"],
  "terça": ["atividade"]
}`,
        config: {
            thinkingConfig: {
                includeThoughts: true,
            },
            temperature: 0.2,
        }
    });

    console.log("--- Iniciando Stream (Texto em tempo real) ---\n");

    let startedThoughts = false;
    let startedAnswer = false;

    // 2. Usamos 'for await' para consumir o stream pedaço por pedaço
    for await (const chunk of resultStream) {
        // A estrutura para acessar as partes é a mesma, mas dentro do loop do stream
        for (const part of chunk.candidates[0].content.parts) {
            
            // --- Processa Pensamentos (Thoughts) ---
            if (part.thought) {
                if (!startedThoughts) {
                    console.log("\n--- THOUGHTS SUMMARY (Raciocínio Interno) ---");
                    startedThoughts = true;
                }
                // 3. Usamos process.stdout.write para imprimir na mesma linha
                process.stdout.write(part.text); 
            } 
            
            // --- Processa Resposta Final (Texto e JSON) ---
            else if (part.text) {
                if (!startedAnswer) {
                    // Adiciona uma quebra de linha antes da resposta final
                    console.log("\n\n--- ANSWER (Explicação e JSON) ---");
                    startedAnswer = true;
                }
                // Imprime a resposta texto/JSON à medida que chega
                process.stdout.write(part.text);
            }
        }
    }   
    
    console.log("\n\n--- Fim do Stream ---");
}

await smartPlannerSemanal();








/* import "dotenv/config";
import {GoogleGenAI  } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Palavra-chave que a IA usará para separar o texto do JSON
const separador = "---AGENDA_JSON---";

async function smartPlannerSemanal() {
    const resultStream = await ai.models.generateContentStream({
     model: "gemini-3-flash-preview",
     contents: "Tenho que entregar o logo, ir ao dentista na terça e estudar React todos os dias.",
    config: {
        thinkingConfig: {
            includeThoughts: true,
         //   thinkingBudget: 1024
        },
    temperature: 0.2,
    systemInstruction: `Você é um Smart Planner Semanal. Sua tarefa é organizar os compromissos do utilizador numa agenda semanal.

Siga estritamente esta ordem de resposta:
1. Comece a responder explicando o seu raciocínio em texto livre (stream). Mostre como identificou os dias da semana, as tarefas recorrentes e os compromissos únicos.
2. Quando terminar o raciocínio, escreva a palavra-chave EXATA: "${separador}".
3. Imediatamente após a palavra-chave, gere um bloco JSON estruturado com a agenda. O JSON deve ter uma chave para cada dia da semana que contém atividades.

Formato do JSON esperado (exemplo):
{
  "segunda": ["atividade 1", "atividade 2"],
  "terça": ["atividade"]
}`

    }

    });
 
    console.log("--- Iniciando Stream (Texto em tempo real) ---\n");

    let startedThoughts = false;
    let startedAnswer = false;

    for (const part of response.candidates[0].content.parts) {
        if (!part.text) {
            continue;
        }
        if (part.thought) {
            console.log("thougths summary:");
            console.log(part.text);
        }
        else {
            console.log("Answer:");
            console.log(part.text);
        }
    }   
}

await smartPlannerSemanal(); */