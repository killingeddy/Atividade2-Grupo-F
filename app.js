// app.js
const { createPools } = require("./db/pool");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gera um produto com base no contador (descrição única por GRUPO)
 * Retorna um objeto { descricao, categoria, valor, criado_por }
 */
function gerarProduto(contador, grupo) {
  const descricao = `produto-${contador}`;
  const categorias = ["eletro", "moveis", "roupas", "alimentos", "limpeza", "jardim", "cozinha"];
  const categoria = categorias[contador % categorias.length];
  const valor = (Math.round((Math.random() * 1000 + 50) * 100) / 100).toFixed(2);
  return {
    descricao,
    categoria,
    valor,
    criado_por: grupo,
  };
}

(async function main() {
  const GRUPO = "Grupo F";
  let conexoes = await createPools();
  let { writePool, readPool } = conexoes;

  const INTERVAL_MS = 1000; // 1 segundo entre ciclos

  process.on("SIGINT", async () => {
    console.log("\nSIGINT recebido — encerrando pools...");
    try {
      await conexoes.writePool.end();
      await conexoes.readPool.end();
    } catch (err) {
      // ignora erro no fechamento
    }
    process.exit(0);
  });

  console.log("-------------- CONEXÃO ESTABELECIDA --------------");

  while (true) {
    try {
      // 1️⃣ Buscar o último ID existente no banco primário (original)
      const [ultimo] = await writePool.query(
        "SELECT id FROM produto ORDER BY id DESC LIMIT 1"
      );
      const ultimoId = ultimo.length > 0 ? ultimo[0].id : 0;
      const proximoNumero = ultimoId + 1;

      // 2️⃣ Gerar produto com base no próximo número real
      const produto = gerarProduto(proximoNumero, GRUPO);

      // 3️⃣ Inserir produto no banco principal (original)
      const insertSql = `
        INSERT INTO produto (descricao, categoria, valor, criado_por)
        VALUES (?, ?, ?, ?)
      `;
      const [insertResult] = await writePool.execute(insertSql, [
        produto.descricao,
        produto.categoria,
        produto.valor,
        produto.criado_por,
      ]);

      const insertedId = insertResult.insertId;

      // 🔹 Linha separadora para legibilidade
      console.log("\n--------------------------------------------------");
      console.log(
        `[INSERT - ORIGINAL] id=${insertedId} descricao=${produto.descricao} categoria=${produto.categoria} valor=${produto.valor} criado_por=${produto.criado_por}`
      );

      // 4️⃣ Se for o primeiro registro, não há o que ler
      if (insertedId === 1) {
        console.log(`[INFO] Primeiro registro criado (id=1). Nenhum SELECT a realizar.`);
        await wait(INTERVAL_MS);
        continue; // pula pro próximo loop
      }

      // 5️⃣ Determinar o intervalo de SELECTs (leitura na réplica)
      let startId, endId;

      if (insertedId <= 10) {
        // Se ainda tiver poucos registros (ex: primeiros 10)
        startId = 1;
        endId = insertedId - 1;
      } else {
        // Se já houver mais de 10 registros
        startId = insertedId - 10;
        endId = insertedId - 1;
      }

      console.log(`[READ - REPLICA] Iniciando leituras dos IDs ${endId} até ${startId}...`);

      // 6️⃣ Executar SELECTs individuais na réplica (decrescente)
      for (let id = endId; id >= startId; id--) {
        try {
          const [rows] = await readPool.execute(
            "SELECT id, descricao, categoria, valor, criado_em, criado_por FROM produto WHERE id = ?",
            [id]
          );
          if (rows.length === 0) {
            console.log(`[READ - REPLICA] id=${id} -> NOT FOUND`);
          } else {
            const r = rows[0];
            console.log(
              `[READ - REPLICA] id=${r.id} descricao=${r.descricao} categoria=${r.categoria} valor=${r.valor} criado_em=${r.criado_em} criado_por=${r.criado_por}`
            );
          }
        } catch (readErr) {
          console.error(`[ERROR READ id=${id}]`, readErr.code || readErr.message);
        }
      }

      await wait(INTERVAL_MS);
    } catch (erro) {
      console.error("[ERRO GERAL NO LOOP]", erro && erro.code ? erro.code : erro);

      // Se for erro de conexão provável, tenta recriar pools
      const precisaReconectar =
        erro && erro.code && ["PROTOCOL_CONNECTION_LOST", "ECONNREFUSED", "ECONNRESET"].includes(erro.code);

      if (precisaReconectar) {
        console.log("Tentando recriar pools de conexão...");
        try {
          conexoes = await createPools();
          console.log("Pools reestabelecidos.");
        } catch (re) {
          console.log("Erro ao recriar pools, aguardando antes de novo retry...");
        }
      }

      await wait(2000);
    }
  }
})();
