#!/bin/bash

# Script para deploy da Landing Page no VPS com Docker
# Subdomínio: lp.boraindicar.com.br

set -e

echo "======================================"
echo "DEPLOY LANDING PAGE - BORA INDICAR"
echo "Subdomínio: lp.boraindicar.com.br"
echo "Modo: Docker"
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
if [ ! -f "docker-compose.yml" ]; then
    log_error "Arquivo docker-compose.yml não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# 2. DNS já está configurado
log_info "Verificando DNS..."
if nslookup lp.boraindicar.com.br | grep -q "185.217.125.72"; then
    log_info "DNS configurado corretamente! ✓"
else
    log_warn "DNS pode não estar propagado ainda. Verifique em alguns minutos."
fi

# 3. Configurar Nginx para o subdomínio
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

# 4. Configurar SSL com Certbot (se ainda não configurado)
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

# 5. Verificar se os containers Docker estão rodando
log_info "Verificando containers Docker..."
if docker ps | grep -q "crm-frontend"; then
    log_info "Container frontend está rodando ✓"
else
    log_warn "Container frontend não está rodando. Iniciando containers..."
    docker-compose up -d
fi

# 6. Verificar status
log_info "Verificando serviços..."
echo ""
echo "Status do Nginx:"
sudo systemctl status nginx --no-pager | head -5
echo ""
echo "Status dos Containers Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 7. Teste final
log_info "Testando conectividade..."
sleep 2

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/lp | grep -q "200\|301\|302"; then
    log_info "Landing page respondendo corretamente!"
else
    log_warn "Landing page pode não estar acessível. Verifique os logs com: docker-compose logs frontend"
fi

echo ""
echo "======================================"
echo -e "${GREEN}DEPLOY CONCLUÍDO!${NC}"
echo "======================================"
echo ""
log_info "Landing page disponível em: https://lp.boraindicar.com.br"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f frontend"
echo "  - Status: docker ps"
echo "  - Restart: docker-compose restart frontend"
echo "  - Logs Nginx: sudo tail -f /var/log/nginx/lp.boraindicar.com.br.access.log"
echo ""

# 8. Mostrar checklist pós-deploy
echo "======================================"
echo "CHECKLIST PÓS-DEPLOY"
echo "======================================"
echo ""
echo "[✓] 1. DNS configurado apontando para o IP do VPS"
echo "[ ] 2. Acessar https://lp.boraindicar.com.br"
echo "[ ] 3. Testar formulário de contato"
echo "[ ] 4. Verificar responsividade mobile"
echo "[ ] 5. Testar todos os links da navegação"
echo "[ ] 6. Verificar certificado SSL (cadeado verde)"
echo ""
