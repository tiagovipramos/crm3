# 🔧 Correção do Erro 500 no Login do Indicador - Loot Box

## 📋 Problema Identificado

Ao fazer login no sistema em produção (VPS) em `http://185.217.125.72:3000/indicador`, o login funcionava mas gerava um erro 500 no console do navegador:

```
Erro ao buscar status da loot box: 
Object { message: "Request failed with status code 500", name: "AxiosError", code: "ERR_BAD_RESPONSE", ... }
```

O login não finalizava completamente devido a este erro.

## 🔍 Causa Raiz

O endpoint `/api/indicador/lootbox/status` estava retornando erro 500 porque tentava acessar colunas que não existiam na tabela `indicadores`:

- `leads_para_proxima_caixa`
- `total_caixas_abertas`
- `total_ganho_caixas`
- `vendas_para_proxima_caixa`
- `total_caixas_vendas_abertas`
- `total_ganho_caixas_vendas`
- `pix_chave`
- `pix_tipo`

## ✅ Solução Implementada

### 1. Criada Migration 04-lootbox-indicadores.sql

Arquivo: `backend/migrations/04-lootbox-indicadores.sql`

Esta migration adiciona as seguintes colunas à tabela `indicadores`:

**Loot Box de Indicações:**
- `leads_para_proxima_caixa` (INT, padrão 0)
- `total_caixas_abertas` (INT, padrão 0)
- `total_ganho_caixas` (DECIMAL 10,2, padrão 0.00)

**Loot Box de Vendas:**
- `vendas_para_proxima_caixa` (INT, padrão 0)
- `total_caixas_vendas_abertas` (INT, padrão 0)
- `total_ganho_caixas_vendas` (DECIMAL 10,2, padrão 0.00)

**Dados PIX:**
- `pix_chave` (VARCHAR 255)
- `pix_tipo` (ENUM: 'cpf', 'cnpj', 'email', 'telefone', 'aleatoria')

A migration também adiciona as colunas correspondentes na tabela `saques_indicador`.

### 2. Atualizado Controller do Indicador

Arquivo: `backend/src/controllers/indicadorController.ts`

Atualizado o endpoint `getLootBoxStatus` para retornar dados completos das duas loot boxes:

```typescript
export const getLootBoxStatus = async (req: IndicadorAuthRequest, res: Response) => {
  // ... código ...
  
  res.json({
    // Loot box de leads/indicações
    leadsParaProximaCaixa: indicador.leads_para_proxima_caixa || 0,
    leadsNecessarios: 10,
    podeAbrirIndicacoes: (indicador.leads_para_proxima_caixa || 0) >= 10,
    totalCaixasAbertas: indicador.total_caixas_abertas || 0,
    totalGanhoCaixas: parseFloat(indicador.total_ganho_caixas || 0),
    
    // Loot box de vendas
    vendasParaProximaCaixa: indicador.vendas_para_proxima_caixa || 0,
    vendasNecessarias: 5,
    podeAbrirVendas: (indicador.vendas_para_proxima_caixa || 0) >= 5,
    totalCaixasVendasAbertas: indicador.total_caixas_vendas_abertas || 0,
    totalGanhoCaixasVendas: parseFloat(indicador.total_ganho_caixas_vendas || 0),
    
    // Compatibilidade com código antigo
    podeAbrir: (indicador.leads_para_proxima_caixa || 0) >= 10
  });
};
```

### 3. Criado Script de Deploy para VPS

Arquivo: `fix-lootbox-error-vps.sh`

Script automatizado para executar a correção na VPS:

```bash
#!/bin/bash
# Executa a migration
# Verifica colunas criadas
# Reinicia containers Docker
# Verifica status dos containers
```

## 🚀 Como Aplicar a Correção na VPS

### Opção 1: Via Script Automatizado (Recomendado)

```bash
# Na VPS, fazer pull do repositório
cd /caminho/do/projeto
git pull origin master

# Executar o script de correção
chmod +x fix-lootbox-error-vps.sh
./fix-lootbox-error-vps.sh
```

### Opção 2: Manual

```bash
# 1. Fazer pull do repositório
git pull origin master

# 2. Executar migration
mysql -h localhost -u seu_usuario -p seu_banco < backend/migrations/04-lootbox-indicadores.sql

# 3. Reiniciar containers
docker-compose down
docker-compose up -d --build

# 4. Verificar logs
docker-compose logs -f backend
```

## 🧪 Testes

Após aplicar a correção:

1. Acessar: `http://185.217.125.72:3000/indicador`
2. Fazer login com credenciais válidas
3. Verificar que:
   - ✅ Login completa com sucesso
   - ✅ Não há erro 500 no console
   - ✅ Dashboard do indicador carrega corretamente
   - ✅ Status da loot box é exibido

## 📊 Arquivos Modificados

1. **Criados:**
   - `backend/migrations/04-lootbox-indicadores.sql`
   - `fix-lootbox-error-vps.sh`

2. **Modificados:**
   - `backend/src/controllers/indicadorController.ts`

## 📝 Commit

```
Fix: Corrigir erro 500 no login do indicador - adicionar colunas de loot box faltantes

- Criada migration 04-lootbox-indicadores.sql
- Adicionadas colunas de loot box na tabela indicadores
- Atualizado endpoint getLootBoxStatus para incluir dados de vendas
- Criado script de deploy automatizado para VPS
```

## 🔗 Links Úteis

- **GitHub Repository:** https://github.com/tiagovipramos/crm3
- **Sistema em Produção:** http://185.217.125.72:3000/indicador

## ⚠️ Notas Importantes

- A migration é segura e pode ser executada múltiplas vezes
- Usa verificação de existência de colunas antes de criar
- Não afeta dados existentes
- Compatível com o código antigo através do campo `podeAbrir`

## 📞 Suporte

Em caso de problemas, verificar:

1. Logs do backend: `docker-compose logs -f backend`
2. Logs do MySQL: `docker-compose logs -f db`
3. Status dos containers: `docker-compose ps`
