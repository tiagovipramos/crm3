import fs from 'fs';
import path from 'path';
import { pool } from './config/database';
import { logger } from './config/logger';

async function setupDatabase() {
  try {
    logger.info('🔧 Configurando banco de dados MySQL...\n');

    // Ler schema
    const schemaPath = path.join(__dirname, '../schema-mysql.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Dividir por comandos SQL
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    logger.info(`📝 Executando ${commands.length} comandos SQL...\n`);

    for (const command of commands) {
      if (command.toLowerCase().includes('create database')) {
        // Executar CREATE DATABASE separadamente
        const conn = await pool.getConnection();
        await conn.query(command);
        conn.release();
        logger.info('✅ Banco de dados criado');
      } else if (command.toLowerCase().includes('use protecar_crm')) {
        // Skip USE command (já estamos usando o banco)
        continue;
      } else {
        // Executar outros comandos
        await pool.query(command);
      }
    }

    logger.info('\n✅ Banco de dados configurado com sucesso!');
    logger.info('\n📊 Verificando tabelas...');

    // Verificar tabelas
    const [tables] = await pool.query('SHOW TABLES');
    logger.info(`\n✅ ${(tables as any[]).length} tabelas criadas:`);
    (tables as any[]).forEach((table: any) => {
      logger.info(`   - ${Object.values(table)[0]}`);
    });

    // Verificar consultor teste
    const [consultores] = await pool.query('SELECT nome, email FROM consultores');
    if ((consultores as any[]).length > 0) {
      logger.info('\n✅ Consultor de teste criado:');
      logger.info(`   Email: ${(consultores as any[])[0].email}`);
      logger.info(`   Senha: 123456`);
    }

    logger.info('\n🎉 Tudo pronto! Agora execute: npm run dev');
    process.exit(0);
  } catch (error: any) {
    logger.error('\n❌ Erro ao configurar banco:', error.message);
    process.exit(1);
  }
}

setupDatabase();
