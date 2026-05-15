import { chat } from "../services/acaoService.js";
import db from "../db.js";

// Controller para lidar com as ações solicitadas pelo Gemini
export async function acaoController(req, res) {
  const promptUser = req.body.mensagem?.trim();

  if (!promptUser) {
    return res.status(400).json({ erro: "Mensagem em falta." });
  }
  if (promptUser.length > 500) {
    return res
      .status(400)
      .json({ erro: "Mensagem demasiado longa (máximo 500 caracteres)." });
  }

  let currentResponse = await chat.sendMessage({
    message: promptUser,
  });
  console.log("\n🎯 Pedido inicial enviado");

  let step = 1;
  const MAX_STEPS = 5;

  // Loop para processar as chamadas de função do Gemini
  while (currentResponse.functionCalls?.length && step <= MAX_STEPS) {
    console.log(`\n🔁 STEP ${step}`);
    console.log(
      "📋 Funções solicitadas pelo Gemini:",
      currentResponse.functionCalls.map((f) => f.name),
    );

    const functionResults = [];
    // Processar cada função solicitada
    for (const fn of currentResponse.functionCalls) {
      let result;

      switch (fn.name) {
        case "add_viagem": {
          try {
            const [resultado] = await db.execute(
              "INSERT INTO viagens (nome) VALUES (?)",
              [fn.args.nome],
            );
            result = { viagem_id: resultado.insertId };
          } catch (err) {
            result = { error: `Erro ao adicionar viagem: ${err.message}` };
          }
          break;
        }

        case "add_itinerario": {
          try {
            await db.execute(
              "INSERT INTO itinerario (viagem_id, dia, local_nome, transporte, descricao) VALUES (?, ?, ?, ?, ?)",
              [
                fn.args.viagem_id,
                fn.args.dia,
                fn.args.local_nome,
                fn.args.transporte,
                fn.args.descricao,
              ],
            );
            result = { status: "Itinerário adicionado" };
          } catch (err) {
            result = { error: `Erro ao adicionar itinerário: ${err.message}` };
          }
          break;
        }

        case "get_viagens": {
          try {
            const [viagens] = await db.execute("SELECT * FROM viagens");
            result = { viagens: viagens };
          } catch (err) {
            result = { error: `Erro ao buscar viagens: ${err.message}` };
          }
          break;
        }

        case "get_itinerario": {
          const v_id = fn.args.viagem_id || fn.args.id;
          if (!v_id) {
            result = { error: "ID da viagem é necessário" };
          } else {
            try {
              const [dias] = await db.execute(
                "SELECT * FROM itinerario WHERE viagem_id = ?",
                [v_id],
              );
              result = { dias: dias };
            } catch (dbError) {
              result = { error: "Erro ao buscar itinerário" };
            }
          }
          break;
        }

        case "update_viagem": {
          try {
            await db.execute("UPDATE viagens SET nome = ? WHERE id = ?", [
              fn.args.nome,
              fn.args.id,
            ]);
            result = { status: "Viagem atualizada!" };
          } catch (err) {
            result = { error: `Erro ao atualizar viagem: ${err.message}` };
          }
          break;
        }

        case "update_itinerario": {
          try {
            if (fn.args.local_nome) {
              await db.execute(
                "UPDATE itinerario SET local_nome = ? WHERE id = ?",
                [fn.args.local_nome, fn.args.id],
              );
            }
            if (fn.args.transporte) {
              await db.execute(
                "UPDATE itinerario SET transporte = ? WHERE id = ?",
                [fn.args.transporte, fn.args.id],
              );
            }
            if (fn.args.descricao) {
              await db.execute(
                "UPDATE itinerario SET descricao = ? WHERE id = ?",
                [fn.args.descricao, fn.args.id],
              );
            }
            result = { status: "Itinerário atualizado!" };
          } catch (err) {
            result = { error: `Erro ao atualizar itinerário: ${err.message}` };
          }
          break;
        }

        case "delete_viagem": {
          try {
            await db.execute("DELETE FROM viagens WHERE id = ?", [fn.args.id]);
            result = { status: "Viagem apagada!" };
          } catch (err) {
            result = { error: `Erro ao apagar viagem: ${err.message}` };
          }
          break;
        }

        case "delete_itinerario": {
          try {
            await db.execute("DELETE FROM itinerario WHERE id = ?", [
              fn.args.id,
            ]);
            result = { status: "Dia apagado!" };
          } catch (err) {
            result = { error: `Erro ao apagar itinerário: ${err.message}` };
          }
          break;
        }

        default:
          result = { error: "Unknown function" };
      }

      console.log(`✅ Executada: ${fn.name}`, result);
      functionResults.push({ name: fn.name, response: result });
    }

    console.log(
      "📤 Enviando ao Gemini:",
      JSON.stringify(functionResults, null, 2),
    );
    // Enviar os resultados das funções de volta ao Gemini para a próxima iteração
    try {
      currentResponse = await chat.sendMessage({
        message: functionResults.map((fr) => ({
          functionResponse: {
            name: fr.name,
            response: fr.response,
          },
        })),
      });
    } catch (error) {
      console.error(`❌ Erro no Step ${step}:`, error.message);
      return res
        .status(500)
        .json({ erro: `Erro no step ${step}: ${error.message}` });
    }

    console.log("Iterando...");
    step++;
  }

  const respostaFinal = currentResponse.text || "Ação executada com sucesso!";
  // Atualizar a última resposta do Gemini no histórico da BD
  const [[ultima]] = await db.execute("SELECT MAX(id) AS id FROM chat_history");
  await db.execute("UPDATE chat_history SET ai_response = ? WHERE id = ?", [
    respostaFinal,
    ultima.id,
  ]);

  console.log("\n🏁 Resposta FINAL:");
  res.json({ resposta: respostaFinal });
  console.log("\n🏁 FINAL:", respostaFinal);
}
// Outros controllers para lidar com rotas adicionais (ex: listar viagens, itinerários, apagar itens)
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
    console.error("Erro ao buscar itinerários:", erro);
    res.status(500).json({ erro: "Erro ao buscar itinerários" });
  }
}

// Controller para listar todas as viagens
export async function apagarViagemController(req, res) {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  try {
    await db.execute("DELETE FROM viagens WHERE id = ?", [id]);
    res.json({ mensagem: "Viagem apagada com sucesso!" });
  } catch (erro) {
    console.error("Erro ao apagar viagem:", erro);
    res.status(500).json({ erro: "Erro ao apagar viagem." });
  }
}

// Controller para apagar um item do itinerário
export async function apagarItemController(req, res) {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  try {
    await db.execute("DELETE FROM itinerario WHERE id = ?", [id]);
    res.json({ mensagem: "Item apagado com sucesso!" });
  } catch (erro) {
    console.error("Erro ao apagar item:", erro);
    res.status(500).json({ erro: "Erro ao apagar item." });
  }
}
