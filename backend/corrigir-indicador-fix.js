const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/controllers/indicadorController.ts');
let content = fs.readFileSync(filePath, 'utf-8');

console.log('🔧 Corrigindo indicadorController.ts de forma abrangente...\n');

// Contador para variáveis únicas
let counter = 1;

// Função para gerar nome único de variável
function getUniqueVarName() {
  return `rows${counter++}`;
}

// Dividir por funções para processar cada uma independentemente
const lines = content.split('\n');
const result = [];
let insideFunction = false;
let functionRowsUsed = new Set();
let currentFunctionStart = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Detectar início de função
  if (line.match(/^export\s+(const|async\s+function)\s+\w+/) || line.match(/^\s*async\s+\w+\s*\(/)) {
    insideFunction = true;
    functionRowsUsed = new Set();
    currentFunctionStart = i;
  }
  
  // Detectar fim de função (fecha chave no início da linha)
  if (insideFunction && line.match(/^}\s*;?\s*$/) && i > currentFunctionStart + 5) {
    insideFunction = false;
    counter = 1; // Reset counter para próxima função
  }
  
  // Corrigir declarações de rows
  if (line.includes('const [rows] = await pool.query(')) {
    // Se já usamos rows nesta função, usar nome único
    if (functionRowsUsed.has('rows')) {
      const uniqueName = getUniqueVarName();
      line = line.replace('const [rows]', `const [${uniqueName}]`);
      
      // Atualizar referências subsequentes nesta função
      let j = i + 1;
      let braceCount = 0;
      while (j < lines.length) {
        if (lines[j].includes('{')) braceCount++;
        if (lines[j].includes('}')) {
          braceCount--;
          if (braceCount < 0) break;
        }
        
        // Substituir referências a rows por uniqueName nas próximas linhas
        if (lines[j].includes('rows.') || lines[j].includes('rows[') || lines[j].match(/\brows\b/)) {
          lines[j] = lines[j].replace(/\brows\b/g, uniqueName);
        }
        j++;
      }
    } else {
      functionRowsUsed.add('rows');
    }
  }
  
  // Adicionar tipagem as any[] onde falta
  if (line.match(/const \[\w+\] = await pool\.query\(/) && !line.includes('as any')) {
    line = line.replace('];', '] as any[];');
  }
  
  // Corrigir variáveis indefinidas comuns
  line = line.replace(/leadResult\.rows/g, '(leadRows as any[])');
  line = line.replace(/indicacoesRecentes\.rows/g, '(indicacoesRecentes as any[])');
  line = line.replace(/transacoesRecentes\.rows/g, '(transacoesRecentes as any[])');
  line = line.replace(/consultoresOnlineCheck\.rows/g, '(consultoresOnlineRows as any[])');
  line = line.replace(/indicacaoExistente\.rows/g, '(indicacaoExistenteRows as any[])');
  line = line.replace(/consultoresOnline\.rows/g, '(consultoresOnlineRows as any[])');
  line = line.replace(/historicoResult\.insertId/g, '(historicoResult as any).insertId');
  
  // Corrigir await pool.query sem const
  if (line.includes('await pool.query(') && !line.includes('const') && !line.includes('=')) {
    line = line.replace('await pool.query(', 'await pool.query(');
  }
  
  result.push(line);
}

content = result.join('\n');

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf-8');

console.log('\n✅ Arquivo corrigido com sucesso!');
console.log(`📊 Total de linhas processadas: ${lines.length}`);
