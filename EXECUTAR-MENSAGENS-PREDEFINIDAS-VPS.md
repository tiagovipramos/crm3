# 🚀 Executar Migration 13 - Mensagens e Áudios Pré-Definidos na VPS

## 📋 Pré-requisitos
- Docker e Docker Compose rodando
- Container `crm-mysql` ativo

## 🔧 Passo a Passo

### 1️⃣ Fazer Pull das Alterações
```bash
cd /root/crm3
git pull origin main
```

### 2️⃣ Tornar o Script Executável
```bash
chmod +x backend/executar-migration-mensagens-predefinidas.sh
```

### 3️⃣ Executar a Migration
```bash
./backend/executar-migration-mensagens-predefinidas.sh
```

### 4️⃣ Reconstruir e Reiniciar Containers
```bash
# Rebuild do backend (para incluir novos arquivos)
docker-compose build backend

# Restart dos containers
docker-compose restart backend
docker-compose restart frontend
```

### 5️⃣ Verificar Logs
```bash
# Verificar logs do backend
docker-compose logs -f backend

# Verificar se as tabelas foram criadas
docker exec -it crm-mysql mysql -uroot -p'Crm@VPS2025!Secure#ProdDB' -e "USE protecar_crm; SHOW TABLES LIKE '%predefinid%';"
```

## ✅ Resultado Esperado

Você deve ver:
- ✅ Tabela `mensagens_predefinidas` criada
- ✅ Tabela `audios_predefinidos` criada
- ✅ Backend reiniciado sem erros
- ✅ Frontend atualizado

## 🎯 Como Testar

### No Admin:
1. Acesse: `https://admin.boraindicar.com.br`
2. Vá em **Configurações**
3. Role até **"Mensagens e Áudios Pré-Definidos"**
4. Crie mensagens de texto
5. Faça upload de áudios (MP3, OGG, WAV)

### No Chat CRM:
1. Acesse: `https://boraindicar.com.br`
2. Abra um chat com um lead
3. Clique no botão 📄 (ao lado do clips)
4. Veja o painel com abas "Mensagens" e "Áudios"
5. Clique em uma mensagem/áudio para usar

## 🔄 Em Tempo Real

As alterações feitas no admin aparecem **instantaneamente** no chat, sem necessidade de recarregar a página.

## 🐛 Troubleshooting

### Migration falhou?
```bash
# Verificar se as tabelas já existem
docker exec -it crm-mysql mysql -uroot -p'Crm@VPS2025!Secure#ProdDB' -e "USE protecar_crm; SHOW TABLES;"

# Se as tabelas já existem, drop e recrie
docker exec -it crm-mysql mysql -uroot -p'Crm@VPS2025!Secure#ProdDB' -e "USE protecar_crm; DROP TABLE IF EXISTS mensagens_predefinidas, audios_predefinidos;"

# Execute novamente
./backend/executar-migration-mensagens-predefinidas.sh
```

### Backend não reiniciou?
```bash
# Forçar rebuild completo
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Painel não aparece no chat?
```bash
# Limpar cache do navegador
# Ou abrir em modo anônimo para testar
```

## 📊 Estrutura das Tabelas

### mensagens_predefinidas
- `id` - Chave primária
- `titulo` - Título da mensagem
- `conteudo` - Texto da mensagem
- `ativo` - Se está ativa (1) ou não (0)
- `criado_em` - Data de criação
- `atualizado_em` - Data de atualização

### audios_predefinidos
- `id` - Chave primária
- `titulo` - Título do áudio
- `arquivo_url` - Caminho do arquivo
- `duracao` - Duração em segundos
- `ativo` - Se está ativo (1) ou não (0)
- `criado_em` - Data de criação
- `atualizado_em` - Data de atualização
