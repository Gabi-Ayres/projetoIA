const BASE_URL = 'http://localhost:3000';


async function enviarMensagem() {
    const mensagem = document.getElementById('input-mensagem').value;

    if (mensagem === '') return;

    adicionarMensagemUtilizador(mensagem);
    document.getElementById('input-mensagem').value = '';
    document.getElementById('btn-enviar').disabled = true;

    // cria div do bot vazia para ir preenchendo
    const divBot = adicionarMensagemBot('');

    // usa EventSource para receber o stream
    const eventSource = new EventSource('http://localhost:3000/api/chat?message=' + encodeURIComponent(mensagem));

   eventSource.onmessage = function(evento) {
    if (evento.data === '[DONE]') {
        eventSource.close();
        document.getElementById('btn-enviar').disabled = false;
        
        // chamar o POST para criar e guardar o itinerário
        fetch(BASE_URL + '/api/roteiro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: mensagem })
        })
        .then(function(resposta) {
            return resposta.json();
        })
        .then(function(dados) {
            console.log('Itinerário criado:', dados);
            carregarItinerariosDaBD(); // ← agora vai buscar e mostrar
        });

    } else {
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
    const resposta   = await fetch('http://localhost:3000/api/roteiro');
    const itinerarios = await resposta.json();

    if (itinerarios.length === 0) {
        return;
    }

    document.getElementById('sem-roteiro').style.display = 'none';
    document.getElementById('lista-roteiro').innerHTML = '';

    // agrupar por viagem_nome
    const viagens = {};
    for (let i = 0; i < itinerarios.length; i++) {
        const item = itinerarios[i];

        if (!viagens[item.viagem_nome]) {
            viagens[item.viagem_nome] = [];
        }
        viagens[item.viagem_nome].push(item);
    }

    // mostrar cada viagem
    for (const nomeViagem in viagens) {
        let html = '<div class="cartao-viagem">'
            + '<div class="cabecalho-viagem">✈️ ' + nomeViagem + '</div>';

        const dias = viagens[nomeViagem];
        for (let i = 0; i < dias.length; i++) {
            const dia = dias[i];
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

async function apagarItem(id) {
    await fetch(BASE_URL + '/api/roteiro/' + id, { method: 'DELETE' });

    document.getElementById('item-' + id).remove();

    const lista = document.getElementById('lista-roteiro');
    if (lista.children.length === 0) {
        document.getElementById('sem-roteiro').style.display = 'block';
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

window.onload = function() {
    carregarItinerariosDaBD(); // ← nome atualizado
};