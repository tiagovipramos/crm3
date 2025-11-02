const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('VERIFICACAO DE REFERENCIAS POSTGRESQL');
console.log('========================================\n');

const postgresKeywords = [
  'postgres',
  'postgresql', 
  'gen_random_uuid',
  'TEXT[]',
  'plpgsql',
  '5432',
  'pg-',
  'db-helper'
];

const excludeDirs = ['node_modules', 'uploads', 'auth_', 'dist', 'build'];
const includeExts = ['.ts', '.js', '.sql', '.json', '.env'];

let issuesFound = 0;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const issues = [];
  
  postgresKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    
    if (matches) {
      // Exceções permitidas
      if (keyword === 'postgres' && relativePath.includes('verificar-postgresql')) {
        return; // Ignora este próprio arquivo
      }
      
      issues.push({
        keyword,
        count: matches.length
      });
    }
  });
  
  if (issues.length > 0) {
    issuesFound++;
    console.log(`\n❌ ${relativePath}`);
    issues.forEach(issue => {
      console.log(`   - "${issue.keyword}": ${issue.count} ocorrência(s)`);
    });
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.some(excluded => file.startsWith(excluded))) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (includeExts.includes(ext) || file === '.env.example') {
        checkFile(filePath);
      }
    }
  });
}

console.log('Escaneando arquivos...\n');
scanDirectory(process.cwd());

console.log('\n========================================');
if (issuesFound === 0) {
  console.log('✅ SUCESSO! Nenhuma referência PostgreSQL encontrada.');
  console.log('========================================');
  process.exit(0);
} else {
  console.log(`⚠️  ATENÇÃO! ${issuesFound} arquivo(s) com referências PostgreSQL.`);
  console.log('========================================');
  console.log('\nRecomendações:');
  console.log('1. Revise os arquivos listados acima');
  console.log('2. Substitua referências PostgreSQL por MySQL');
  console.log('3. Execute novamente este script\n');
  process.exit(1);
}
