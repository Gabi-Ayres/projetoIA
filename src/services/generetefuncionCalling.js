import { Type } from '@google/genai';
import { MODEL_NAME, ai } from '../config/gemini.js';
import db from '../db.js';

const addViagem = {
  name: 'add_viagem',
  description: 'Criar nova viagem',
  parameters: {
    type: Type.OBJECT,
    properties: {
      nome: { type: Type.STRING, description: 'Nome da viagem a criar' }
    },
    required: ['nome']
  }
};

const addItinerario = {
  name: 'add_itinerario',
  description: 'Adicionar dia ao itinerário',
  parameters: {
    type: Type.OBJECT,
    properties: {
      viagem_id: { type: Type.INTEGER, description: 'ID da viagem' },
      dia: { type: Type.INTEGER, description: 'Número do dia' },
      local_nome: { type: Type.STRING, description: 'Local a visitar' },
      transporte: { type: Type.STRING, description: 'Transporte a usar' },
      descricao: { type: Type.STRING, description: 'O que fazer neste dia' }
    },
    required: ['viagem_id', 'dia', 'local_nome', 'transporte', 'descricao']
  }
};

const getViagens = {
  name: 'get_viagens',
  description: 'Buscar todas as viagens',
  parameters: { type: Type.OBJECT, properties: {} }
};

const getItinerario = {
  name: 'get_itinerario',
  description: 'Buscar itinerário de uma viagem',
  parameters: {
    type: Type.OBJECT,
    properties: {
      viagem_id: { type: Type.INTEGER, description: 'ID da viagem' }
    },
    required: ['viagem_id']
  }
};

const updateViagem = {
  name: 'update_viagem',
  description: 'Atualizar nome da viagem',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER, description: 'ID da viagem' },
      nome: { type: Type.STRING, description: 'Novo nome' }
    },
    required: ['id']
  }
};

const updateItinerario = {
  name: 'update_itinerario',
  description: 'Editar um dia do itinerário',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER, description: 'ID do dia' },
      local_nome: { type: Type.STRING, description: 'Novo local' },
      transporte: { type: Type.STRING, description: 'Novo transporte' },
      descricao: { type: Type.STRING, description: 'Nova descrição' }
    },
    required: ['id']
  }
};

const deleteViagem = {
  name: 'delete_viagem',
  description: 'Apagar viagem e todos os seus itinerários',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER, description: 'ID da viagem' }
    },
    required: ['id']
  }
};

const deleteItinerario = {
  name: 'delete_itinerario',
  description: 'Apagar um dia do itinerário',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER, description: 'ID do dia' }
    },
    required: ['id']
  }
};

export const houseFns = [addViagem, addItinerario, deleteViagem, deleteItinerario, updateViagem, updateItinerario, getItinerario, getViagens];

export async function callGemniniCalling(promptUser, localHistory = []) {
  
  const contents = [
        { role: "user", parts: [{ text: promptUser }] },
        ...localHistory  // ← só o histórico local
    ];

  console.log("📜 History total enviado ao Gemini:", contents.length, "entradas");

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: contents,
    config: {
      tools: [{ functionDeclarations: houseFns }],
      toolConfig: { functionCallingConfig: { mode: 'auto' } },
      systemInstruction: `
És o TravelBot, um assistente especialista em viagens.
Respondes sempre em português de Portugal.

Quando o utilizador pedir uma viagem:
1. Chama add_viagem UMA vez
2. Após receberes o viagem_id, chama add_itinerario UMA vez por dia
3. Após adicionares TODOS os dias, responde com texto confirmando a viagem criada

IMPORTANTE:
- Chama add_viagem PRIMEIRO e espera pelo viagem_id
- Só depois chama add_itinerario com o viagem_id recebido
- Após todas as funções executadas, TERMINA com uma mensagem de texto!
      `
    }
  });

  return response;
}