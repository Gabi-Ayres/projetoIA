import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

let history = [];

/* async function chatGeminai(userMensagem) {
  history.push({ role: "user", parts: [{ text: userMensagem }] });
  console.log(history);

  const chat = ai.chats.create({
    model: "gemini-2.5-flash-lite",
    history: [
      { role: "user", parts: [{ text: "hello" }] },
      { role: "model", parts: [{ text: "O que vamos fazer?" }] },
    ],
  });

  const response1 = await chat.sendMessage({
    message: "Eu tenho dois filhos",
  });
  console.log("chat response 1:", response1.text);
  const response2 = await chat.sendMessage({
    message: "O que queres?",
  });
  console.log("chat response 2:", response2.text);
}

await chatGeminai(); */

async function chatMessage(userMessage) {
    history.push({role: "user", parts:[{text: userMessage}]}) // aqui para guardar a resposta do user
  
    const historyLimited = history.slice(-5); // para resolver o exercicio 6
   
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: historyLimited, 
        config: {
        systemInstruction: "És um assistente virtual e deves responder objetivamente."
        }
            
})
    const responseText = response.candidates[0].content.parts[0].text.trim();
    console.log(responseText)

        history.push({role: "model", parts:[{text: responseText}]})// aqui está a guardar a resposta da IA

}

await chatMessage("O meu nome é Ana");
await chatMessage("Trabalho em marketing");
await chatMessage("Como me chamo?");
