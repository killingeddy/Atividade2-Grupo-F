// db/pool.js
const mysql = require("mysql2/promise");
const { writeDb, readDb } = require("./connections");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createPools() {
  while (true) {
    try {
      const writePool = await mysql.createPool(writeDb);
      const readPool = await mysql.createPool(readDb);
      return { writePool, readPool };
    } catch (err) {
      console.log("⏳ Aguardando bancos subirem...");
      await sleep(3000);
    }
  }
}

module.exports = { createPools };
