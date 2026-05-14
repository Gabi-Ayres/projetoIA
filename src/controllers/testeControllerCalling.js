
import { chat  } from '../services/testeFuncionCalling.js';
import db from '../db.js';


export async function testeControllerCalling(req, res) {

const promptUser = req.body.mensagem;

let currentResponse = await chat.sendMessage({
    message: promptUser
});
console.log("\n🎯 Pedido inicial enviado");
console.log("Resposta:", JSON.stringify(currentResponse));

let step = 1;
const MAX_STEPS = 5; // proteção contra loop infinito ... limite de interações do modelo.

while (currentResponse.functionCalls?.length && step <= MAX_STEPS) { 
  console.log(`\n🔁 STEP ${step}`);
  console.log("📋 Funções solicitadas pelo Gemini:", currentResponse.functionCalls.map(f => f.name));
  console.log("Funções pedidas pelo modelo:");

  const functionResults = [];
    
  // Mostrar chamadas
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

  console.log("Encaminhando resultados para o Gemini...")
  console.log("📤 Enviando ao Gemini:", JSON.stringify(functionResults, null, 2));
  
  try {
   /*  currentResponse = await Promise.race([
      chat.sendMessage({
        message: {
          role: 'tool',
          parts: functionResults.map(fr => ({
            functionResponse: fr
          }))
        }
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Gemini demorou muito tempo')), 30000))
    ]);
 */
  currentResponse = await 
      chat.sendMessage({
        message: {
          role: 'tool',
          parts: functionResults.map(fr => ({
            functionResponse: fr
          }))
        }
      })
  } catch (error) {
    console.error(`❌ Erro no Step ${step}:`, error.message);
    return res.status(500).json({ erro: `Erro no step ${step}: ${error.message}` });
  }
  console.log("Iterando...");

  step++;
}
console.log("\n🏁 Resposta FINAL:");

res.json({ resposta: currentResponse.text});
console.log("\n🏁 FINAL:");
console.log(currentResponse.text);

}  