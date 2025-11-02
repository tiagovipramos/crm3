const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('CORREÇÃO DE SINTAXE DUPLICADA');
console.log('========================================\n');

const controllersPath = path.join(__dirname, 'src', 'controllers');
const files = [
  'leadsController.ts',
  'indicadorController.ts', 
  'mensagensController.ts',
  'relatoriosController.ts'
];

let totalCorrecoes = 0;

files.forEach(file => {
  const filePath = path.join(controllersPath, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // Padrão 1: const variavel = const [rows] = await pool.query(
  // Corrigir para: const [rows] = await pool.query(
  const pattern1 = /const \w+ = const \[rows\] = await pool\.query\(/g;
  content = content.replace(pattern1, 'const [rows] = await pool.query(');
  
  // Contar correções neste arquivo
  const matches = originalContent.match(pattern1);
  const correcoes = matches ? matches.length : 0;
  
  if (correcoes > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file}: ${correcoes} erro(s) corrigido(s)`);
    totalCorrecoes += correcoes;
  } else {
    console.log(`✓  ${file}: Nenhum erro encontrado`);
  }
});

console.log('\n========================================');
if (totalCorrecoes > 0) {
  console.log(`🎉 SUCESSO! ${totalCorrecoes} erro(s) corrigido(s) no total!`);
  console.log('========================================');
  console.log('\nPróximos passos:');
  console.log('1. Execute: npm run build');
  console.log('2. Teste o sistema\n');
} else {
  console.log('✓  Nenhum erro encontrado!');
  console.log('========================================\n');
}
