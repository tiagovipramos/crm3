const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/indicadorController.ts');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('🔧 Corrigindo indicadorController.ts...\n');

// Substituir todas as ocorrências de "await query(" por "await pool.query("
const pattern1 = /await query\(/g;
const matches1 = content.match(pattern1);
if (matches1) {
  console.log(`✅ Encontradas ${matches1.length} ocorrências de "await query("`);
  content = content.replace(pattern1, 'const [rows] = await pool.query(');
}

// Substituir .rows por diretamente rows onde aplicável  
content = content.replace(/const \[rows\] = await pool\.query\([^)]+\) as any;\s+const result = rows;/g, 
  (match) => {
    console.log('⚠️ Simplificando result = rows');
    return match.replace('const result = rows;', '// result inline');
  });

// Substituir result.rows por rows
content = content.replace(/(\w+Result)\.rows/g, 'rows');

// Casos específicos onde usamos result diretamente
content = content.replace(/const result = await pool\.query\(/g, 'const [rows] = await pool.query(');
content = content.replace(/result\.rows/g, 'rows');

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf-8');

console.log('\n✅ Arquivo corrigido com sucesso!');
console.log('📝 Próximo passo: Revisar o arquivo manualmente se necessário');
