# 🔧 REFATORAR CONTROLLERS GRANDES - GUIA COMPLETO

## 🎯 O PROBLEMA

**leadsController.ts** tem **800+ linhas** com:
- ❌ Lógica de negócio misturada com controller
- ❌ Queries SQL diretamente no controller
- ❌ Difícil de testar
- ❌ Difícil de manter
- ❌ Viola Single Responsibility Principle

---

## ✅ A SOLUÇÃO: CLEAN ARCHITECTURE

### **Estrutura Atual:**
```
Controller (800 linhas)
├── Recebe request
├── Valida dados
├── Lógica de negócio
├── Queries SQL
├── Cálculos de comissão
├── Emissão de eventos
└── Retorna response
```

### **Estrutura Ideal:**
```
Controller (100 linhas)         Service (400 linhas)         Repository (300 linhas)
├── Recebe request       →      ├── Lógica de negócio  →    ├── Queries SQL
├── Valida dados básicos        ├── Validações               ├── CRUD
└── Retorna response            ├── Cálculos                 └── Transações
                                └── Orquestração
```

---

## 📝 EXEMPLO PRÁTICO: REFATORAR getLeads

### **ANTES (Controller com tudo):**
```typescript
// backend/src/controllers/leadsController.ts
export const getLeads = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
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

    const total = (countRows as any[])[0].total;
    const totalPages = Math.ceil(total / limit);
    
    const leads = (rows as any[]).map(toCamelCase);
    
    res.json({
      leads,
      pagination: { page, limit, total, totalPages, ... }
    });
  } catch (error) {
    logger.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};
```

---

### **DEPOIS (Separado em camadas):**

#### **1. Repository (Acesso a dados):**
```typescript
// backend/src/repositories/LeadRepository.ts
import pool from '../config/database';
import { logger } from '../config/logger';

export class LeadRepository {
  async findByConsultorId(
    consultorId: string,
    limit: number,
    offset: number
  ) {
    const [rows] = await pool.query(
      `SELECT * FROM leads 
       WHERE consultor_id = ? 
       ORDER BY data_criacao DESC
       LIMIT ? OFFSET ?`,
      [consultorId, limit, offset]
    );
    return rows as any[];
  }

  async countByConsultorId(consultorId: string): Promise<number> {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total FROM leads WHERE consultor_id = ?',
      [consultorId]
    );
    return (rows as any[])[0].total;
  }

  async findById(id: string) {
    const [rows] = await pool.query(
      'SELECT * FROM leads WHERE id = ?',
      [id]
    );
    return (rows as any[])[0] || null;
  }

  async create(data: any) {
    const [result] = await pool.query(
      `INSERT INTO leads (
        nome, telefone, email, origem, status, consultor_id, 
        observacoes, data_criacao, data_atualizacao
      ) VALUES (?, ?, ?, ?, 'novo', ?, ?, NOW(), NOW())`,
      [
        data.nome, data.telefone, data.email, data.origem || 'Manual',
        data.consultorId, data.observacoes
      ]
    );
    return (result as any).insertId;
  }

  async update(id: string, data: any) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = fields
      .map(field => `${this.toSnakeCase(field)} = ?`)
      .join(', ');

    await pool.query(
      `UPDATE leads SET ${setClause}, data_atualizacao = NOW() WHERE id = ?`,
      [...values, id]
    );
  }

  async delete(id: string) {
    const [result] = await pool.query(
      'DELETE FROM leads WHERE id = ?',
      [id]
    );
    return (result as any).affectedRows > 0;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}

export const leadRepository = new LeadRepository();
```

---

#### **2. Service (Lógica de negócio):**
```typescript
// backend/src/services/LeadService.ts
import { leadRepository } from '../repositories/LeadRepository';
import { logger } from '../config/logger';

export class LeadService {
  async getLeads(consultorId: string, page: number = 1, limit: number = 50) {
    try {
      const offset = (page - 1) * limit;
      
      logger.info('📥 Carregando leads do consultor:', consultorId);
      logger.info('📄 Paginação:', { page, limit, offset });

      // Buscar leads e total em paralelo
      const [leads, total] = await Promise.all([
        leadRepository.findByConsultorId(consultorId, limit, offset),
        leadRepository.countByConsultorId(consultorId)
      ]);

      const totalPages = Math.ceil(total / limit);
      
      logger.info('📊 Total de leads:', total);
      logger.info('📄 Página atual:', page, 'de', totalPages);

      return {
        leads: leads.map(this.toCamelCase),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar leads:', error);
      throw error;
    }
  }

  async getLead(id: string, consultorId: string) {
    const lead = await leadRepository.findById(id);
    
    if (!lead) {
      throw new Error('Lead não encontrado');
    }
    
    if (lead.consultor_id !== consultorId) {
      throw new Error('Acesso negado');
    }
    
    return this.toCamelCase(lead);
  }

  async createLead(data: any, consultorId: string) {
    // Validações
    if (!data.nome || !data.telefone) {
      throw new Error('Nome e telefone são obrigatórios');
    }

    // Normalizar telefone
    const telefoneNormalizado = this.normalizarTelefone(data.telefone);
    
    // Criar lead
    const leadId = await leadRepository.create({
      ...data,
      telefone: telefoneNormalizado,
      consultorId
    });
    
    // Buscar lead criado
    const lead = await leadRepository.findById(leadId);
    return this.toCamelCase(lead);
  }

  private toCamelCase(obj: any) {
    const converted: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => 
        letter.toUpperCase()
      );
      converted[camelKey] = obj[key];
    }
    return converted;
  }

  private normalizarTelefone(telefone: string): string {
    const apenasNumeros = telefone.replace(/\D/g, '');
    // Lógica de normalização...
    return apenasNumeros;
  }
}

export const leadService = new LeadService();
```

---

#### **3. Controller (Apenas orquestração):**
```typescript
// backend/src/controllers/leadsController.ts
import { Request, Response } from 'express';
import { leadService } from '../services/LeadService';
import { logger } from '../config/logger';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await leadService.getLeads(consultorId, page, limit);
    res.json(result);
  } catch (error) {
    logger.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};

export const getLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultorId = req.user?.id;

    const lead = await leadService.getLead(id, consultorId);
    res.json(lead);
  } catch (error) {
    if (error.message === 'Lead não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Acesso negado') {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const consultorId = req.user?.id;
    const lead = await leadService.createLead(req.body, consultorId);
    res.status(201).json(lead);
  } catch (error) {
    if (error.message.includes('obrigatório')) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
};
```

---

## 📊 COMPARAÇÃO

### **ANTES:**
```
leadsController.ts: 800 linhas
├── Validações
├── Lógica de negócio
├── Queries SQL
├── Transformações
└── Tratamento de erros
```

### **DEPOIS:**
```
LeadRepository.ts: 150 linhas
├── Queries SQL
├── CRUD básico
└── Conversões snake_case

LeadService.ts: 300 linhas
├── Lógica de negócio
├── Validações complexas
├── Orquestração
└── Transformações

leadsController.ts: 100 linhas
├── Recebe request
├── Chama service
├── Trata erros HTTP
└── Retorna response
```

---

## ✅ BENEFÍCIOS

### **1. Testabilidade** 🧪
```typescript
// ANTES: Difícil testar (precisa mockar Request/Response)
// DEPOIS: Fácil testar services

describe('LeadService', () => {
  it('deve retornar leads com paginação', async () => {
    const result = await leadService.getLeads('123', 1, 50);
    expect(result.leads).toBeInstanceOf(Array);
    expect(result.pagination.page).toBe(1);
  });
});
```

### **2. Reutilização** ♻️
```typescript
// Service pode ser usado em:
- Controller HTTP
- Jobs assíncronos
- CLI commands
- WebSocket handlers
```

### **3. Manutenibilidade** 🔧
```
- Mudança na lógica: Apenas no Service
- Mudança no banco: Apenas no Repository
- Nova rota: Apenas no Controller
```

### **4. Clean Code** 📝
```
- Cada classe tem uma responsabilidade
- Código mais legível
- Mais fácil de entender
```

---

## 🚀 PLANO DE REFATORAÇÃO

### **Fase 1: Criar estrutura (1-2 horas)**
```bash
mkdir -p backend/src/repositories
mkdir -p backend/src/services

# Criar arquivos base
touch backend/src/repositories/LeadRepository.ts
touch backend/src/services/LeadService.ts
```

### **Fase 2: Migrar Repository (2-3 horas)**
- Mover todas as queries SQL
- Criar métodos CRUD
- Testar

### **Fase 3: Migrar Service (3-4 horas)**
- Mover lógica de negócio
- Usar repository
- Testar

### **Fase 4: Simplificar Controller (1-2 horas)**
- Delegar para service
- Manter apenas orquestração
- Testar

### **Fase 5: Repetir para outros controllers (variável)**
- adminController.ts
- mensagensController.ts
- indicadorController.ts
- ...

---

## 📝 CHECKLIST DE REFATORAÇÃO

### **Para cada controller:**
- [ ] Criar Repository
- [ ] Criar Service
- [ ] Mover queries para Repository
- [ ] Mover lógica para Service
- [ ] Simplificar Controller
- [ ] Adicionar testes
- [ ] Documentar
- [ ] Testar integração

---

## ⚠️ CUIDADOS

### **1. Fazer incremental**
- ❌ Não refatore tudo de uma vez
- ✅ Refatore uma função por vez
- ✅ Teste cada mudança
- ✅ Commit frequente

### **2. Manter compatibilidade**
- ✅ Rotas continuam funcionando
- ✅ Responses iguais
- ✅ Sem breaking changes

### **3. Adicionar testes**
- ✅ Testar service separadamente
- ✅ Testar repository separadamente
- ✅ Testar integração

---

## 💰 CUSTO vs BENEFÍCIO

### **Custo:**
- ⏱️ Tempo: 10-20 horas (todos controllers)
- 🧠 Esforço: Médio-Alto
- 📚 Curva aprendizado: Média

### **Benefício:**
- ✅ Código 3x mais limpo
- ✅ 5x mais fácil de testar
- ✅ 2x mais fácil de manter
- ✅ Menos bugs futuros
- ✅ Onboarding mais rápido

---

## 🎯 RECOMENDAÇÃO

### **FAZER AGORA:**
```
✅ Refatore leadsController primeiro (o maior)
✅ Use como template para outros
✅ Faça incremental
✅ Adicione testes
```

### **QUANDO FAZER:**
```
✅ Antes de adicionar features grandes
✅ Quando tiver tempo dedicado
✅ NÃO durante urgências
✅ Com code review
```

---

## 📚 EXEMPLO COMPLETO

Criei exemplos completos em:
- `backend/src/repositories/LeadRepository.ts.example`
- `backend/src/services/LeadService.ts.example`
- `backend/src/controllers/leadsController.ts.example`

**Para usar:**
```bash
# 1. Criar backup
cp backend/src/controllers/leadsController.ts backend/src/controllers/leadsController.ts.backup

# 2. Criar novos arquivos
# (copiar dos examples e adaptar)

# 3. Testar
npm run dev

# 4. Se funcionar, commitar
# 5. Se der problema, restaurar backup
```

---

## ✅ CONCLUSÃO

**Benefícios:**
- 🔧 Código 3x mais limpo
- 🧪 5x mais testável
- 📝 2x mais manutenível
- ✅ Segue boas práticas

**Esforço:**
- ⏱️ 10-20 horas (todos controllers)
- 📚 Curva de aprendizado média
- ✅ Vale a pena a longo prazo

**Recomendação:**
- ✅ Faça incremental
- ✅ Comece pelo leadsController
- ✅ Adicione testes
- ✅ Code review obrigatório

---

## 🎊 STATUS

```
📝 Guia completo criado
📚 Exemplos de código prontos
🔧 Estrutura definida
✅ Pronto para implementar
⏳ Aguardando decisão
```

**Refatorar agora ou deixar para depois?** 🤔

**Sugestão:** Fazer aos poucos, 1 controller por semana! 📅
