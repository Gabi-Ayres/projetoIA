import 'dotenv/config';
import { ai, MODEL_NAME } from '../src/config/gemini.js';

const comments = [
  'Estou a tentar terminar a integração da API, mas falta-me informação do cliente.',
  'A entrega do design atrasou porque dependo de feedback do marketing.',
  'Preciso de mais tempo para testar este componente antes de subir.',
  'O sprint está a correr bem, mas ainda há muita dívida técnica.',
  'Sinto-me pressionado com as tarefas que mudam de prioridade.',
  'O time está colaborando bem, mas o prazo parece apertado.',
  'Estou a bloquear na configuração do servidor de testes.',
  'Estou a fazer progressos, mas ainda falta validar os dados.',
  'A comunicação entre equipas poderia ser mais clara.',
  'O problema principal é a falta de requisitos fixos.',
  'Sinto-me confortável com a parte técnica, mas o escopo muda.',
  'Tenho medo de não conseguir entregar tudo até sexta.',
  'O cliente pediu alterações de última hora novamente.',
  'A equipa está motivada, mas cansada após várias entregas.',
  'O maior bloqueio é a dependência de outro time.',
  'Estou a ficar stressado com tantas revisões de código.',
  'O ambiente de desenvolvimento está estável e funcional.',
  'A tarefa está clara, só preciso de tempo para finalizar.',
  'Precisamos de mais reuniões para alinhar prioridades.',
  'O risco de burnout é real se continuarmos neste ritmo.',
];

const prompt = `Analise os últimos 20 comentários da equipa e responda apenas com JSON puro no formato:\n` +
`{\n  "team_mood": "happy" | "stressed" | "neutral",\n  "main_blocker": "string",\n  "burnout_risk": boolean\n}\n\n` +
`Comentários:\n${comments.map((comment, index) => `${index + 1}. ${comment}`).join('\n')}`;

async function main() {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    console.error('Nenhuma resposta recebida do Gemini.');
    return;
  }

  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    const dashboard = JSON.parse(cleaned);
    console.log(JSON.stringify(dashboard, null, 2));
  } catch (error) {
    console.error('Erro ao parsear JSON da resposta:');
    console.error(cleaned);
    console.error(error);
  }
}

main();

