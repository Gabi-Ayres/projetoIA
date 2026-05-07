import 'dotenv/config';
import { GoogleGenAI,  Type  } from '@google/genai';

// Define a function that the model can call to control smart lights
const createTaskFunctionDeclaration = {
  name: 'create_task',
  description: 'Creates a new task in the task management system from natural language.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Title of the task to be created.',
      },
      description: {
        type: Type.STRING,
        description: 'Describe the task.',
      },
     due_date: {
          type: Type.STRING,
          description: 'The due date for the task in YYYY-MM-DD ISO format',
        },
      priority: {
          type: Type.STRING,
          enum: ['urgent', 'high', 'normal', 'low'],
          description: 'The priority level of the task',
        },
    },
    required: ['title', 'description', 'due_date', 'priority'],
  },
};

/**
 * Set the brightness and color temperature of a room light. (mock API)
 * @param {number} brightness - Light level from 0 to 100. Zero is off and 100 is full brightness
 * @param {string} color_temp - Color temperature of the light fixture, which can be `daylight`, `cool` or `warm`.
 * @return {Object} A dictionary containing the set brightness and color temperature.
 */
function setLightValues(title, description, due_date, priority) {
  return {
    brightness: brightness,
    colorTemperature: color_temp
  };
}

// Generation config with function declaration
const config = {
  tools: [{
    functionDeclarations: [createTaskFunctionDeclaration]
  }]
};

// Configure the client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Define user prompt
const contents = [
  {
    role: 'user',
    parts: [{ text: 'Criar uma tarefa para para ir ao medicado segunda feira as 15hs não urgente. ' }]
  }
];

// Send request with function declarations
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: contents,
  config: config
});

console.log(response.functionCalls[0]);

//Extrair os detalhes da chamada de função da resposta do modelo, analise os argumentos e execute a função set_light_values.


// Extract tool call details
const tool_call = response.functionCalls[0]

let result;
if (tool_call.name === 'set_light_values') {
  result = setLightValues(tool_call.args.brightness, tool_call.args.color_temp);
  console.log(`Function execution result: ${JSON.stringify(result)}`);
}

// Create a function response part
const function_response_part = {
  name: tool_call.name,
  response: { result },
  id: tool_call.id
}

// Append function call and result of the function execution to contents
contents.push(response.candidates[0].content);
contents.push({ role: 'user', parts: [{ functionResponse: function_response_part }] });

// Get the final response from the model
const final_response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: contents,
  config: config
});

console.log(final_response.text);


