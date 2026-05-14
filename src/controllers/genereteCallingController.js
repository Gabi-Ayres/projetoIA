import { callGemniniCalling } from '../services/generetefuncionCalling.js';
import db from '../db.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Chama o Gemini com retry automático para erros 429 (rate limit do plano gratuito)
async function callComRetry(history, tentativas = 3) {
  for (let i = 0; i < tentativas; i++) {
    try {
      return await callGemniniCalling(history);
    } catch (error) {
      const isRateLimit = error.status === 429 || error.message?.includes('429');
      const isTimeout = error.message === 'TIMEOUT';
      if ((isRateLimit || isTimeout) && i < tentativas - 1) {
        const espera = isTimeout ? 10000 : (i + 1) * 5000;
        console.log(`⏳ ${isTimeout ? 'Timeout' : 'Rate limit'} — a aguardar ${espera / 1000}s antes de tentar novamente (tentativa ${i + 2}/${tentativas})...`);
        await sleep(espera);
      } else {
        throw error;
      }
    }
  }
}

export async function testeControllerCalling(req, res) {

const promptUser = req.body.mensagem;

// Sem histórico: cada pedido de function calling é independente.
// Misturar histórico do chat normal confunde o modelo e aumenta o contexto desnecessariamente.
const history = [
    { role: "user", parts: [{ text: promptUser }] }
];

let currentResponse = await callComRetry(history);

console.log("\n🎯 Pedido inicial enviado");
console.log("Resposta:", JSON.stringify(currentResponse));

let step = 1;
const MAX_STEPS = 10;

while (currentResponse.functionCalls?.length && step <= MAX_STEPS) {
  console.log(`\n🔁 STEP ${step}`);
  console.log("📋 Funções solicitadas pelo Gemini:", currentResponse.functionCalls.map(f => f.name));

  const functionResults = [];

  for (const fn of currentResponse.functionCalls) {
       let result;

    switch (fn.name) {
      case 'add_viagem':
        const [resultado] = await db.execute(
            'INSERT INTO viagens (nome) VALUES (?)',
            [fn.args.nome]
        );
        result = { viagem_id: resultado.insertId };
        break;


      case 'add_itinerario':
        await db.execute(
            'INSERT INTO itinerario (viagem_id, dia, local_nome, transporte, descricao) VALUES (?, ?, ?, ?, ?)',
            [fn.args.viagem_id, fn.args.dia, fn.args.local_nome, fn.args.transporte, fn.args.descricao]
        );
        result = { status: 'Itinerário adicionado' };
        break;

        case 'get_viagens':
          const [viagens] = await db.execute(
            'SELECT * FROM viagens'
          );
          result = { viagens: viagens };
          break;

        case 'get_itinerario':
        const v_id = fn.args.viagem_id || fn.args.id;
        console.log("🔍 Buscando itinerário para viagem_id:", v_id);

        if (!v_id) {
          console.error("❌ Erro: O Gemini não enviou nenhum ID para o itinerário.")
          result = { error: 'ID da viagem é necessário para buscar o itinerário' };
        } else {
          try {
            const [dias] = await db.execute(
              'SELECT * FROM itinerario WHERE viagem_id = ? ',
              [v_id]
            );
            console.log("📋 Dias encontrados:", dias);
            result = { dias: dias };
          } catch (dbError) {
            console.error("❌ Erro na BD ao buscar itinerário:", dbError);
            result = { error: 'Erro ao buscar itinerário na base de dados' };
          }
        }
        break;

        case 'update_viagem':
          await db.execute(
            'UPDATE viagens SET nome = ? WHERE id = ?',
            [fn.args.nome, fn.args.id]
        );
        result = { status: 'Viagem atualizada!' };
        break;

        case 'update_itinerario':
          if(fn.args.local_nome){
            await db.execute(
              'UPDATE itinerario SET local_nome = ? WHERE id = ?'
              , [fn.args.local_nome, fn.args.id]
            );
          }
          if(fn.args.transporte){
            await db.execute(
              'UPDATE itinerario SET transporte = ? WHERE id = ?',
              [ fn.args.transporte, fn.args.id ]
            );
          }
          if(fn.args.descricao){
            await db.execute(
              'UPDATE itinerario SET descricao = ? WHERE id = ?',
            [ fn.args.descricao, fn.args.id ]
            );
          }
          result = { status: 'Intinerário atualizado!' };
          break;

        case 'delete_viagem':
        await db.execute(
            'DELETE from viagens WHERE id = ?',
            [fn.args.id]
        );
        result = { status: 'Viagem apagada!' };
        break;

        case 'delete_itinerario':
        await db.execute(
            'DELETE from itinerario WHERE id = ?',
            [fn.args.id]
        );
        result = { status: 'Dia apagado!' };
        break;

      default:
        result = { error: 'Unknown function' };
    }

    console.log(`✅ Executada: ${fn.name}`, result);
    functionResults.push({ name: fn.name, response: result });
  };

  console.log("📤 Enviando resultados ao Gemini:", JSON.stringify(functionResults, null, 2));

  try {
     history.push(currentResponse.candidates[0].content);
     history.push({
       role: 'user',
       parts: functionResults.map(fr => ({
         functionResponse: fr
       }))
     });

     // Pausa entre chamadas para respeitar o rate limit do plano gratuito
     await sleep(2000);

     currentResponse = await callComRetry(history);
     console.log(`📥 Resposta recebida no Step ${step}:`, JSON.stringify(currentResponse, null, 2));

    } catch (error) {
    console.error(`❌ Erro no Step ${step}:`, error.message);
    return res.status(500).json({ erro: `Erro no step ${step}: ${error.message}` });
  }
  console.log("Iterando...");
  step++;
}

console.log(`Loop terminado. Step final: ${step}, functionCalls length: ${currentResponse.functionCalls?.length}`);
console.log("\n🏁 Resposta FINAL:", JSON.stringify(currentResponse, null, 2));

const parts = currentResponse.candidates?.[0]?.content?.parts ?? [];
const textPart = parts.find(p => p.text);
res.json({ resposta: textPart?.text || 'Ação executada com sucesso!' });

}   