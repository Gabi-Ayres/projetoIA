import { callGeminiStream } from "../services/gemineService.js";
import db from "../db.js";

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