#!/bin/bash

# Script para deploy da Landing Page no VPS
# Subdomínio: lp.boraindicar.com.br

set -e

echo "======================================"
echo "DEPLOY LANDING PAGE - BORA INDICAR"
echo "Subdomínio: lp.boraindicar.com.br"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verificar se estamos no diretório correto
log_info "Verificando diretório do projeto..."
if [ ! -f "package.json" ]; then
    log_error "Arquivo package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# 2. Fazer pull das alterações
log_info "Atualizando código do repositório..."
git pull origin main || {
    log_warn "Falha ao fazer pull. Continuando com código local..."
}

# 3. Instalar dependências (se necessário)
log_info "Verificando dependências..."
npm install --production

# 4. Build do projeto Next.js
log_info "Gerando build de produção..."
npm run build

# 5. Configurar Nginx para o subdomínio
log_info "Configurando Nginx..."

# Copiar arquivo de configuração do nginx
sudo cp nginx-lp-subdomain.conf /etc/nginx/sites-available/lp.boraindicar.com.br

# Criar link simbólico (se não existir)
if [ ! -L /etc/nginx/sites-enabled/lp.boraindicar.com.br ]; then
    sudo ln -s /etc/nginx/sites-available/lp.boraindicar.com.br /etc/nginx/sites-enabled/
    log_info "Link simbólico criado"
else
    log_info "Link simbólico já existe"
fi

# Testar configuração do Nginx
log_info "Testando configuração do Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    log_info "Configuração do Nginx OK!"
    
    # Recarregar Nginx
    log_info "Recarregando Nginx..."
    sudo systemctl reload nginx
else
    log_error "Erro na configuração do Nginx!"
    exit 1
fi

# 6. Configurar SSL com Certbot (se ainda não configurado)
log_info "Verificando certificado SSL..."
if [ ! -d "/etc/letsencrypt/live/lp.boraindicar.com.br" ]; then
    log_warn "Certificado SSL não encontrado. Configurando..."
    
    # Instalar certbot se necessário
    if ! command -v certbot &> /dev/null; then
        log_info "Instalando Certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Obter certificado SSL
    log_info "Obtendo certificado SSL..."
    sudo certbot --nginx -d lp.boraindicar.com.br --non-interactive --agree-tos --email contato@boraindicar.com.br
    
    if [ $? -eq 0 ]; then
        log_info "Certificado SSL configurado com sucesso!"
    else
        log_error "Falha ao configurar SSL. Configure manualmente com: sudo certbot --nginx -d lp.boraindicar.com.br"
    fi
else
    log_info "Certificado SSL já configurado"
fi

# 7. Reiniciar aplicação Next.js (PM2)
log_info "Reiniciando aplicação..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    log_warn "PM2 não encontrado. Instalando..."
    sudo npm install -g pm2
fi

# Verificar se a aplicação já está rodando no PM2
if pm2 list | grep -q "nextjs-app"; then
    log_info "Reiniciando aplicação no PM2..."
    pm2 restart nextjs-app
else
    log_info "Iniciando aplicação no PM2..."
    pm2 start npm --name "nextjs-app" -- start
    pm2 save
    pm2 startup
fi

# 8. Verificar status
log_info "Verificando serviços..."
echo ""
echo "Status do Nginx:"
sudo systemctl status nginx --no-pager | head -5
echo ""
echo "Status da Aplicação (PM2):"
pm2 status
echo ""

# 9. Teste final
log_info "Testando conectividade..."
sleep 2

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/lp | grep -q "200\|301\|302"; then
    log_info "Aplicação respondendo corretamente!"
else
    log_warn "Aplicação pode não estar respondendo. Verifique os logs com: pm2 logs"
fi

echo ""
echo "======================================"
echo -e "${GREEN}DEPLOY CONCLUÍDO!${NC}"
echo "======================================"
echo ""
log_info "Landing page disponível em: https://lp.boraindicar.com.br"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs: pm2 logs nextjs-app"
echo "  - Status: pm2 status"
echo "  - Restart: pm2 restart nextjs-app"
echo "  - Logs Nginx: sudo tail -f /var/log/nginx/lp.boraindicar.com.br.access.log"
echo ""

# 10. Mostrar checklist pós-deploy
echo "======================================"
echo "CHECKLIST PÓS-DEPLOY"
echo "======================================"
echo ""
echo "[ ] 1. DNS configurado apontando para o IP do VPS"
echo "[ ] 2. Acessar https://lp.boraindicar.com.br"
echo "[ ] 3. Testar formulário de contato"
echo "[ ] 4. Verificar responsividade mobile"
echo "[ ] 5. Testar todos os links da navegação"
echo "[ ] 6. Verificar certificado SSL (cadeado verde)"
echo ""
