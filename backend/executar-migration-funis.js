const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function executarMigration() {
  console.log('================================================');
  console.log('🔄 Executando Migration de Etapas de Funil');
  console.log('================================================\n');

  // Configuração do banco
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'protecar_crm',
    port: parseInt(process.env.DB_PORT || '3306'),
    multipleStatements: true
  };

  console.log('📊 Configuração do banco:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Port: ${config.port}\n`);

  let connection;

  try {
    // Conectar ao banco
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado com sucesso!\n');

    // Ler arquivo de migration
    const migrationPath = path.join(__dirname, 'migrations', '12-criar-tabela-etapas-funil.sql');
    console.log('📝 Lendo arquivo de migration...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Arquivo carregado\n');

    // Executar migration
    console.log('⚙️  Executando migration...');
    await connection.query(migrationSQL);
    console.log('✅ Migration executada com sucesso!\n');

    // Verificar resultados
    console.log('📈 Verificando resultados...\n');
    
    const [tabelas] = await connection.query(`
      SHOW TABLES LIKE 'etapas_funil';
    `);
    
    if (tabelas.length > 0) {
      console.log('✅ Tabela "etapas_funil" criada com sucesso!\n');
      
      // Contar etapas criadas
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total_etapas,
          COUNT(DISTINCT consultor_id) as total_consultores,
          SUM(sistema = TRUE) as etapas_sistema,
          SUM(sistema = FALSE) as etapas_customizaveis
        FROM etapas_funil;
      `);
      
      console.log('📊 Estatísticas:');
      console.log(`   Total de etapas: ${stats[0].total_etapas}`);
      console.log(`   Total de consultores: ${stats[0].total_consultores}`);
      console.log(`   Etapas do sistema: ${stats[0].etapas_sistema}`);
      console.log(`   Etapas customizáveis: ${stats[0].etapas_customizaveis}\n`);
      
      // Mostrar algumas etapas
      const [etapas] = await connection.query(`
        SELECT nome, cor, ordem, sistema 
        FROM etapas_funil 
        WHERE consultor_id = (SELECT id FROM consultores LIMIT 1)
        ORDER BY ordem
        LIMIT 5;
      `);
      
      console.log('📋 Primeiras etapas criadas:');
      etapas.forEach(etapa => {
        const lock = etapa.sistema ? '🔒' : '🔓';
        console.log(`   ${lock} ${etapa.ordem}. ${etapa.nome} (${etapa.cor})`);
      });
    } else {
      console.log('❌ Tabela não foi criada!');
    }

    console.log('\n================================================');
    console.log('✅ Processo concluído com sucesso!');
    console.log('================================================');

  } catch (error) {
    console.error('\n================================================');
    console.error('❌ Erro ao executar migration:');
    console.error('================================================');
    console.error(error.message);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('\n⚠️  A tabela já existe. Migration já foi executada anteriormente.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
executarMigration();
