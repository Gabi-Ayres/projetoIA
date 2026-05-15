const BASE_URL = 'http://localhost:3000';



async function enviarMensagem() {
    const mensagem = document.getElementById('input-mensagem').value.trim();

    if (!mensagem) return;
    if (mensagem.length > 500) {
        adicionarMensagemBot('❌ Mensagem demasiado longa (máximo 500 caracteres).');
        return;
    }

    adicionarMensagemUtilizador(mensagem);
    document.getElementById('input-mensagem').value = '';
    document.getElementById('btn-enviar').disabled = true;

    // cria div do bot vazia para ir preenchendo
    const divBot = adicionarMensagemBot('');
    let respostaStreaming = '';

    // usa EventSource para receber o stream
    const eventSource = new EventSource('http://localhost:3000/api/chat?message=' + encodeURIComponent(mensagem));

   eventSource.onmessage = function(evento) {
    if (evento.data === '[DONE]') {
        eventSource.close();

        // só chama o function calling se o chatbot sinalizou uma ação
        const eUmaAcao = respostaStreaming.includes('processar');

        if (!eUmaAcao) {
            document.getElementById('btn-enviar').disabled = false;
            return;
        }

        // mostrar loading enquanto o function calling processa
        const divLoading = adicionarMensagemBot('⏳ A executar a ação...');

        fetch(BASE_URL + '/api/acao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: mensagem })
        })
        .then(function(resposta) {
            return resposta.json();
        })
        .then(function(dados) {
            console.log('Resposta function calling:', dados);
            divLoading.remove();

            if (dados.erro) {
                adicionarMensagemBot('❌ ' + dados.erro);
            } else if (dados.resposta) {
                adicionarMensagemBot(dados.resposta);
            }

            carregarItinerariosDaBD();
        })
        .catch(function(erro) {
            console.error('Erro no function calling:', erro);
            divLoading.remove();
            adicionarMensagemBot('❌ Erro ao executar a ação. Tenta novamente.');
        })
        .finally(function() {
            document.getElementById('btn-enviar').disabled = false;
        });

    } else {
        respostaStreaming += evento.data;
        divBot.querySelector('.texto-mensagem').innerHTML += evento.data;
    }
};
}

function adicionarMensagemBot(texto) {
    const areaMensagens = document.getElementById('area-mensagens');

    const div = document.createElement('div');
    div.classList.add('mensagem', 'mensagem-bot');
    div.innerHTML = '<span class="icone-bot">🤖</span><div class="texto-mensagem">' + texto + '</div>';

    areaMensagens.appendChild(div);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;

    return div; // ← importante para o streaming ir preenchendo
}
function adicionarMensagemUtilizador(texto) {
    const areaMensagens = document.getElementById('area-mensagens');

    const div = document.createElement('div');
    div.classList.add('mensagem', 'mensagem-utilizador');
    div.innerHTML = '<div class="texto-mensagem">' + texto + '</div>';

    areaMensagens.appendChild(div);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
}

async function carregarItinerariosDaBD() {
    const resposta   = await fetch('http://localhost:3000/api/acao');
    const itinerarios = await resposta.json();

     console.log('Itinerários recebidos:', itinerarios);

    if (itinerarios.length === 0) {
        return;
    }

    document.getElementById('sem-roteiro').style.display = 'none'; // esconder menssagem "sem roteiros" se houver itinerários para mostrar
    document.getElementById('lista-roteiro').innerHTML = ''; // limpar antes de mostrar os itinerários

    // agrupar por viagem_id
    const viagens = {};
    for (let i = 0; i < itinerarios.length; i++) {
        const item = itinerarios[i];

        if (!viagens[item.viagem_id]) {
            viagens[item.viagem_id] = {
                nome: item.viagem_nome,
                dias: []
            } 
        }
        viagens[item.viagem_id].dias.push(item);
    }

    // mostrar cada viagem
    for (const viagemId in viagens) {
        const viagem = viagens[viagemId];
        let html = '<div class="cartao-viagem" id="viagem-' + viagemId + '">'
            + '<div class="cabecalho-viagem">✈️ ' + viagem.nome 
            + '<button class="btn-apagar" onclick="apagarViagem(' + viagemId + ')">🗑️ Apagar</button>'
            + '</div>';

       
        for (let i = 0; i < viagem.dias.length; i++) {
            const dia = viagem.dias[i];
            html += '<div class="cartao-dia" id="item-' + dia.id + '">'
                + '<div class="cabecalho-dia">📅 Dia ' + dia.dia + '</div>'
                + '<div class="conteudo-dia">'
                + '<div class="local-nome">📍 ' + dia.local_nome + '</div>'
                + '<div class="local-transporte">🚌 ' + dia.transporte + '</div>'
                + '<div class="local-descricao">' + dia.descricao + '</div>'
                + '<button class="btn-apagar" onclick="apagarItem(' + dia.id + ')">🗑️ Remover</button>'
                + '</div>'
                + '</div>';
        }

        html += '</div>';
        document.getElementById('lista-roteiro').innerHTML += html;
    }
}

async function apagarViagem(id) {
    if (!confirm('Tens a certeza que queres apagar esta viagem e todos os seus dias?')) return;

    try {
        const resposta = await fetch(BASE_URL + '/api/acao/' + id, { method: 'DELETE' });
        if (!resposta.ok) throw new Error();
        document.getElementById('viagem-' + id).remove();
        const lista = document.getElementById('lista-roteiro');
        if (lista.children.length === 0) {
            document.getElementById('sem-roteiro').style.display = 'block';
        }
    } catch {
        alert('Erro ao apagar a viagem. Tenta novamente.');
    }
}

async function apagarItem(id) {
    if (!confirm('Tens a certeza que queres remover este dia?')) return;

    try {
        const resposta = await fetch(BASE_URL + '/api/acao/dia/' + id, { method: 'DELETE' });
        if (!resposta.ok) throw new Error();
        document.getElementById('item-' + id).remove();
    } catch {
        alert('Erro ao remover o dia. Tenta novamente.');
    }
}

async function limparConversa() {
    const confirmar = confirm('Recomeçar a conversa?');

    if (confirmar === false) {
        return;
    }

    await fetch('http://localhost:3000/api/chat/limpar', { method: 'DELETE' });

    document.getElementById('area-mensagens').innerHTML = '';
    adicionarMensagemBot('Conversa reiniciada 🔄 Para onde queres viajar?');
}

async function carregarHistoricoChat() {
    const resposta   = await fetch(BASE_URL + '/api/historico');
    const historico  = await resposta.json();

    for (let i = 0; i < historico.length; i++) {
        const item = historico[i];
        adicionarMensagemUtilizador(item.user_message);
        adicionarMensagemBot(item.ai_response);
    }
}

window.onload = function() {
    carregarItinerariosDaBD(); // ← nome atualizado
    carregarHistoricoChat();
};