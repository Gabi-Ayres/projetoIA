import "dotenv/config";
import {GoogleGenAI  } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateTaskBreakdown() {
    const response = await ai.models.generateContent({
     model: "gemini-3-flash-preview",
     contents: "Criar sistema completo de login com OAuth, recuperação de password e 2FA",
    config: {
        thinkingConfig: {
            includeThoughts: true,
         //   thinkingBudget: 1024
        },
    temperature: 0.2,
    systemInstruction: `Tu es um arquiteto sênior de software planeando a implementação de uma funcionalidade.

Analisa esta tarefa grande e divide-a em subtarefas menores e gerenciáveis:

Pensa através de:
1. Quais são os principais componentes/camadas envolvidas?
2. Que dependências existem entre tarefas?
3. Em que ordem devem ser implementadas?
4. Quais são os possíveis casos extremos (edge cases)?
5. Alguma tarefa deve ser further subdivida?

Retorna APENAS um objeto JSON válido com:
{
"title": "Título da tarefa principal",
"splitRules": ["regra 1", "regra 2", ...],
"subtasks": [
    {
"id": "tarefa_1",
"title": "Título da subtarefa",
"description": "O que precisa ser feito",
"dependencies": ["tarefa_0"],
"estimatedEffort": "baixa|média|alta",
"category": "backend|frontend|infraestrutura"
    }
],
"overSplitWarnings": ["aviso se muitas subtarefas"],
"implementationFlow": "frontend → backend → integração com IA → testes"
}`

    }

    });

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

await generateTaskBreakdown();


/* import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Setup da API (Substitui pela tua chave real)
const genAI = new GoogleGenerativeAI("A_TUA_API_KEY_AQUI");

async function generateTaskBreakdown() {
    try {
        // 2. Obter o modelo correto
        // Nota: Garante que 'gemini-3-flash-preview' está disponível na tua região/conta.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-flash-preview" 
        });

        // 3. Definir as instruções do sistema
        const systemInstruction = `Tu es um arquiteto sênior de software planeando a implementação de uma funcionalidade.
Analisa esta tarefa grande e divide-a em subtarefas menores e gerenciáveis:

Retorna APENAS um objeto JSON válido com:
{
  "title": "Título da tarefa principal",
  "subtasks": [
    {
      "id": "tarefa_1",
      "title": "Título da subtarefa",
      "description": "O que precisa ser feito",
      "estimatedEffort": "baixa|média|alta"
    }
  ]
}`;

        // 4. Preparar o conteúdo do utilizador
        const userContent = "Criar sistema completo de login com OAuth, recuperação de password e 2FA";

        // 5. Chamar a API com a estrutura de configuração correta
        // Passamos a systemInstruction e a thinkingConfig aqui.
        const response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userContent }] }],
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
            generationConfig: {
                // Configuração de Pensamento (Thinking)
                // Nota: includeThoughts e thinkingBudget são suportados apenas em modelos Gemini 3.
                // Na SDK atual, estas propriedades são passadas dentro de generationConfig ou 
                // numa propriedade separada dependendo da versão exata da SDK. 
                // A estrutura abaixo é a mais comum para pré-visualizações.
                thinkingConfig: {
                    includeThoughts: true,
                    thinkingBudget: 1024
                },
                temperature: 0.2 // Opcional: baixar temperatura para respostas JSON mais estáveis
            }
        });

        // 6. Processar a resposta corrigindo os erros de digitação
        const candidates = response.response.candidates;
        
        if (!candidates || candidates.length === 0) {
            console.error("Nenhuma resposta recebida.");
            return;
        }

        console.log("--- Processando Resposta ---");

        for (const part of candidates[0].content.parts) {
            // CORREÇÃO: Usar part.thought para verificar se é um pensamento
            if (part.thought) {
                console.log("=== THOUGHTS SUMMARY ===");
                // CORREÇÃO: O texto do pensamento está dentro de part.thought
                console.log(part.thought); 
            }
            // CORREÇÃO: Usar part.text com 't' no final
            else if (part.text) {
                console.log("=== FINAL ANSWER ===");
                console.log(part.text);
            }
        }
        
    } catch (error) {
        console.error("Erro ao chamar a API:", error);
    }
}

// Chamar a função
await generateTaskBreakdown(); */