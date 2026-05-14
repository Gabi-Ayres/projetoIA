import { Type, GoogleGenAI } from '@google/genai';
import { MODEL_NAME, ai } from '../config/gemini.js';


const addViagem = {
  name: 'add_viagem',
  description: 'Criar nova viagem',
  parameters: {
    type: Type.OBJECT,
    properties: {
      nome: {
        type: Type.STRING,
        description: 'Nome da viagem a criar',
      }
    },
    required: ['nome']
  }
};

const addItinerario = {
  name: 'add_itinerario',
  description: 'addcionar dia ao intinerário',
  parameters: {
    type: Type.OBJECT,
    properties: {
      viagem_id:{type: Type.INTEGER, description: 'ID da viagem a que se quer adicionar o dia'},
      dia: { type: Type.INTEGER, description: 'Número do dia da viagem' },
      local_nome: { type: Type.STRING, description: 'Local ou cidade a visitar' },
      transporte: { type: Type.STRING, description: 'Transporte a usar' },
      descricao: { type: Type.STRING, description: 'O que fazer neste dia' }
    },
    required: ['viagem_id','dia', 'local_nome', 'transporte', 'descricao']
  }
};

const getViagens = {
    name: 'get_viagens',
    description: 'Buscar todas as viagens para encontrar o id pelo nome',
    parameters: {
        type: Type.OBJECT,
        properties: {}
    }
};

const getItinerario = {
    name: 'get_itinerario',
    description: 'Buscar todas os intinerários para encontrar o id pelo nome',
    parameters: {
        type: Type.OBJECT,
        properties: {
          viagem_id: { type: Type.INTEGER, description: 'ID da viagem para buscar o intinerário correspondente' },
        },
         required: ['viagem_id']
    }
}

const updateViagem = {
  name: 'update_viagem',
  description: 'Atualizar nome da viagem',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {type: Type.INTEGER, description: 'ID da viagem a atualizar'},
      nome: { type: Type.STRING, description: 'Novo nome da viagem' }
    },
    required: ['id']
    }
  }

  const updateItinerario = {
  name: 'update_itinerario',
  description: 'Editar um dia do intinerário especificado',
  parameters: {
    type: Type.OBJECT,
    properties: {
        id: {type: Type.INTEGER, description: 'Id do intinerário a editar.'},
        local_nome: { type: Type.STRING, description: 'Novo local' },
        transporte: { type: Type.STRING, description: 'Novo transporte' },
        descricao: { type: Type.STRING, description: 'Nova descrição' }
    },
    required: ['id']
  }
};


const deleteViagem = {
  name: 'delete_viagem',
  description: 'Apagar viagem e todos os seus intinerários',
  parameters: {
    type: Type.OBJECT,
    properties: {
        id: {
        type: Type.INTEGER,
        description: 'Id da viagem a apagar',
      }
    },
    required: ['id']
  }
};

const deleteItinerario = {
  name: 'delete_itinerario',
  description: 'Apagar apenas um dia do intinerário especificado',
  parameters: {
    type: Type.OBJECT,
    properties: {
        id: {
        type: Type.INTEGER,
        description: 'Id do intinerário a apagar',
      }
    },
    required: ['id']
  }
};


export const houseFns = [addViagem, addItinerario, deleteViagem, deleteItinerario, updateViagem, updateItinerario, getItinerario, getViagens];

  // buscar histórico da BD
    const [rows] = await db.execute( // [rows] so queremos as linhas nao as colunas [fields]
        'SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 5'
    );

    // converter para o formato do Gemini
    const history = rows.reverse().flatMap(row => [//flatMap transforma cada linha em duas mensagens
        { role: "user",  parts: [{ text: row.user_message }] },
        { role: "model", parts: [{ text: row.ai_response }] }
    ]);

    //adicionar a mensagem atual no fim
    history.push({ role: "user", parts: [{ text: userPrompt }] });


export const chat = ai.models.generateContent({
    
    model: MODEL_NAME,
    contents: history,
    config: {
        tools: [{ functionDeclarations: houseFns }],
        toolConfig: {
            functionCallingConfig: {
                mode: 'auto'
            }
        },
 //       temperature: 0.1,       
        systemInstruction: `
              És o TravelBot, um assistente especialista em viagens.
    Respondes sempre em português de Portugal.

    Regra geral:
    Quando o utilizador pedir uma viagem com X dias:
    1. Chama add_viagem UMA vez para criar a viagem
    2. Chama add_intinerario OBRIGATORIAMENTE para CADA dia separadamente
       - Se forem 2 dias → chama add_intinerario 2 vezes
       - Se forem 3 dias → chama add_intinerario 3 vezes
    3. Nunca termines sem criar todos os dias pedidos!

    Quando o utilizador perguntar pelas viagens existentes:
    - Se o utilizador perguntar por uma viagem específica e vires algo semelhante na lista de viagens, deves OBRIGATORIAMENTE chamar get_intinerario (ou get_itinerario) usando o ID correspondente antes de dar a resposta fina.
    - Nunca digas que não tens acesso às viagens!

    Quando o utilizador perguntar pelos dias de uma viagem:
    - Chama SEMPRE get_intinerario com o viagem_id correto

     IMPORTANTE: 
    - Chama add_viagem PRIMEIRO e espera pelo viagem_id
    - Só depois chama add_intinerario com o viagem_id recebido
    - NUNCA uses viagem_id: 1, usa sempre o id devolvido pelo add_viagem

    Não perguntes o nome da viagem - inventa um nome criativo!
        `                        
    }
});