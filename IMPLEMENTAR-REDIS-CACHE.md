# 🚀 IMPLEMENTAR REDIS CACHE - GUIA COMPLETO

## 🎯 O QUE É REDIS CACHE?

Redis é um **banco de dados em memória** ultra-rápido usado para cachear dados frequentemente acessados.

**Benefícios:**
- ⚡ **100-1000x mais rápido** que MySQL
- 💾 Reduz carga no banco de dados
- 📊 Melhora experiência do usuário
- 🚀 Essencial para sistemas com +30 usuários

---

## 📊 QUANDO USAR REDIS?

### **✅ USE Redis quando:**
- Tem **30+ usuários** simultâneos
- Consultas repetidas (ex: lista de leads)
- Dados que mudam pouco (ex: configurações)
- Precisa de **máxima performance**

### **⏸️ NÃO PRECISA agora se:**
- Tem **menos de 30 usuários**
- Índices já resolveram (queries rápidas)
- Sistema funciona bem
- Quer simplicidade

**Recomendação:** Com as otimizações atuais (índices + pool + paginação), **você não precisa de Redis agora**. Implemente quando crescer para 30+ usuários.

---

## 🔧 IMPLEMENTAÇÃO COMPLETA

### **1. Adicionar Redis ao Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ... serviços existentes

  redis:
    image: redis:7-alpine
    container_name: crm-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - crm-network

volumes:
  # ... volumes existentes
  redis-data:

networks:
  crm-network:
    driver: bridge
```

---

### **2. Instalar Dependências**

```bash
cd backend
npm install ioredis
```

---

### **3. Criar Configuração do Redis**

```typescript
// backend/src/config/redis.ts
import Redis from 'ioredis';
import { logger } from './logger';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  logger.info('✅ Redis conectado');
});

redis.on('error', (err) => {
  logger.error('❌ Erro no Redis:', err);
});

export default redis;
```

---

### **4. Criar Service de Cache**

```typescript
// backend/src/services/cacheService.ts
import redis from '../config/redis';
import { logger } from '../config/logger';

class CacheService {
  // Obter cache
  async get(key: string): Promise<any> {
    try {
      const data = await redis.get(key);
      if (data) {
        logger.info(`📦 Cache HIT: ${key}`);
        return JSON.parse(data);
      }
      logger.info(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error('Erro ao buscar cache:', error);
      return null;
    }
  }

  // Salvar cache
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      logger.info(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Erro ao salvar cache:', error);
    }
  }

  // Deletar cache
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.info(`🗑️ Cache DELETE: ${key}`);
    } catch (error) {
      logger.error('Erro ao deletar cache:', error);
    }
  }

  // Deletar múltiplas chaves (pattern)
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`🗑️ Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error('Erro ao deletar cache por pattern:', error);
    }
  }
}

export const cacheService = new CacheService();
```

---

### **5. Usar Cache no Controller**

```typescript
// backend/src/controllers/leadsController.ts (EXEMPLO)
import { cacheService } from '../services/cacheService';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Chave única do cache
    const cacheKey = `leads:${consultorId}:page:${page}:limit:${limit}`;
    
    // Tentar buscar do cache primeiro
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      logger.info('📦 Retornando leads do cache');
      return res.json(cachedData);
    }
    
    // Se não tiver no cache, buscar do banco
    logger.info('🔍 Buscando leads do banco (cache miss)');
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM leads 
       WHERE consultor_id = ? 
       ORDER BY data_criacao DESC
       LIMIT ? OFFSET ?`,
      [consultorId, limit, offset]
    );

    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM leads WHERE consultor_id = ?',
      [consultorId]
    );

    const leadsArray = rows as any[];
    const total = (countRows as any[])[0].total;
    const totalPages = Math.ceil(total / limit);
    
    const leads = leadsArray.map(toCamelCase);
    
    const response = {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
    
    // Salvar no cache por 5 minutos
    await cacheService.set(cacheKey, response, 300);
    
    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};

// Invalidar cache ao criar/atualizar/deletar lead
export const createLead = async (req: Request, res: Response) => {
  try {
    // ... código de criação ...
    
    // Invalidar cache de leads deste consultor
    await cacheService.delPattern(`leads:${consultorId}:*`);
    
    res.status(201).json(newLead);
  } catch (error) {
    // ...
  }
};
```

---

## 📝 VARIÁVEIS DE AMBIENTE

```bash
# backend/.env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=  # Opcional, deixe vazio para desenvolvimento
```

```bash
# .env (raiz)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🎯 ESTRATÉGIA DE CACHE

### **O que cachear:**

| Dado | TTL | Quando Invalidar |
|------|-----|------------------|
| **Lista de leads** | 5 min | Criar/editar/deletar lead |
| **Dados do usuário** | 15 min | Atualizar perfil |
| **Configurações** | 1 hora | Alterar configurações |
| **Estatísticas** | 10 min | Mudar status de lead |

### **Padrões de chave:**

```
leads:{consultorId}:page:{page}:limit:{limit}
user:{userId}
config:comissoes
stats:{consultorId}
```

---

## 📊 GANHOS ESPERADOS

### **Com Redis:**
```
Primeira requisição: 
  - Sem cache: 5-8ms (banco)
  - Com cache: 5-8ms (banco) + salva cache

Próximas requisições (5 min):
  - Redis: 0.1-0.5ms ⚡⚡⚡
  - Ganho: 10-80x mais rápido!
```

### **Cenário Real:**

**10 usuários consultando leads:**
- SEM Redis: 10 x 5ms = 50ms de carga no MySQL
- COM Redis: 1 x 5ms + 9 x 0.1ms = 5.9ms total
- **Reduz carga no MySQL em 85%!**

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### **1. Invalidação de Cache**
```typescript
// SEMPRE invalide cache ao modificar dados!

// Criar lead
await cacheService.delPattern(`leads:${consultorId}:*`);

// Atualizar lead
await cacheService.delPattern(`leads:${consultorId}:*`);
await cacheService.del(`lead:${leadId}`);

// Deletar lead
await cacheService.delPattern(`leads:${consultorId}:*`);
```

### **2. TTL (Time To Live)**
- Muito curto (30s): Pouco benefício
- Muito longo (1h): Dados desatualizados
- **Recomendado: 5-15 minutos**

### **3. Fallback**
```typescript
// Se Redis falhar, continua funcionando (busca do banco)
try {
  const cached = await cacheService.get(key);
  if (cached) return cached;
} catch (error) {
  logger.warn('Redis indisponível, buscando do banco');
}

// Buscar do banco normalmente...
```

---

## 🚀 DEPLOY NO VPS

### **1. Atualizar docker-compose.yml**
```bash
git add docker-compose.yml
git commit -m "feat: Adicionar Redis ao Docker Compose"
git push
```

### **2. No VPS:**
```bash
cd ~/crm
git pull origin master

# Subir Redis
docker-compose up -d redis

# Verificar
docker logs crm-redis
docker exec -it crm-redis redis-cli ping
# Deve responder: PONG

# Rebuild backend com nova dependência
docker-compose down backend
docker-compose build backend
docker-compose up -d backend
```

---

## 📊 MONITORAMENTO

### **Ver estatísticas do Redis:**
```bash
docker exec -it crm-redis redis-cli

# Comandos úteis:
INFO stats           # Estatísticas gerais
INFO memory          # Uso de memória
DBSIZE               # Número de chaves
KEYS leads:*         # Ver chaves de leads
GET leads:123:page:1:limit:50  # Ver conteúdo de uma chave
```

### **Limpar cache (desenvolvimento):**
```bash
docker exec -it crm-redis redis-cli FLUSHALL
```

---

## 💰 CUSTO vs BENEFÍCIO

### **Benefícios:**
- ⚡ 10-80x mais rápido em cache hits
- 💾 85% menos carga no MySQL
- 👥 Suporta 2-3x mais usuários
- 📈 Melhor experiência do usuário

### **Custos:**
- 🔧 Complexidade: +20%
- 💾 Memória: ~50-100MB
- ⏱️ Implementação: 2-3 horas
- 🐛 Bugs potenciais: Cache desatualizado

---

## ✅ RECOMENDAÇÃO FINAL

### **AGORA (< 30 usuários):**
```
❌ NÃO implementar Redis ainda
✅ Índices + Pool + Paginação = Suficiente
✅ Sistema já está rápido (3-8ms)
✅ Mantenha simples
```

### **FUTURO (30-50+ usuários):**
```
✅ Implementar Redis
✅ Cachear lista de leads
✅ Cachear configurações
✅ Monitorar performance
```

### **Quando implementar?**
- [ ] Mais de 30 usuários ativos
- [ ] Queries ficando lentas (>50ms)
- [ ] CPU do MySQL >50%
- [ ] Feedback de lentidão dos usuários

---

## 🎯 ALTERNATIVA SIMPLES

Se quiser performance extra SEM Redis:

### **1. Cache em memória (Node.js):**
```typescript
// Simples, mas perde dados ao reiniciar
const cache = new Map();

const getCached = (key: string) => {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCached = (key: string, data: any, ttl: number) => {
  cache.set(key, {
    data,
    expires: Date.now() + (ttl * 1000)
  });
};
```

**Prós:** Simples, sem dependências
**Contras:** Perde ao reiniciar, não compartilha entre instâncias

---

## 📚 RESUMO

| Aspecto | Valor |
|---------|-------|
| **Complexidade** | ⭐⭐⭐ Média |
| **Benefício** | ⭐⭐⭐⭐⭐ Alto (para 30+ usuários) |
| **Tempo implementação** | 2-3 horas |
| **Manutenção** | +10% complexidade |
| **Recomendado agora?** | ❌ NÃO (< 30 usuários) |
| **Recomendado futuro?** | ✅ SIM (30+ usuários) |

---

## 🎊 STATUS

```
📝 Guia completo criado
📚 Exemplos de código prontos
🔧 Pronto para implementar quando crescer
⏸️ Recomendação: AGUARDAR crescimento
✅ Sistema atual já está excelente!
```

**Implementar Redis quando tiver 30+ usuários!** 🚀
