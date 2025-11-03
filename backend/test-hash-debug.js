const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testHashComparison() {
  console.log('🔍 Testando hash de senha e comparação...\n');

  // Senha de teste
  const senha = '123456';
  
  // Hash atual na migration
  const hashMigration = '$2a$10$YQmXZ8pKyY5JZvQ5VxBqWOvH6gxZ7mY3nHyL5x6z8w9q0r1t2u3v4';
  
  console.log('📋 Teste 1: Gerar novo hash com bcrypt');
  const novoHash = await bcrypt.hash(senha, 10);
  console.log('   Senha:', senha);
  console.log('   Novo hash gerado:', novoHash);
  
  console.log('\n📋 Teste 2: Comparar senha com hash da migration');
  const resultMigration = await bcrypt.compare(senha, hashMigration);
  console.log('   Hash da migration:', hashMigration);
  console.log('   Resultado:', resultMigration ? '✅ VÁLIDO' : '❌ INVÁLIDO');
  
  console.log('\n📋 Teste 3: Comparar senha com novo hash');
  const resultNovo = await bcrypt.compare(senha, novoHash);
  console.log('   Novo hash:', novoHash);
  console.log('   Resultado:', resultNovo ? '✅ VÁLIDO' : '❌ INVÁLIDO');
  
  // Conectar ao banco de dados
  console.log('\n📋 Teste 4: Verificar dados no banco de dados');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Crm@VPS2025!Secure#ProdDB',
    database: process.env.DB_NAME || 'protecar_crm',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha, ativo FROM consultores WHERE email = ?',
      ['diretor@protecar.com']
    );

    if (rows.length === 0) {
      console.log('   ❌ Usuário diretor@protecar.com NÃO ENCONTRADO no banco!');
    } else {
      const user = rows[0];
      console.log('   ✅ Usuário encontrado:');
      console.log('      ID:', user.id);
      console.log('      Nome:', user.nome);
      console.log('      Email:', user.email);
      console.log('      Ativo:', user.ativo);
      console.log('      Hash no banco:', user.senha);
      
      console.log('\n📋 Teste 5: Comparar senha com hash do banco');
      const resultBanco = await bcrypt.compare(senha, user.senha);
      console.log('   Resultado:', resultBanco ? '✅ VÁLIDO' : '❌ INVÁLIDO');
      
      if (!resultBanco) {
        console.log('\n🔧 PROBLEMA IDENTIFICADO: Hash no banco não corresponde à senha!');
        console.log('   Vamos atualizar com um hash que funciona...');
        
        await pool.query(
          'UPDATE consultores SET senha = ? WHERE email = ?',
          [novoHash, 'diretor@protecar.com']
        );
        
        console.log('   ✅ Hash atualizado no banco!');
        console.log('   Novo hash:', novoHash);
        
        // Verificar novamente
        const [rowsVerify] = await pool.query(
          'SELECT senha FROM consultores WHERE email = ?',
          ['diretor@protecar.com']
        );
        
        const testeFinal = await bcrypt.compare(senha, rowsVerify[0].senha);
        console.log('   Teste final:', testeFinal ? '✅ VÁLIDO' : '❌ INVÁLIDO');
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
  }
  
  console.log('\n✅ Testes concluídos!');
}

testHashComparison();
