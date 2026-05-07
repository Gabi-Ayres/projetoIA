import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-3-flash-preview';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export { ai, MODEL_NAME };
