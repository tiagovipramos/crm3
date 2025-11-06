# 🎁 Implementação: Configuração Dinâmica de Lootbox em Tempo Real

## 📋 Resumo

Sistema implementado para que as configurações de indicações e vendas necessárias para abrir as caixinhas misteriosas sejam **dinâmicas** e atualizem **em tempo real** de acordo com as configurações definidas no painel ADMIN.

---

## 🔧 Alterações Realizadas

### 1. Backend - ConfiguracoesController.ts

**Arquivo:** `backend/src/controllers/configuracoesController.ts`

**Alteração:** Adicionado emissão de evento Socket.IO quando as configurações são atualizadas

```typescript
// 🔥 EMITIR EVENTO SOCKET.IO PARA TODOS OS INDICADORES EM TEMPO REAL
const io = (global as any).io;
if (io) {
  console.log('📡 Emitindo atualização de configurações de lootbox para todos os indicadores...');
  
  // Buscar todos os indicadores ativos
  const [indicadoresRows] = await pool.query('SELECT id FROM indicadores WHERE ativo = true');
  const indicadores = indicadoresRows as any[];
  
  // Emitir para cada indicador
  indicadores.forEach((indicador: any) => {
    io.to(`indicador_${indicador.id}`).emit('configuracoes_lootbox_atualizadas', {
      indicacoesNecessarias,
      vendasNecessarias,
      premioMinimoIndicacoes: parseFloat(premioMinimoIndicacoes),
      premioMaximoIndicacoes: parseFloat(premioMaximoIndicacoes),
      premioMinimoVendas: parseFloat(premioMinimoVendas),
      premioMaximoVendas: parseFloat(premioMaximoVendas),
      timestamp: new Date().toISOString()
    });
  });
  
  console.log(`✅ Evento emitido para ${indicadores.length} indicadores`);
}
```

### 2. Frontend - useSocketIndicador Hook

**Arquivo:** `hooks/useSocketIndicador.ts`

**Alteração:** Adicionado listener para ouvir atualizações de configurações

```typescript
// 🔥 Escutar atualização de configurações de lootbox
socket.on('configuracoes_lootbox_atualizadas', async (data: any) => {
  console.log('⚙️ Configurações de lootbox atualizadas via Socket.IO:', data);
  console.log('📊 Novas metas:', {
    indicacoes: data.indicacoesNecessarias,
    vendas: data.vendasNecessarias
  });
  
  // Recarregar status da lootbox para refletir as novas configurações
  const store = useIndicadorStore.getState();
  console.log('🔄 Recarregando status da lootbox com novas configurações...');
  await store.fetchLootBoxStatus();
  console.log('✅ Lootbox atualizada em tempo real com novas metas!');
});
```

---

## 🎯 Como Funciona

### Fluxo de Atualização em Tempo Real

1. **Admin altera configurações** no painel de configurações (ex: muda de 10 para 15 indicações necessárias)

2. **Backend processa** a alteração e salva no banco de dados

3. **Backend emite evento Socket.IO** para todos os indicadores ativos online

4. **Frontend recebe evento** através do hook `useSocketIndicador`

5. **Store recarrega** o status da lootbox automaticamente

6. **UI atualiza** mostrando as novas metas sem precisar recarregar a página

### Busca Dinâmica do Banco de Dados

O endpoint `GET /api/indicador/lootbox/status` já busca as configurações diretamente do banco:

```typescript
// Buscar configurações de lootbox
const [configRows] = await pool.query<RowDataPacket[]>(
  'SELECT * FROM configuracoes_lootbox LIMIT 1'
);
const config = configRows[0];

const indicacoesNecessarias = config?.indicacoes_necessarias || 10;
const vendasNecessarias = config?.vendas_necessarias || 5;
```

---

## 📊 Configurações Disponíveis

### Tabela: `configuracoes_lootbox`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `indicacoes_necessarias` | INT | Quantidade de indicações para abrir caixa de indicações |
| `vendas_necessarias` | INT | Quantidade de vendas para abrir caixa de vendas |
| `premio_minimo_indicacoes` | DECIMAL | Prêmio mínimo da caixa de indicações |
| `premio_maximo_indicacoes` | DECIMAL | Prêmio máximo da caixa de indicações |
| `premio_minimo_vendas` | DECIMAL | Prêmio mínimo da caixa de vendas |
| `premio_maximo_vendas` | DECIMAL | Prêmio máximo da caixa de vendas |
| `probabilidade_baixo_*` | INT | Probabilidade de prêmio baixo (%) |
| `probabilidade_medio_*` | INT | Probabilidade de prêmio médio (%) |
| `probabilidade_alto_*` | INT | Probabilidade de prêmio alto (%) |

---

## 🔄 Endpoints Relacionados

### GET /api/configuracoes/lootbox
Busca as configurações atuais de lootbox

**Response:**
```json
{
  "indicacoesNecessarias": 10,
  "vendasNecessarias": 5,
  "premioMinimoIndicacoes": 5.00,
  "premioMaximoIndicacoes": 20.00,
  "premioMinimoVendas": 10.00,
  "premioMaximoVendas": 50.00,
  ...
}
```

### PUT /api/configuracoes/lootbox
Atualiza as configurações de lootbox (ADMIN)

**Request Body:**
```json
{
  "indicacoesNecessarias": 15,
  "vendasNecessarias": 5,
  "premioMinimoIndicacoes": 5.00,
  "premioMaximoIndicacoes": 25.00,
  ...
}
```

**Response:**
```json
{
  "message": "Configurações de lootbox atualizadas com sucesso",
  "indicacoesNecessarias": 15,
  ...
}
```

### GET /api/indicador/lootbox/status
Busca o status atual da lootbox do indicador

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "leadsParaProximaCaixa": 8,
  "leadsNecessarios": 10,
  "podeAbrirIndicacoes": false,
  "vendasParaProximaCaixa": 3,
  "vendasNecessarias": 5,
  "podeAbrirVendas": false,
  "totalCaixasAbertas": 2,
  "totalGanhoCaixas": 15.50,
  ...
}
```

---

## 🧪 Como Testar

### Teste 1: Alteração via Admin

1. Acesse o painel ADMIN
2. Vá em **Configurações** → **Lootbox**
3. Altere "Indicações Necessárias" de 10 para 15
4. Clique em **Salvar**
5. Em outra aba/dispositivo, abra o painel do Indicador
6. **Resultado esperado:** As barras de progresso devem atualizar automaticamente mostrando "/15" ao invés de "/10"

### Teste 2: Múltiplos Indicadores

1. Abra múltiplas abas com diferentes indicadores logados
2. No ADMIN, altere as configurações
3. **Resultado esperado:** Todas as abas devem atualizar simultaneamente

### Teste 3: Console Logs

Abra o console do navegador para ver os logs:

```
⚙️ Configurações de lootbox atualizadas via Socket.IO: {...}
📊 Novas metas: {indicacoes: 15, vendas: 5}
🔄 Recarregando status da lootbox com novas configurações...
✅ Lootbox atualizada em tempo real com novas metas!
```

---

## ✅ Benefícios

1. **Sem Recarga de Página:** Indicadores veem mudanças instantaneamente
2. **Configuração Centralizada:** Admin controla tudo de um só lugar
3. **Flexibilidade:** Pode ajustar metas conforme estratégia de negócio
4. **Experiência do Usuário:** Sincronização perfeita entre múltiplos dispositivos
5. **Escalável:** Funciona com 1 ou 1000 indicadores simultaneamente

---

## 🔐 Segurança

- ✅ Apenas ADMINs autenticados podem alterar configurações
- ✅ Validações no backend garantem valores consistentes
- ✅ Socket.IO usa rooms específicas por indicador
- ✅ Eventos são emitidos apenas para indicadores ativos

---

## 📝 Arquivos Modificados

1. `backend/src/controllers/configuracoesController.ts` - Emissão de eventos Socket.IO
2. `hooks/useSocketIndicador.ts` - Listener de eventos de configuração

---

## 🚀 Status

✅ **IMPLEMENTADO E FUNCIONAL**

Todas as configurações de lootbox agora são dinâmicas e atualizam em tempo real via WebSocket.

---

**Autor:** Cline AI  
**Data:** 06/11/2025  
**Versão:** 1.0
