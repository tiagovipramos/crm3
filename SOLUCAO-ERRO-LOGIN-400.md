# Solução para Erro 400 no Login em Produção

## 🔍 Diagnóstico

Baseado nos logs fornecidos:
```
{"level":"WARN","time":1763429376974,"msg":"⚠️ Requisição com erro","requestId":"d9d48e35-8d5e-4aea-8447-ace06a40cb23","method":"POST","url":"/login","statusCode":400,"duration":"5ms"}
```

O erro 400 indica que a requisição está chegando ao backend, mas os dados não estão sendo processados corretamente.

## 🎯 Causas Possíveis

1. **Body da requisição vazio** - O NGINX pode não estar passando o body corretamente
2. **Content-Type incorreto** - Headers não estão sendo preservados
3. **Body size limit** - O payload pode estar excedendo o limite
4. **CORS/Preflight** - Requisição OPTIONS não configurada

## ✅ Solução Implementada

### 1. Verificar Configuração do NGINX

O NGINX precisa estar configurado para:
- Passar o body da requisição
- Preservar os headers Content-Type e Authorization
- Configurar timeouts adequados

### 2. Confirmar Configuração do Express

O Express já está configurado corretamente em `server.ts`:
```javascript
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
```

### 3. Verificar Rota de Login

A rota `/api/auth/login` está correta e valida:
```javascript
if (!email || !senha) {
  return res.status(400).json({ error: 'Email e senha são obrigatórios' });
}
```

## 🔧 Passos para Corrigir

### Passo 1: Executar Diagnóstico

No servidor VPS, execute:
```bash
cd ~/crm
chmod +x diagnostico-login-400-completo.sh
./diagnostico-login-400-completo.sh
```

### Passo 2: Verificar Configuração do NGINX

```bash
# Ver configuração atual
cat /etc/nginx/sites-enabled/boraindicar.com.br

# Verificar sintaxe
sudo nginx -t
```

A configuração deve incluir:
```nginx
location /api/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # IMPORTANTE: Garantir que o body seja passado
    proxy_request_buffering off;
    client_max_body_size 20M;
}
```

### Passo 3: Testar Login Direto no Backend

```bash
# Teste sem passar pelo NGINX
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}' \
  -v
```

Se funcionar, o problema está no NGINX.

### Passo 4: Verificar Logs em Tempo Real

```bash
# Terminal 1: Logs do backend
docker logs -f crm-backend

# Terminal 2: Testar login
curl -X POST https://boraindicar.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}'
```

## 🚀 Script de Correção Automática

Execute o script de correção:
```bash
cd ~/crm
chmod +x corrigir-login-400-producao.sh
./corrigir-login-400-producao.sh
```

## 📝 Checklist de Verificação

- [ ] Backend está rodando e respondendo em /api/health
- [ ] Banco de dados está acessível
- [ ] NGINX está configurado corretamente
- [ ] Headers Content-Type estão sendo preservados
- [ ] Body da requisição está chegando ao backend
- [ ] Não há erros nos logs do Docker
- [ ] CORS está configurado para aceitar o domínio

## 🔍 Depuração Adicional

Se o problema persistir, adicione logs temporários no `authController.ts`:

```javascript
export const login = async (req: Request, res: Response) => {
  try {
    console.log('=== LOGIN REQUEST DEBUG ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Method:', req.method);
    console.log('Content-Type:', req.get('content-type'));
    console.log('===========================');
    
    const { email, senha } = req.body;
    // ... resto do código
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};
```

Depois rebuild o container:
```bash
docker-compose up -d --build backend
```

## 💡 Soluções Rápidas

### Solução 1: Reiniciar Serviços
```bash
docker-compose restart backend
sudo systemctl restart nginx
```

### Solução 2: Limpar Cache do NGINX
```bash
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx
```

### Solução 3: Verificar Firewall
```bash
sudo ufw status
# Garantir que porta 3001 está aberta para localhost
```

## 📊 Monitoramento

Após aplicar a correção, monitore:
```bash
# Logs do backend
docker logs -f crm-backend

# Logs do NGINX
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Status dos containers
docker-compose ps
```

## ✅ Teste Final

```bash
# Teste completo do fluxo de login
curl -X POST https://boraindicar.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@protecar.com","senha":"Admin@2024"}' \
  | jq
```

Deve retornar:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "consultor": {
    "id": 1,
    "nome": "Admin",
    "email": "admin@protecar.com",
    ...
  }
}
```

## 📞 Suporte

Se o problema persistir, forneça:
1. Output do script de diagnóstico
2. Logs do backend (últimas 100 linhas)
3. Configuração do NGINX
4. Resultado dos testes de curl
