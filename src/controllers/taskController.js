import db from '../db.js';
import { createTask, refineTask, summarizeTask, suggestTags, callGeminiStream, streamMeetingSummary, triageBugs } from '../services/aiService.js';

export async function create(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text é obrigatório' });
    }
    const result = await createTask(text);
    if (!result) {
      return res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
}

export async function refine(req, res) {
  try {
    const { task } = req.body;
    if (!task) {
      return res.status(400).json({ error: 'task é obrigatório' });
    }
    const result = await refineTask(task);
    if (!result) {
      return res.status(500).json({ error: 'Erro ao refinar tarefa' });
    }
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao refinar tarefa' });
  }
}

export async function summarize(req, res) {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description é obrigatória' });
    }
    const result = await summarizeTask(description);
    if (!result) {
      return res.status(500).json({ error: 'Erro ao gerar resumo' });
    }
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar resumo' });
  }
}

export async function suggestTagsController(req, res) {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'description é obrigatória' });
    }
    const result = await suggestTags(description);
    if (!result) {
      return res.status(500).json({ error: 'Erro ao sugerir tags' });
    }
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao sugerir tags' });
  }
}

/* export async function chatMessageController(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text é obrigatória' });
    }
    const result = await chatMessage();
  
    return res.json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro de execução' });
  }
} */

export async function chatStreamController(req, res) {
  const userMessage = req.query.message;
  if (!userMessage) {
    return res.status(400).send('Missing message parameter');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const result = await callGeminiStream(userMessage);
    let fullResponse = '';

    for await (const chunk of result) {
      const text = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
      if (text) {
        console.log(text);
        res.write(`data: ${text}\n\n`);
        fullResponse += text;
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    await db.execute('INSERT INTO chat_history (user_message, ai_response) VALUES (?, ?)', [userMessage, fullResponse]);
  } catch (error) {
    console.error('Error in chat stream:', error);
    res.write('data: Error occurred\n\n');
    res.end();
  }
}

// exercicio 03

export async function meetingSummariesController (req, res) {
  const { text, project_id } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // indicador de processamento
  res.write("data: A processar pontos chave...\n\n");

  let fullSummary = ""; // guarda os pedacinhos das frases/palavras que a Ia está a construir para não ser esquecido e assim ao final ser salvo no BD.

  const streamResult = await streamMeetingSummary(text); // chama o geminai

  for await (const chunk of streamResult) {
    const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (chunkText) {
      fullSummary += chunkText;
      console.log(`Ver como está a funcionar: ${chunkText}\n\n`);
      res.write(`data: ${chunkText}\n\n`);
    }
  }

  res.write("data: [DONE]\n\n");

  await db.execute('INSERT INTO meeting_summaries (project_id, original_text, summary) VALUES (?, ?, ?)', [project_id, text, fullSummary]);
 console.log(`Guardado na Base de Dados. FIM\n\n`)
  res.end();

};

// Exercicio 04

export async function triageBugController(req, res) {
  const { error_report_text } = req.body; // o utilizador envia o text de erro

  if (!error_report_text) {
    return res.status(400).json({ 
      success: false, 
      message: "O texto do reporte de erro é obrigatório." 
    });
  }

  try {
    console.log(`[TRIAGE] Iniciando análise de novo bug...`);

    const triagedData = await triageBugs(error_report_text);

    console.log(`[TRIAGE] Análise da IA concluída:`, triagedData);

    let automationStatus = {
      ticket_inserted: false,
      message: "Análise concluída. Gravidade baixa/média, ticket não gerado automaticamente."
    };

    if (triagedData.severity >= 8) {
      console.log(`[AUTOMAÇÃO] Bug CRÍTICO detectado (Gravidade: ${triagedData.severity}). Gravando na tabela 'tickets'...`);

      
       await db.execute('INSERT INTO tickets (original_error_report, error_type, severity, fix_suggestion ) VALUES (?, ?, ?, ?)', [error_report_text,  triagedData.erro_type, triagedData.severity, triagedData.fix_sugestion ]);


      console.log(`[AUTOMAÇÃO] Ticket gravado com sucesso no banco de dados.`);
      
      automationStatus.ticket_inserted = true;
      automationStatus.message = "Bug crítico detectado e inserido automaticamente na tabela de tickets.";
    }

    res.json({
      success: true,
      triage_analysis: triagedData, // O JSON estruturado gerado pela IA
      automation: automationStatus   // O resultado da lógica de negócio
    });

  } catch (error) {
    console.error("ERRO CRÍTICO NO CONTROLLER DE TRIAGE:", error);
    
    // Se a função triageBugs falhar ao fazer JSON.parse, o erro cai aqui.
    res.status(500).json({ 
      success: false, 
      message: "Erro interno ao processar a triage automática de bugs.",
      error: error.message 
    });
  }
}