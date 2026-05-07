import db from '../db.js';
import { callGeminiRoteiro } from '../services/gemineService.js';


export async function criarRoteiroController(req, res) {
    const { mensagem } = req.body;

    try {
        // 1. Chamar o Gemini para gerar o itinerário
        const respostaTexto = await callGeminiRoteiro(mensagem);
        const dados = JSON.parse(respostaTexto);

        // 3. Guardar cada dia na BD
        for (let i = 0; i < dados.itinerario.length; i++) {
            const item = dados.itinerario[i];
            await db.execute(
                'INSERT INTO itinerario (viagem_nome, dia, local_nome, transporte, descricao) VALUES (?, ?, ?, ?,?)',
                [dados.viagem_nome, item.dia, item.local, item.transporte, item.descricao]
            );
        }

        // 4. Devolver ao frontend
        res.json(dados);

    } catch (erro) {
        console.error('Erro ao criar roteiro:', erro);
        res.status(500).json({ erro: 'Erro ao criar roteiro' });
    }
}

export async function getItinerariosController(req, res) {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM itinerario ORDER BY viagem_nome, dia ASC'
        );

        res.json(rows);

    } catch (erro) {
        console.error('Erro ao buscar itinerários:', erro);
        res.status(500).json({ erro: 'Erro ao buscar itinerários' });
    }
}

export async function apagarItemController(req, res) {
    const { id } = req.params;

    try {
        await db.execute('DELETE FROM itinerario WHERE id = ?', [id]);
        res.json({ mensagem: 'Item apagado com sucesso!' });
    } catch (erro) {
        console.error('Erro ao apagar item:', erro);
        res.status(500).json({ erro: 'Erro ao apagar item' });
    }
}