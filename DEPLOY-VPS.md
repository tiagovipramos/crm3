# Deploy na VPS - Instruções

## IP da VPS
**185.217.125.72**

## Passos para Deploy

### 1. Clonar o Repositório na VPS
```bash
cd /opt
git clone <URL_DO_SEU_REPO_GITHUB>
cd CRM
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar o arquivo de configuração da VPS
cp .env.vps .env

# IMPORTANTE: Editar e alterar as senhas
nano .env
```

### 3. Executar o Script de Instalação
```bash
chmod +x install-vps.sh
./install-vps.sh
```

### 4. Iniciar os Containers
```bash
docker-compose up -d
```

### 5. Verificar Status
```bash
docker-compose ps
docker-compose logs -f
```

## URLs de Acesso
- **Frontend**: http://185.217.125.72:3000
- **Backend API**: http://185.217.125.72:3001

## Portas que Precisam Estar Abertas
- **3000** - Frontend Next.js
- **3001** - Backend API
- **3306** - MySQL (apenas para acesso interno do Docker)

## Comandos Úteis

### Ver Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Parar Sistema
```bash
docker-compose down
```

### Reiniciar Sistema
```bash
docker-compose restart
```

### Backup do Banco de Dados
```bash
docker exec crm-mysql mysqldump -u root -p protecar_crm > backup_$(date +%Y%m%d).sql
```

## O que Está Configurado

✅ Docker Compose com 3 serviços (MySQL, Backend, Frontend)
✅ Migrations automáticas do banco de dados
✅ Volumes persistentes para banco de dados
✅ Healthcheck do MySQL
✅ Restart automático dos containers
✅ Uploads e arquivos de autenticação persistidos

## Próximos Passos Recomendados (Futuro)

- [ ] Configurar HTTPS com Nginx/Caddy
- [ ] Configurar domínio (quando disponível)
- [ ] Implementar backup automático diário
- [ ] Configurar monitoramento (Portainer, Grafana)
- [ ] Implementar CI/CD com GitHub Actions
