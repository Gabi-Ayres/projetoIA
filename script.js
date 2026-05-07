async function enviarMensagem() {

    // Ler o texto do input
    const mensagem = document.getElementById('input-mensagem').value;

    // Se estiver vazio, não faz nada
    if (mensagem === '') {
        return;
    }

    // Mostrar a mensagem do utilizador no chat
    adicionarMensagemUtilizador(mensagem);

    // Limpar o input e desativar o botão
    document.getElementById('input-mensagem').value = '';
    document.getElementById('btn-enviar').disabled = true;

    // Mostrar "a pensar..."
    adicionarMensagemBot('⏳ A pensar...', 'msg-loading');

    // Enviar para o backend
    const resposta = await fetch('/api/chat/mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: mensagem })
    });

    const dados = await resposta.json();

    // Remover o "a pensar..." e mostrar a resposta
    document.getElementById('msg-loading').remove();
    adicionarMensagemBot(dados.resposta);

    // Se veio itinerário, mostrar na lista
    if (dados.itinerario.length > 0) {
        mostrarItinerario(dados.itinerario);
    }

    // Reativar o botão
    document.getElementById('btn-enviar').disabled = false;
}

// -----------------------------------------------
// Mostrar mensagem do utilizador no chat
// -----------------------------------------------
function adicionarMensagemUtilizador(texto) {
    const areaMensagens = document.getElementById('area-mensagens');

    const div = document.createElement('div');
    div.classList.add('mensagem', 'mensagem-utilizador');
    div.innerHTML = '<div class="texto-mensagem">' + texto + '</div>';

    areaMensagens.appendChild(div);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
}

// -----------------------------------------------
// Mostrar mensagem do bot no chat
// -----------------------------------------------
function adicionarMensagemBot(texto, id) {
    const areaMensagens = document.getElementById('area-mensagens');

    const div = document.createElement('div');
    div.classList.add('mensagem', 'mensagem-bot');

    // Se tiver id, adiciona (usado para remover o "a pensar...")
    if (id) {
        div.id = id;
    }

    div.innerHTML = '<span class="icone-bot">🤖</span><div class="texto-mensagem">' + texto + '</div>';

    areaMensagens.appendChild(div);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
}

// -----------------------------------------------
// Mostrar o itinerário na coluna da direita
// -----------------------------------------------
function mostrarItinerario(itinerario) {
    document.getElementById('sem-itinerario').style.display = 'none';
    document.getElementById('lista-itinerario').innerHTML = '';

    for (let i = 0; i < itinerario.length; i++) {
        const item = itinerario[i];

        let cartao = '<div class="cartao-dia">'
            + '<div class="cabecalho-dia">📅 Dia ' + item.dia + '</div>'
            + '<div class="conteudo-dia">'
            + '<div class="local-nome">📍 ' + item.local + '</div>'
            + '<div class="local-transporte">🚌 ' + item.transporte + '</div>'
            + '<div class="local-descricao">' + item.descricao + '</div>'
            + '</div>'
            + '</div>';

        document.getElementById('lista-itinerario').innerHTML += cartao;
    }

    // Recarregar da BD para ter os IDs reais (para poder apagar)
    carregarItinerarioDaBD();
}

// -----------------------------------------------
// Carregar itinerário guardado na base de dados
// -----------------------------------------------
async function carregarItinerarioDaBD() {
    const resposta   = await fetch('/api/itinerario');
    const itinerario = await resposta.json();

    if (itinerario.length === 0) {
        return;
    }

    document.getElementById('sem-itinerario').style.display = 'none';
    document.getElementById('lista-itinerario').innerHTML = '';

    for (let i = 0; i < itinerario.length; i++) {
        const item = itinerario[i];

        let cartao = '<div class="cartao-dia" id="item-' + item.id + '">'
            + '<div class="cabecalho-dia">📅 Dia ' + item.dia + '</div>'
            + '<div class="conteudo-dia">'
            + '<div class="local-nome">📍 ' + item.local_nome + '</div>'
            + '<div class="local-transporte">🚌 ' + item.transporte + '</div>'
            + '<div class="local-descricao">' + item.descricao + '</div>'
            + '<button class="btn-apagar" onclick="apagarItem(' + item.id + ')">🗑️ Remover</button>'
            + '</div>'
            + '</div>';

        document.getElementById('lista-itinerario').innerHTML += cartao;
    }
}

// -----------------------------------------------
// Apagar um item do itinerário
// -----------------------------------------------
async function apagarItem(id) {
    await fetch('/api/itinerario/' + id, { method: 'DELETE' });

    document.getElementById('item-' + id).remove();

    const lista = document.getElementById('lista-itinerario');
    if (lista.children.length === 0) {
        document.getElementById('sem-itinerario').style.display = 'block';
    }
}

// -----------------------------------------------
// Limpar a conversa e recomeçar
// -----------------------------------------------
async function limparConversa() {
    const confirmar = confirm('Recomeçar a conversa?');

    if (confirmar === false) {
        return;
    }

    await fetch('/api/chat/limpar', { method: 'DELETE' });

    document.getElementById('area-mensagens').innerHTML = '';
    adicionarMensagemBot('Conversa reiniciada 🔄 Para onde queres viajar?');

    document.getElementById('lista-itinerario').innerHTML = '';
    document.getElementById('sem-itinerario').style.display = 'block';
}

// -----------------------------------------------
// Enviar com a tecla Enter
// -----------------------------------------------
function verificarEnter(evento) {
    if (evento.key === 'Enter') {
        enviarMensagem();
    }
}

// -----------------------------------------------
// Quando a página carrega, buscar itinerário
// -----------------------------------------------
window.onload = function() {
    carregarItinerarioDaBD();
};