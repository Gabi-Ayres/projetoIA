
import { chat  } from '../services/testeFuncionCalling.js';
import db from '../db.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function testeControllerCalling(req, res) {

const promptUser = req.body.mensagem;

let currentResponse = await chat.sendMessage({
    message: promptUser
});
console.log("\n🎯 Pedido inicial enviado");
console.log("Resposta:", JSON.stringify(currentResponse));

let step = 1;
const MAX_STEPS = 10;

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

  console.log("📤 Enviando ao Gemini:", JSON.stringify(functionResults, null, 2));

  // Plano gratuito: ~15 RPM → mínimo 4s entre chamadas. Usamos 5s para ter margem.
  console.log(`⏳ A aguardar 5s (limite do plano gratuito)...`);
  await sleep(5000);

  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 60000)
    );

    currentResponse = await Promise.race([
      chat.sendMessage({
        message: {
          role: 'tool',
          parts: functionResults.map(fr => ({ functionResponse: fr }))
        }
      }),
      timeout
    ]);

    console.log(`📥 Resposta recebida no Step ${step}`);

  } catch (error) {
    if (error.message === 'TIMEOUT') {
      console.error(`❌ Step ${step}: Gemini não respondeu em 60s`);
      return res.status(504).json({ erro: '❌ O Gemini demorou demasiado tempo. Tenta com uma viagem mais curta.' });
    }
    const isRateLimit = error.status === 429 || error.message?.includes('429');
    if (isRateLimit) {
      console.log('⏳ Rate limit atingido. A aguardar 15s antes de tentar novamente...');
      await sleep(15000);
      try {
        currentResponse = await chat.sendMessage({
          message: {
            role: 'tool',
            parts: functionResults.map(fr => ({ functionResponse: fr }))
          }
        });
      } catch (retryError) {
        console.error(`❌ Erro no retry do Step ${step}:`, retryError.message);
        return res.status(429).json({ erro: '❌ Demasiados pedidos ao Gemini. Aguarda um momento e tenta novamente.' });
      }
    } else {
      console.error(`❌ Erro no Step ${step}:`, error.message);
      return res.status(500).json({ erro: `Erro no step ${step}: ${error.message}` });
    }
  }
  console.log("Iterando...");

  step++;
}
console.log("\n🏁 Resposta FINAL:");

res.json({ resposta: currentResponse.text});
console.log("\n🏁 FINAL:");
console.log(currentResponse.text);

}  