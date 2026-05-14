import { callGeminiStream } from "../services/gemineService.js";
import db from "../db.js";

export async function chatStreamController(req, res) {
    // recebe a mensagem do utilizador
    const userMessage = req.query.message;

  if (!userMessage) {
    return res.status(400).send('Missing message parameter');
  }

  // configura o streamming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    // chama o Gemini e recebe a resporta em streaming
    const result = await callGeminiStream(userMessage);
    let fullResponse = '';

    // vai enviado a medida q chega
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        console.log(text);
        res.write(`data: ${text}\n\n`);
        fullResponse += text;
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    await db.execute('INSERT INTO chat_history (user_message, ai_response, tipo) VALUES (?, ?, ?)', [userMessage, fullResponse, 'chat']);
  } catch (error) {
     console.error('Erro no chat stream:', error.message);

        if (error.message === 'GEMINI_RATE_LIMIT') {
            res.write('data: ❌ Demasiados pedidos. Aguarda um momento!\n\n');
        } else if (error.message === 'GEMINI_UNAVAILABLE') {
            res.write('data: ❌ Serviço temporariamente indisponível!\n\n');
        } else if (error.message === 'GEMINI_ERROR') {
            res.write('data: ❌ Erro ao comunicar com a IA!\n\n');
        } else {
            res.write('data: ❌ Erro inesperado. Tenta novamente!\n\n');
        }

        res.end();
  }
}

export async function getHistoricoController(req, res) {
  try { 
  const [rows] = await db.execute(
        'SELECT * FROM chat_history ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (error) {
     console.error('Erro ao buscar histórico:', error.message);
        res.status(500).json({ erro: 'Erro ao buscar histórico!' });
  }
}

