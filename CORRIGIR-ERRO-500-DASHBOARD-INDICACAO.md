# Correção de Erros 500 na Dashboard de Indicação

## Problema Identificado

Ao acessar `http://185.217.125.72:3000/admin?view=dashboard-indicacao` em produção, o console retorna os seguintes erros 500:

```
Erro ao buscar alertas: Error: HTTP error! status: 500
Erro ao buscar estatísticas de indicação: Error: HTTP error! status: 500
Erro ao buscar top indicadores: Error: HTTP error! status: 500
Erro ao buscar solicitações de saque: Error: HTTP error! status: 500
```

## Causa Raiz

As funções do `adminController.ts` estão tentando acessar colunas e tabelas que não existem no banco de dados MySQL:

### Colunas Faltantes na Tabela `indicadores`:
- `saldo_disponivel`
- `saldo_bloqueado`
- `saldo_perdido`
- `indicacoes_respondidas`
- `indicacoes_convertidas`
- `cpf`

### Tabela Faltante:
- `saques_indicador` (usada para gerenciar solicitações de saque dos indicadores)

### Colunas e Ajustes na Tabela `consultores`:
- `created_by` (para rastrear hierarquia)
- Ajuste no ENUM de `role` para incluir: `vendedor`, `gerente`, `supervisor`

### Ajustes na Tabela `leads`:
- `indicador_id` (para vincular leads a indicadores)
- Ajuste no ENUM de `status` para incluir todos os valores usados

## Solução

Foi criada a migration `03-indicadores-saques.sql` que:

1. ✅ Adiciona as colunas faltantes na tabela `indicadores`
2. ✅ Cria a tabela `saques_indicador` com todos os campos necessários
3. ✅ Adiciona a coluna `created_by` em `consultores`
4. ✅ Ajusta o ENUM de `role` em `consultores`
5. ✅ Ajusta o ENUM de `status` em `leads`
6. ✅ Adiciona a coluna `indicador_id` em `leads`
7. ✅ Cria índices apropriados para performance
8. ✅ Cria foreign keys para garantir integridade referencial

## Como Aplicar a Correção

### Em Desenvolvimento (Local)

```bash
# Windows
cd backend
executar-migration-indicadores.bat

# Linux/Mac
cd backend
chmod +x executar-migration-indicadores.sh
./executar-migration-indicadores.sh
```

### Em Produção (VPS)

```bash
# Conectar ao VPS
ssh root@185.217.125.72

# Navegar até o diretório do projeto
cd /root/crm

# Executar o script de correção
chmod +x fix-dashboard-indicacao.sh
./fix-dashboard-indicacao.sh
```

## Verificação

Após aplicar a correção, verifique se os endpoints estão funcionando:

1. **Estatísticas de Indicação**: `GET /api/admin/estatisticas/indicacao`
2. **Top Indicadores**: `GET /api/admin/top-indicadores`
3. **Alertas**: `GET /api/admin/alertas`
4. **Solicitações de Saque**: `GET /api/admin/saques/pendentes`

Todos devem retornar status 200 com os dados apropriados.

## Estrutura da Nova Tabela `saques_indicador`

```sql
CREATE TABLE saques_indicador (
    id VARCHAR(36) PRIMARY KEY,
    indicador_id VARCHAR(36) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aprovacao TIMESTAMP NULL,
    data_pagamento TIMESTAMP NULL,
    status ENUM('solicitado', 'aprovado', 'pago', 'rejeitado'),
    observacoes TEXT,
    aprovado_por VARCHAR(36),
    metodo_pagamento VARCHAR(50)
);
```

## Novas Colunas em `indicadores`

```sql
saldo_disponivel DECIMAL(10, 2) DEFAULT 0.00    -- Saldo disponível para saque
saldo_bloqueado DECIMAL(10, 2) DEFAULT 0.00     -- Saldo bloqueado (aguardando confirmação)
saldo_perdido DECIMAL(10, 2) DEFAULT 0.00       -- Comissões perdidas
indicacoes_respondidas INT DEFAULT 0             -- Total de indicações que foram respondidas
indicacoes_convertidas INT DEFAULT 0             -- Total de indicações convertidas em vendas
cpf VARCHAR(14)                                  -- CPF do indicador
```

## Impacto

- ✅ Corrige os erros 500 na dashboard de indicação
- ✅ Habilita o sistema completo de gestão de indicadores
- ✅ Permite rastreamento de comissões e saques
- ✅ Implementa hierarquia de gestores (diretor > gerente > supervisor)
- ✅ Mantém compatibilidade com dados existentes (usando DEFAULT values)

## Rollback

Caso seja necessário reverter as alterações:

```sql
-- Remover tabela de saques
DROP TABLE IF EXISTS saques_indicador;

-- Remover colunas adicionadas (se necessário)
ALTER TABLE indicadores 
  DROP COLUMN saldo_disponivel,
  DROP COLUMN saldo_bloqueado,
  DROP COLUMN saldo_perdido,
  DROP COLUMN indicacoes_respondidas,
  DROP COLUMN indicacoes_convertidas,
  DROP COLUMN cpf;

ALTER TABLE consultores DROP COLUMN created_by;
ALTER TABLE leads DROP COLUMN indicador_id;
```

⚠️ **AVISO**: O rollback deve ser feito apenas se absolutamente necessário, pois pode causar perda de dados.
