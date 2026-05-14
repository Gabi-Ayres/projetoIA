import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const MODEL_NAME =  'gemini-3.1-flash-lite';

//'gemini-2.0-flash';

//'gemini-3-flash-preview';
//gemini-2.5-flash-lite;
//gemini-3.1-flash-lite;
//   "gemini-3.1-pro",
//   "gemini-2.5-pro",
//   "gemini-3-flash",
//  "gemini-2.5-flash",
//   "gemini-3.1-flash-lite",
//   "gemini-2-flash",
//   "gemini-2-flash-lite",
//   "gemini-2.5-flash-lite"


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export { ai, MODEL_NAME };
