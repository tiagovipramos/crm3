import pool from './config/database';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './config/logger';

async function install() {
  try {
    logger.info('📦 Instalando módulo de indicações...\n');
    
    const sqlPath = path.join(__dirname, '..', 'migrations', 'schema-indicadores-mysql.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Separar queries (remover comentários e linhas vazias)
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('/*'));
    
    logger.info(`🔄 Executando ${queries.length} queries...\n`);
    
    let executed = 0;
    for (const q of queries) {
      if (q.trim()) {
        try {
          await pool.query(q, []);
          executed++;
          if (executed % 5 === 0) {
            logger.info(`   ${executed}/${queries.length} queries executadas...`);
          }
        } catch (err: any) {
          // Ignorar erros de "já existe" ou "duplicate"
          if (!err.message.includes('already exists') && 
              !err.message.includes('Duplicate') &&
              !err.message.includes('DROP TRIGGER')) {
            logger.info('⚠️  Query com erro:', q.substring(0, 50) + '...');
            logger.info('   Erro:', err.message.substring(0, 100));
          }
        }
      }
    }
    
    logger.info(`\n✅ ${executed} queries executadas!\n`);
    logger.info('📊 Verificando instalação...');
    
    // Verificar tabelas criadas (usando database correto do .env)
    const [rows] = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name IN ('indicadores', 'indicacoes', 'transacoes_indicador', 'saques_indicador')
      ORDER BY table_name
    `, []) as any;
    
    if (rows && rows.length > 0) {
      logger.info('✅ Tabelas criadas:', rows.map((r: any) => r.table_name || r.TABLE_NAME).join(', '));
    }
    
    // Verificar indicador de teste
    const [indicadorRows] = await pool.query(`
      SELECT id, nome, email FROM indicadores WHERE email = 'joao@indicador.com' LIMIT 1
    `, []) as any;
    
    if (indicadorRows && indicadorRows.length > 0) {
      logger.info('✅ Indicador de teste criado:', indicadorRows[0].nome);
    }
    
    logger.info('\n🎉 Instalação concluída com sucesso!');
    logger.info('\n📝 Credenciais de teste:');
    logger.info('   Email: joao@indicador.com');
    logger.info('   Senha: 123456');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro na instalação:', (error as Error).message);
    logger.error('Stack:', (error as Error).stack);
    process.exit(1);
  }
}

install();
