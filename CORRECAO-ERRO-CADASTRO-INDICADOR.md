# Correção do Erro ao Cadastrar Indicador

## Problema Identificado

O erro ocorria porque a tabela `indicadores` usa UUID como chave primária (VARCHAR(36) com DEFAULT UUID()), mas o controller tentava usar `result.insertId` que só funciona com colunas AUTO_INCREMENT.

### Erro no Console
```
Erro ao cadastrar indicador: Error: Erro ao criar indicador
```

## Causa Raiz

No arquivo `backend/src/controllers/adminController.ts`, a função `criarIndicador` estava usando:

```typescript
const [result]: any = await connection.query(
  `INSERT INTO indicadores (nome, email, senha, telefone, cpf, created_by) 
   VALUES (?, ?, ?, ?, ?, ?)`,
  [nome, email, senhaHash, telefone, cpf, createdBy]
);

res.status(201).json({
  id: result.insertId, // ❌ ERRO: insertId não funciona com UUID
  // ...
});
```

## Solução Implementada

Gerar o UUID manualmente antes do INSERT:

```typescript
// Gerar UUID manualmente
const indicadorId = crypto.randomUUID();

await connection.query(
  `INSERT INTO indicadores (id, nome, email, senha, telefone, cpf, created_by) 
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [indicadorId, nome, email, senhaHash, telefone, cpf, createdBy]
);

res.status(201).json({
  id: indicadorId, // ✅ CORRETO: usar o UUID gerado
  // ...
});
```

## Como Aplicar no VPS

1. Fazer backup do arquivo atual
2. Substituir o arquivo corrigido
3. Reiniciar o backend

Execute o script: `./aplicar-correcao-indicador-vps.sh`
