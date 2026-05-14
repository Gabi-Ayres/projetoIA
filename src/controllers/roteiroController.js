import db from '../db.js';
import { callGeminiRoteiro } from '../services/gemineService.js';

async function criarViagem(dados) {
    const [resultado] = await db.execute(
        'INSERT INTO viagens (nome) VALUES (?)',
        [dados.viagem_nome]
    );
    const viagemId = resultado.insertId;

    for (let i = 0; i < dados.itinerario.length; i++) {
        const item = dados.itinerario[i];
        await db.execute(
            'INSERT INTO itinerario (viagem_id, dia, local_nome, transporte, descricao) VALUES (?, ?, ?, ?, ?)',
            [viagemId, item.dia, item.local, item.transporte, item.descricao]
        );
    }
}

async function apagarViagem(id) {
    await db.execute('DELETE FROM viagens WHERE id = ?', [id]);
}

async function apagarDia(id) {
    await db.execute('DELETE FROM itinerario WHERE id = ?', [id]);
}

async function editarViagem(id, nome) {
    await db.execute('UPDATE viagens SET nome = ? WHERE id = ?', [nome, id]);
}

async function pesquisarViagens() {
    const [viagens] = await db.execute('SELECT * FROM viagens');
    return viagens;
}



export async function roteiroController(req, res) {
    const { mensagem } = req.body;

    try {
        const respostaTexto = await callGeminiRoteiro(mensagem);
        const dados = JSON.parse(respostaTexto);

        console.log('Dados recebidos do Gemini:', dados);

        try {
            switch (dados.action) {
                case 'CREATE':
                    await criarViagem(dados);
                    break;

                case 'DELETE':
                    await apagarViagem(dados.viagem_id);
                    break;

                case 'DELETE_DIA':
                    await apagarDia(dados.dia_id);
                    break;

                case 'UPDATE':
                    await editarViagem(dados.viagem_id, dados.viagem_nome);
                    break;

                case 'SEARCH': {
                    const viagens = await pesquisarViagens();
                    const respostaSearch = await callGeminiRoteiro(
                        mensagem + '\n\nViagens existentes: ' + JSON.stringify(viagens)
                    );
                    const dadosSearch = JSON.parse(respostaSearch);
                    console.log('Dados Search:', dadosSearch)

                    if (dadosSearch.action === 'DELETE') {
                      await apagarViagem(dadosSearch.viagem_id);
                 }
                     if (dadosSearch.action === 'UPDATE') {
                    await editarViagem(dadosSearch.viagem_id, dadosSearch.viagem_nome);
          }
                  await db.execute(
        'INSERT INTO chat_history (user_message, ai_response, tipo) VALUES (?, ?, ?)',
        [mensagem, dadosSearch.resposta, 'roteiro']
    );


                    return res.json({ resposta: dadosSearch.resposta, action: dadosSearch.action });
                      console.log('Dados Search:', dadosSearch)
                }
                case 'NONE':
                    break;
            }

        } catch (erroDb) {
            console.error('Erro na BD:', erroDb.message);
            return res.status(500).json({ erro: '❌ Erro na base de dados!' });
        }

        res.json({ resposta: dados.resposta, action: dados.action });

    } catch (erro) {
        console.error('Erro:', erro.message);

        if (erro.message === 'GEMINI_RATE_LIMIT') {
            return res.status(429).json({ erro: '❌ Demasiados pedidos. Aguarda um momento!' });
        }
        if (erro.message === 'GEMINI_UNAVAILABLE') {
            return res.status(503).json({ erro: '❌ Serviço temporariamente indisponível!' });
        }
        if (erro.message === 'GEMINI_ERROR') {
            return res.status(500).json({ erro: '❌ Erro ao comunicar com a IA!' });
        }

        res.status(500).json({ erro: '❌ Erro inesperado. Tenta novamente!' });
    }
}



export async function getItinerariosController(req, res) {
    try {

        const [rows] = await db.execute(`
            SELECT 
                viagens.id AS viagem_id,
                viagens.nome AS viagem_nome,
                itinerario.id,
                itinerario.dia,
                itinerario.local_nome,
                itinerario.transporte,
                itinerario.descricao
            FROM viagens
            JOIN itinerario ON viagens.id = itinerario.viagem_id
            ORDER BY viagens.id, itinerario.dia ASC
        `);

        res.json(rows);

    } catch (erro) {
        console.error('Erro ao buscar itinerários:', erro);
        res.status(500).json({ erro: 'Erro ao buscar itinerários' });
    }
}

export async function apagarViagemController(req, res) {
    const { id } = req.params;

    try {
        await db.execute('DELETE FROM viagens WHERE id = ?', [id]);
        res.json({ mensagem: 'Viagem apagada com sucesso!' });
    } catch (erro) {
        console.error('Erro ao apagar item:', erro);
        res.status(500).json({ erro: 'Erro ao apagar item' });
    }
}

export async function apagarItemController(req, res) {
    const { id } = req.params;

    try {
        await db.execute('DELETE FROM itinerario WHERE id = ?', [id]);
        res.json({ mensagem: 'Item apagado com sucesso!' });

    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao apagar item' });
    }
}