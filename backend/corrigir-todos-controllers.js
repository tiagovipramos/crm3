const fs = require('fs');
const path = require('path');

const controllers = [
  'src/controllers/leadsController.ts',
  'src/controllers/mensagensController.ts',
  'src/controllers/relatoriosController.ts',
  'src/controllers/uploadController.ts',
  'src/services/whatsappService.ts',
  'src/install-indicadores.ts'
];

console.log('🔧 Corrigindo múltiplos arquivos...\n');

let totalCorrecoes = 0;

controllers.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Contar ocorrências antes
  const matches = content.match(/from ['"]\.\.\/config\/db-helper['"]/g);
  
  if (!matches) {
    console.log(`✅ ${file} - já está correto`);
    return;
  }
  
  console.log(`📝 ${file} - ${matches.length} import(s) a corrigir`);
  
  // 1. Substituir import
  content = content.replace(
    /import \{ query \} from ['"]\.\.\/config\/db-helper['"];?/g,
    "import pool from '../config/database';"
  );
  
  // 2. Contar queries
  const queryMatches = content.match(/await query\(/g);
  if (queryMatches) {
    console.log(`   - ${queryMatches.length} query() a substituir`);
    totalCorrecoes += queryMatches.length;
  }
  
  // 3. Substituir await query( por await pool.query(
  content = content.replace(/const result = await query\(/g, 'const [rows] = await pool.query(');
  content = content.replace(/await query\(/g, 'const [rows] = await pool.query(');
  
  // 4. Substituir result.rows por rows
  content = content.replace(/result\.rows/g, 'rows');
  
  // Salvar
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`   ✅ Corrigido!\n`);
});

console.log(`\n🎉 Total de ${totalCorrecoes} queries corrigidas!`);
console.log('📝 Execute a varredura novamente para confirmar');
