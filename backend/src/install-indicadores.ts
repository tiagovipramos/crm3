import pool from './config/database';
import * as fs from 'fs';
import * as path from 'path';

async function install() {
  try {
    console.log('📦 Instalando módulo de indicações...\n');
    
    const sqlPath = path.join(__dirname, '..', 'migrations', 'schema-indicadores-mysql.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Separar queries (remover comentários e linhas vazias)
    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('/*'));
    
    console.log(`🔄 Executando ${queries.length} queries...\n`);
    
    let executed = 0;
    for (const q of queries) {
      if (q.trim()) {
        try {
          await pool.query(q, []);
          executed++;
          if (executed % 5 === 0) {
            console.log(`   ${executed}/${queries.length} queries executadas...`);
          }
        } catch (err: any) {
          // Ignorar erros de "já existe" ou "duplicate"
          if (!err.message.includes('already exists') && 
              !err.message.includes('Duplicate') &&
              !err.message.includes('DROP TRIGGER')) {
            console.log('⚠️  Query com erro:', q.substring(0, 50) + '...');
            console.log('   Erro:', err.message.substring(0, 100));
          }
        }
      }
    }
    
    console.log(`\n✅ ${executed} queries executadas!\n`);
    console.log('📊 Verificando instalação...');
    
    // Verificar tabelas criadas (usando database correto do .env)
    const [rows] = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_name IN ('indicadores', 'indicacoes', 'transacoes_indicador', 'saques_indicador')
      ORDER BY table_name
    `, []) as any;
    
    if (rows && rows.length > 0) {
      console.log('✅ Tabelas criadas:', rows.map((r: any) => r.table_name || r.TABLE_NAME).join(', '));
    }
    
    // Verificar indicador de teste
    const [indicadorRows] = await pool.query(`
      SELECT id, nome, email FROM indicadores WHERE email = 'joao@indicador.com' LIMIT 1
    `, []) as any;
    
    if (indicadorRows && indicadorRows.length > 0) {
      console.log('✅ Indicador de teste criado:', indicadorRows[0].nome);
    }
    
    console.log('\n🎉 Instalação concluída com sucesso!');
    console.log('\n📝 Credenciais de teste:');
    console.log('   Email: joao@indicador.com');
    console.log('   Senha: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na instalação:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    process.exit(1);
  }
}

install();
