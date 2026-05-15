# Projeto - Travel Planner IA
## Nome: Gabriella Ayres

# Mini Travel Planner

Assistente de viagens com IA que permite criar, editar e apagar itinerários através de conversa em linguagem natural.

## Como funciona

O utilizador conversa com o TravelBot. Quando pede uma ação (criar viagem, adicionar dia, etc.), o sistema usa **function calling** do Gemini para executar a operação na base de dados automaticamente.

## Tecnologias

- **Backend:** Node.js + Express
- **IA:** Google Gemini (`@google/genai`)
- **Base de dados:** MySQL
- **Frontend:** HTML + CSS + JavaScript vanilla

## Instalação e Configuração

1. Clone o repositório:
   git clone https://github.com/Gabi-Ayres/projetoIA.git 
   Branch: projetoFinal

2. Acesse a pasta do projeto:
   cd [PROJETO-GEMINI]

3. Instale as dependências:
   npm install

## Instalação

Criar ficheiro `.env` na raiz:

```env
GEMINI_API_KEY=a_tua_chave
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=a_tua_password
DB_NAME=nome_da_bd
```
`

## Iniciar

```bash
npm start
```

Servidor disponível em `http://localhost:3000`. Abrir `frontEnd/index.html` no browser.

