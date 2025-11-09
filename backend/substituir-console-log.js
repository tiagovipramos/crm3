const fs = require('fs');
const path = require('path');

// Arquivos para substituir console.log por logger
const substituirConsoleLog = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Verificar se já tem import do logger
    const hasLoggerImport = content.includes("from './config/logger'") || 
                           content.includes("from '../config/logger'") ||
                           content.includes("from '../../config/logger'");
    
    // Adicionar import do logger se não existe
    if (!hasLoggerImport && (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn'))) {
      // Determinar caminho relativo correto
      const relativePath = filePath.includes('/controllers/') ? '../config/logger' :
                          filePath.includes('/services/') ? '../config/logger' :
                          filePath.includes('/middleware/') ? '../config/logger' :
                          filePath.includes('/routes/') ? '../config/logger' :
                          './config/logger';
      
      // Adicionar após os últimos imports
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + 
                 `import { logger } from '${relativePath}';\n` + 
                 content.slice(endOfLine + 1);
      }
    }
    
    // Substituir console.log por logger.info
    content = content.replace(/console\.log\(/g, 'logger.info(');
    
    // Substituir console.error por logger.error
    content = content.replace(/console\.error\(/g, 'logger.error(');
    
    // Substituir console.warn por logger.warn
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    
    // Substituir console.debug por logger.debug
    content = content.replace(/console\.debug\(/g, 'logger.debug(');
    
    // Se houve mudanças, salvar o arquivo
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Atualizado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
};

// Buscar recursivamente arquivos .ts
const buscarArquivosTS = (dir, arquivos = []) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules e build
      if (!filePath.includes('node_modules') && !filePath.includes('dist')) {
        buscarArquivosTS(filePath, arquivos);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      arquivos.push(filePath);
    }
  }
  
  return arquivos;
};

// Executar substituição
console.log('');
console.log('🔧 ============================================');
console.log('🔧  SUBSTITUIR CONSOLE.LOG POR LOGGER');
console.log('🔧 ============================================');
console.log('');

const srcPath = path.join(__dirname, 'src');
const arquivos = buscarArquivosTS(srcPath);

console.log(`📁 Encontrados ${arquivos.length} arquivos TypeScript\n`);

let arquivosAlterados = 0;

for (const arquivo of arquivos) {
  if (substituirConsoleLog(arquivo)) {
    arquivosAlterados++;
  }
}

console.log('');
console.log('🔧 ============================================');
console.log(`✅ ${arquivosAlterados} arquivo(s) atualizado(s)`);
console.log('🔧 ============================================');
console.log('');
console.log('📝 Mudanças realizadas:');
console.log('   • console.log() → logger.info()');
console.log('   • console.error() → logger.error()');
console.log('   • console.warn() → logger.warn()');
console.log('   • console.debug() → logger.debug()');
console.log('');
console.log('✅ Imports do logger adicionados automaticamente');
console.log('');
