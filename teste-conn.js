require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  try {
    console.log("Tentando conectar ao banco...");

    const conn = await mysql.createConnection({
      host: process.env.WRITE_DB_HOST,
      port: process.env.WRITE_DB_PORT,
      user: process.env.WRITE_DB_USER,
      password: process.env.WRITE_DB_PASSWORD,
      database: process.env.WRITE_DB_NAME,
      ssl: {
        // configuração recomendada pelo Cloud SQL
        minVersion: "TLSv1.2",
        rejectUnauthorized: false,
      },
      connectTimeout: 20000,
    });

    console.log("✅ Conexão bem-sucedida!");
    const [rows] = await conn.query("SELECT NOW() AS agora;");
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error("❌ Erro na conexão:");
    console.error(err);
  }
})();
