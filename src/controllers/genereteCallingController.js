import { callGemniniCalling } from '../services/generetefuncionCalling.js'; 
import db from '../db.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFunctionCalls(response) {
  try {
    return response.candidates[0].content.parts
      .filter(p => p.functionCall)
      .map(p => p.functionCall);
  } catch {
    return [];
  }
}

export async function testeControllerCalling(req, res) {
  const promptUser = req.body.mensagem;

  let currentResponse = await callGemniniCalling(promptUser);
  console.log("\n🎯 Pedido inicial enviado");

  let step = 1;
  const MAX_STEPS = 5;
  let conversationHistory = [];

  let functionCalls = getFunctionCalls(currentResponse);
  console.log("🔍 functionCalls inicial:", functionCalls.map(f => f.name));

  while (functionCalls.length && step <= MAX_STEPS) { 
    console.log(`\n🔁 STEP ${step}`);
    console.log("📋 Funções solicitadas pelo Gemini:", functionCalls.map(f => f.name));

    conversationHistory.push(currentResponse.candidates[0].content);

    const functionResults = [];

    for (const fn of functionCalls) {
      let result;

      switch (fn.name) {
        case 'add_viagem': {
          const [resultado] = await db.execute(
            'INSERT INTO viagens (nome) VALUES (?)',
            [fn.args.nome]
          );
          result = { viagem_id: resultado.insertId };
          break;
        }

        case 'add_itinerario': {
          await db.execute(
            'INSERT INTO itinerario (viagem_id, dia, local_nome, transporte, descricao) VALUES (?, ?, ?, ?, ?)',
            [fn.args.viagem_id, fn.args.dia, fn.args.local_nome, fn.args.transporte, fn.args.descricao]
          );
          result = { status: 'Itinerário adicionado' };
          break;
        }

        case 'get_viagens': {
          const [viagens] = await db.execute('SELECT * FROM viagens');
          result = { viagens: viagens };
          break;
        }

        case 'get_itinerario': {
          const v_id = fn.args.viagem_id || fn.args.id;
          if (!v_id) {
            result = { error: 'ID da viagem é necessário' };
          } else {
            const [dias] = await db.execute(
              'SELECT * FROM itinerario WHERE viagem_id = ?', [v_id]
            );
            result = { dias: dias };
          }
          break;
        }

        case 'update_viagem': {
          await db.execute(
            'UPDATE viagens SET nome = ? WHERE id = ?',
            [fn.args.nome, fn.args.id]
          );
          result = { status: 'Viagem atualizada!' };
          break;
        }

        case 'update_itinerario': {
          if (fn.args.local_nome) {
            await db.execute('UPDATE itinerario SET local_nome = ? WHERE id = ?', [fn.args.local_nome, fn.args.id]);
          }
          if (fn.args.transporte) {
            await db.execute('UPDATE itinerario SET transporte = ? WHERE id = ?', [fn.args.transporte, fn.args.id]);
          }
          if (fn.args.descricao) {
            await db.execute('UPDATE itinerario SET descricao = ? WHERE id = ?', [fn.args.descricao, fn.args.id]);
          }
          result = { status: 'Itinerário atualizado!' };
          break;
        }

        case 'delete_viagem': {
          await db.execute('DELETE FROM viagens WHERE id = ?', [fn.args.id]);
          result = { status: 'Viagem apagada!' };
          break;
        }

        case 'delete_itinerario': {
          await db.execute('DELETE FROM itinerario WHERE id = ?', [fn.args.id]);
          result = { status: 'Dia apagado!' };
          break;
        }

        default:
          result = { error: 'Unknown function' };
      }

      console.log(`✅ Executada: ${fn.name}`, result);
      functionResults.push({ name: fn.name, response: result });
    }

    conversationHistory.push({
      role: 'user',
      parts: functionResults.map(fr => ({
        functionResponse: {
          name: fr.name,
          response: fr.response
        }
      }))
    });

    console.log("📤 Enviando ao Gemini com histórico local:", conversationHistory.length, "entradas");

    try {
      currentResponse = await callGemniniCalling(promptUser, conversationHistory);
    } catch (error) {
      console.error(`❌ Erro no Step ${step}:`, error.message);
      return res.status(500).json({ erro: `Erro no step ${step}: ${error.message}` });
    }

    functionCalls = getFunctionCalls(currentResponse);
    console.log("🔍 functionCalls após step:", functionCalls.map(f => f.name));

    await sleep(1000);
    step++;
  }

  console.log("\n🏁 Resposta FINAL:");
  const finalPart = currentResponse.candidates[0].content.parts[0];
  console.log("finalPart:", finalPart);

  res.json({ resposta: finalPart.text || 'Ação executada com sucesso!' });
}