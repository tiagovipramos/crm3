const fs = require('fs');
const path = require('path');

// Lista de arquivos para corrigir
const arquivos = [
  'src/routes/tarefas.ts',
  'src/routes/storage.ts',
  'src/middleware/authIndicador.ts',
  'src/middleware/auth.ts',
  'src/install-indicadores.ts',
  'src/controllers/indicadorController.ts',
  'src/controllers/followupController.ts',
  'src/controllers/configuracoesController.ts',
  'src/controllers/authController.ts',
  'src/controllers/auditoriaController.ts',
  'src/controllers/adminController.ts',
  'src/setup-database.ts',
  'src/server.ts',
  'src/controllers/whatsappController.ts',
  'src/controllers/uploadController.ts',
  'src/controllers/tarefasController.ts',
  'src/controllers/relatoriosController.ts',
  'src/controllers/mensagensController.ts',
  'src/services/whatsappValidationService.ts'
];

let totalCorrigidos = 0;
let totalErros = 0;

console.log('🔧 Iniciando correção de imports do logger...\n');

arquivos.forEach(arquivo => {
  const caminhoCompleto = path.join(__dirname, arquivo);
  
  try {
    // Ler arquivo
    let conteudo = fs.readFileSync(caminhoCompleto, 'utf8');
    
    // Verificar se tem o import errado
    if (conteudo.includes("from './config/logger'") || conteudo.includes('from "./config/logger"')) {
      // Determinar o caminho correto baseado na pasta
      let novoCaminho;
      
      if (arquivo.startsWith('src/controllers/') || arquivo.startsWith('src/middleware/') || arquivo.startsWith('src/routes/')) {
        novoCaminho = '../config/logger';
      } else if (arquivo.startsWith('src/services/')) {
        novoCaminho = '../config/logger';
      } else if (arquivo === 'src/server.ts' || arquivo === 'src/install-indicadores.ts' || arquivo === 'src/setup-database.ts') {
        novoCaminho = './config/logger';
      }
      
      // Substituir
      conteudo = conteudo.replace(/from ['"]\.\/config\/logger['"]/g, `from '${novoCaminho}'`);
      
      // Salvar
      fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
      
      console.log(`✅ ${arquivo} → '${novoCaminho}'`);
      totalCorrigidos++;
    } else {
      console.log(`ℹ️  ${arquivo} → já está correto`);
    }
  } catch (erro) {
    console.error(`❌ Erro ao processar ${arquivo}:`, erro.message);
    totalErros++;
  }
});

console.log(`\n📊 Resumo:`);
console.log(`   ✅ Corrigidos: ${totalCorrigidos}`);
console.log(`   ℹ️  Já corretos: ${arquivos.length - totalCorrigidos - totalErros}`);
console.log(`   ❌ Erros: ${totalErros}`);
console.log(`\n🎉 Concluído!`);
