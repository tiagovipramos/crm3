#!/bin/bash

# Script para configurar subdomínios sem caminho na URL
# Exemplo: admin.boraindicar.com.br/ em vez de admin.boraindicar.com.br/admin

echo "🔧 Configurando subdomínios limpos"
echo "===================================="
echo ""

# Criar nova configuração do Nginx
echo "📝 Criando nova configuração do Nginx..."
sudo tee /etc/nginx/sites-available/boraindicar.com.br > /dev/null <<'EOF'
# Site principal - boraindicar.com.br
server {
    listen 80;
    server_name boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CRM - crm.boraindicar.com.br (sem /crm na URL)
server {
    listen 80;
    server_name crm.boraindicar.com.br;
    
    # Redirecionar raiz para /crm internamente
    location / {
        proxy_pass http://localhost:3000/crm/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Reescrever a URL para remover /crm da resposta
        proxy_redirect http://localhost:3000/crm/ /;
        proxy_redirect https://localhost:3000/crm/ /;
    }
    
    # Proxy para recursos estáticos (CSS, JS, imagens)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin - admin.boraindicar.com.br (sem /admin na URL)
server {
    listen 80;
    server_name admin.boraindicar.com.br;
    
    # Redirecionar raiz para /admin internamente
    location / {
        proxy_pass http://localhost:3000/admin/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Reescrever a URL para remover /admin da resposta
        proxy_redirect http://localhost:3000/admin/ /;
        proxy_redirect https://localhost:3000/admin/ /;
    }
    
    # Proxy para recursos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Indicador - indicador.boraindicar.com.br (sem /indicador na URL)
server {
    listen 80;
    server_name indicador.boraindicar.com.br;
    
    # Redirecionar raiz para /indicador internamente
    location / {
        proxy_pass http://localhost:3000/indicador/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Reescrever a URL para remover /indicador da resposta
        proxy_redirect http://localhost:3000/indicador/ /;
        proxy_redirect https://localhost:3000/indicador/ /;
    }
    
    # Proxy para recursos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Backend - api.boraindicar.com.br
server {
    listen 80;
    server_name api.boraindicar.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✅ Configuração criada!"
echo ""

# Testar configuração
echo "🧪 Testando configuração..."
sudo nginx -t
echo ""

if [ $? -eq 0 ]; then
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recarregado!"
    echo ""
    
    echo "===================================="
    echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
    echo "===================================="
    echo ""
    echo "🎯 Agora os subdomínios funcionam assim:"
    echo ""
    echo "   https://admin.boraindicar.com.br/      (sem /admin na URL)"
    echo "   https://crm.boraindicar.com.br/        (sem /crm na URL)"
    echo "   https://indicador.boraindicar.com.br/  (sem /indicador na URL)"
    echo ""
    echo "Teste acessando os domínios no navegador!"
    echo ""
else
    echo "❌ Erro na configuração do Nginx!"
    echo "Verifique os erros acima."
fi
