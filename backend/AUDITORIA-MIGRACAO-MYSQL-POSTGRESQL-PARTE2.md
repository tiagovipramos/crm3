# 🔍 AUDITORIA TÉCNICA - CONTINUAÇÃO (PARTE 2)

## 4️⃣ SCHEMA E CONSTRAINTS (continuação)

#### 4.1 ON UPDATE CURRENT_TIMESTAMP (continuação)

**PostgreSQL**:
```sql
-- Campo
data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- Trigger function
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_leads
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_data_atualizacao();
```

**Impacto**: 🟡 **MÉDIO**
- Comportamento automático do MySQL não existe em PostgreSQL
- Precisa criar trigger manualmente

**Onde afeta**:
- ✅ `leads.data_atualizacao` - JÁ TEM TRIGGER em schema.sql

**Status**: ✅ CORRETO - Trigger já implementado

**Verificação**:
```sql
-- Testar se trigger funciona
UPDATE leads SET nome = 'Teste' WHERE id = 'algum-uuid';
SELECT data_atualizacao FROM leads WHERE id = 'algum-uuid';
```

---

#### 4.2 Engine InnoDB vs PostgreSQL Storage

**Descrição**: MySQL permite especificar ENGINE, PostgreSQL não.

**MySQL**:
```sql
CREATE TABLE consultores (...) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PostgreSQL**:
```sql
CREATE TABLE consultores (...);
-- Não tem ENGINE, usa sistema de storage padrão
```

**Impacto**: 🟢 **BAIXO**
- Apenas sintaxe diferente no schema
- PostgreSQL ignora ou gera erro

**Status**: ✅ Schema PostgreSQL não tem ENGINE

---

#### 4.3 DEFAULT (UUID()) vs DEFAULT gen_random_uuid()

**Descrição**: Função para gerar UUID é diferente.

**MySQL**:
```sql
id VARCHAR(36) PRIMARY KEY DEFAULT (UUID())
```

**PostgreSQL**:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**Impacto**: 🔴 **ALTO**
- Schema MySQL não funciona em PostgreSQL
- Precisa migração manual

**Status**: ✅ Já corrigido em schema.sql

---

#### 4.4 Foreign Key ON DELETE CASCADE

**Descrição**: Comportamento similar, mas PostgreSQL é mais rigoroso.

**MySQL/PostgreSQL**:
```sql
FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
```

**Impacto**: 🟢 **BAIXO**
- Sintaxe compatível
- Comportamento idêntico

**Onde está**:
- leads → consultores
- mensagens → leads, consultores
- propostas → leads, consultores
- tarefas → consultores, leads

**Status**: ✅ CORRETO

---

### 5️⃣ COLLATION E CASE SENSITIVITY

#### 5.1 utf8mb4_unicode_ci vs UTF8

**Descrição**: Collation e encoding diferentes.

**MySQL**:
```sql
CREATE DATABASE protecar_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**PostgreSQL**:
```sql
CREATE DATABASE protecar_crm 
  WITH ENCODING 'UTF8' 
  LC_COLLATE='pt_BR.UTF-8' 
  LC_CTYPE='pt_BR.UTF-8';
```

**Impacto**: 🟡 **MÉDIO**
- Ordenação de strings pode ser diferente
- Comparações case-insensitive no MySQL vs case-sensitive no PostgreSQL

**Problemas de Case Sensitivity**:

1. **Busca por email** (case-insensitive em MySQL):
```sql
-- MySQL: Encontra 'admin@protecar.com', 'Admin@protecar.com', 'ADMIN@protecar.com'
SELECT * FROM consultores WHERE email = 'admin@protecar.com';

-- PostgreSQL: Apenas 'admin@protecar.com' (exato)
SELECT * FROM consultores WHERE email = 'admin@protecar.com';
```

**Solução**: Usar LOWER() ou UPPER():
```sql
-- Funciona em ambos
SELECT * FROM consultores WHERE LOWER(email) = LOWER('admin@protecar.com');

-- Ou criar índice funcional
CREATE INDEX idx_consultores_email_lower ON consultores(LOWER(email));
```

2. **Busca por nome**:
```typescript
// No código, normalizar antes de buscar
const emailNormalizado = email.toLowerCase();
const result = await query(
  'SELECT * FROM consultores WHERE LOWER(email) = ?',
  [emailNormalizado]
);
```

**Detecção**:
```bash
# Buscar comparações de string sem LOWER/UPPER
grep -rn "WHERE.*email\|WHERE.*nome" backend/src/controllers/
```

**Status**: ⚠️ **ATENÇÃO** - Código atual não usa LOWER/UPPER em buscas

**Recomendação**: Adicionar índices funcionais e usar LOWER() em comparações críticas

---

#### 5.2 Ordenação de Caracteres Especiais

**Descrição**: Ordem de acentos e caracteres especiais pode variar.

**MySQL** (utf8mb4_unicode_ci):
- a = á = à = â (ignora acentos)

**PostgreSQL** (LC_COLLATE):
- a ≠ á ≠ à ≠ â (diferencia acentos)

**Impacto**: 🟡 **MÉDIO**
- ORDER BY pode retornar resultados em ordem diferente
- DISTINCT pode gerar resultados diferentes

**Onde afeta**:
- Ordenação de nomes de leads, consultores
- Buscas de texto

**Correção**:
```sql
-- Para ignorar acentos no PostgreSQL
SELECT * FROM leads 
ORDER BY unaccent(nome) COLLATE "pt_BR";

-- Requer extensão
CREATE EXTENSION IF NOT EXISTS unaccent;
```

---

### 6️⃣ TRANSAÇÕES E COMPORTAMENTO

#### 6.1 Autocommit

**Descrição**: Comportamento de autocommit similar, mas com diferenças sutis.

**MySQL**:
- Autocommit ON por padrão
- DDL causa commit implícito

**PostgreSQL**:
- Autocommit ON por padrão (no pg driver)
- DDL NÃO causa commit (pode fazer rollback de CREATE TABLE!)

**Impacto**: 🟡 **MÉDIO**
- Migrations podem se comportar diferente
- Rollback de DDL possível em PostgreSQL

**Exemplo PostgreSQL**:
```sql
BEGIN;
CREATE TABLE teste (id UUID PRIMARY KEY);
INSERT INTO teste VALUES (gen_random_uuid());
ROLLBACK;  -- PostgreSQL: Nada foi criado! MySQL: Tabela criada, mas sem dados
```

**Status**: ✅ Não causa problemas no código atual (usa pool simples)

---

#### 6.2 Serialization e Deadlocks

**Descrição**: PostgreSQL usa MVCC (Multi-Version Concurrency Control), comportamento diferente do MySQL InnoDB.

**MySQL InnoDB**:
- Row-level locking
- Pode ter deadlocks em operações complexas

**PostgreSQL MVCC**:
- Readers não bloqueiam writers
- Menos deadlocks em geral
- Pode ter "serialization failures" em transactions complexas

**Impacto**: 🟡 **MÉDIO**
- Operações concorrentes se comportam diferente
- Errors diferentes (deadlock vs serialization failure)

**Onde pode afetar**:
- Updates simultâneos de leads
- Sistema de lootbox com concorrência

**Correção**: Implementar retry logic para serialization failures:
```typescript
async function executeWithRetry(query: string, params: any[], maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error: any) {
      if (error.code === '40001' && i < maxRetries - 1) {
        // Serialization failure, retry
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}
```

---

### 7️⃣ PERFORMANCE E ÍNDICES

#### 7.1 Índices Compostos

**Descrição**: Sintaxe similar, mas otimização diferente.

**MySQL/PostgreSQL**:
```sql
CREATE INDEX idx_leads_consultor_status ON leads(consultor_id, status);
```

**Diferenças**:
- PostgreSQL: Índice pode ser usado mesmo se não usar primeira coluna (menos eficiente)
- MySQL: Índice só é usado se primeira coluna estiver no WHERE

**Impacto**: 🟡 **MÉDIO**
- Query planning diferente
- Alguns índices podem ser inúteis ou precisar reordenação

**Onde está**:
- Schema atual tem índices simples (CORRETO)

**Recomendação**: Adicionar índices compostos para queries frequentes:
```sql
-- Buscar leads por consultor e status (usado frequentemente)
CREATE INDEX idx_leads_consultor_status ON leads(consultor_id, status);

-- Buscar mensagens recentes de um lead
CREATE INDEX idx_mensagens_lead_timestamp ON mensagens(lead_id, timestamp DESC);
```

---

#### 7.2 EXPLAIN e Query Planning

**Descrição**: Sintaxe de EXPLAIN diferente, planos de execução diferentes.

