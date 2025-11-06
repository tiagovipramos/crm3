const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  let connection;
  
  try {
    console.log('🔄 Executando migration para corrigir configurações de lootbox...');
    
    // Criar conexão com MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'mysql',
      user: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'senha_admin',
      database: process.env.DB_NAME || 'crm_db'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'migrations', '11-corrigir-configuracoes-lootbox.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir em statements individuais (MySQL não executa múltiplos statements de uma vez)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Executando ${statements.length} comandos SQL...`);
    
    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`  [${i + 1}/${statements.length}] Executando...`);
      await connection.execute(statement);
    }
    
    console.log('\n✅ Migration executada com sucesso!');
    console.log('📋 Alterações realizadas:');
    console.log('  • Adicionadas colunas para lootbox de indicações');
    console.log('  • Renomeadas colunas existentes para lootbox de vendas');
    console.log('\n🎉 Banco de dados atualizado!');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro ao executar migration:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

executeMigration();
