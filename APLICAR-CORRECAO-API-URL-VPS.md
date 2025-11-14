# 🔧 Aplicar Correção de API URL no VPS

## 📋 Comandos para Executar no VPS

### Opção 1: Comando Único (Recomendado)

Conecte-se ao VPS e execute:

```bash
cd /root/crm && git pull && bash aplicar-correcao-api-url-vps.sh
```

Este comando irá:
1. Entrar no diretório do projeto
2. Fazer git pull para baixar as alterações
3. Executar o script de correção

---

### Opção 2: Passo a Passo

Se preferir executar passo a passo:

```bash
# 1. Conectar ao VPS
ssh root@seu-servidor.com

# 2. Ir para o diretório do projeto
cd /root/crm

# 3. Fazer pull das alterações
git pull

# 4. Executar o script de correção
bash aplicar-correcao-api-url-vps.sh
```

---

## 🚀 O que o Script Faz

1. ✅ Cria backup dos arquivos antes de modificar
2. ✅ Corrige o `API_URL` em 4 componentes
3. ✅ Commita as alterações
4. ✅ Para os containers Docker
5. ✅ Faz rebuild do frontend
6. ✅ Reinicia todos os containers
7. ✅ Mostra os logs para verificação

---

## 📊 Verificar Resultado

Após executar, verifique se não há mais erros 500:

```bash
# Monitorar logs do backend
docker-compose logs -f backend

# Verificar últimas 50 linhas
docker-compose logs --tail=50 backend | grep -i "erro\|error\|500"

# Ver status dos containers
docker-compose ps
```

---

## ✅ Arquivos Corrigidos

- `components/views/FollowUpView.tsx`
- `components/admin/MensagensPredefinidasPanel.tsx`
- `components/admin/views/ConfiguracoesAdminView.tsx`
- `components/MensagensPredefinidasChatPanel.tsx`

Todos agora usam: `http://localhost:3001/api` (com `/api`)

---

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```bash
cd /root/crm

# Ver backups disponíveis
ls -la backups/

# Restaurar do backup (use a data/hora do backup)
cp backups/20241114_HHMMSS/* .

# Rebuild
docker-compose down
docker-compose up -d --build
```

---

## 🎯 Testando a Correção

Após aplicar, teste estas funcionalidades no navegador:

1. **Área Admin** → Configurações
   - ✅ Comissões devem carregar
   - ✅ Lootbox deve carregar
   - ✅ Mensagens pré-definidas devem carregar

2. **Área CRM** → Follow-Up
   - ✅ Sequências devem listar
   - ✅ Estatísticas devem aparecer
   - ✅ Próximos envios devem carregar

3. **Chat** → Mensagens pré-definidas
   - ✅ Painel de mensagens deve abrir
   - ✅ Lista de mensagens deve carregar

---

## 📝 Notas Importantes

- O script cria backup automático antes de modificar
- O rebuild do frontend pode levar alguns minutos
- Os containers serão reiniciados automaticamente
- Não é necessário fazer downtime manual

---

## ⚠️ Troubleshooting

### Se o git pull falhar:
```bash
cd /root/crm
git stash
git pull
bash aplicar-correcao-api-url-vps.sh
```

### Se o frontend não buildar:
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Se ainda houver erros 500:
```bash
# Ver logs detalhados
docker-compose logs backend | grep "500\|erro\|error"

# Reiniciar apenas o backend
docker-compose restart backend
```

---

**Tempo estimado:** 5-10 minutos
**Downtime:** ~2 minutos durante o rebuild
**Risco:** Baixo (backup automático criado)
