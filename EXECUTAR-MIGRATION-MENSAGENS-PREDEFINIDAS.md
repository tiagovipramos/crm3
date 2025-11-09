# Como Executar a Migration de Mensagens Pré-Definidas na VPS

## ✅ Para VPS Ubuntu Linux (Produção)

1. **Conecte-se à VPS via SSH**
2. **Navegue até o diretório do backend**:
```bash
cd /caminho/do/projeto/backend
```

3. **Execute o script de migration**:
```bash
bash executar-migration-mensagens-predefinidas.sh
```

Ou diretamente com mysql:
```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < migrations/13-mensagens-audios-predefinidos.sql
```

## Verificar se a Migration foi Executada

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SHOW TABLES LIKE 'mensagens_predefinidas';"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT * FROM mensagens_predefinidas;"
```

Você deve ver 5 mensagens de exemplo já inseridas:
- Boas-vindas
- Horário de Atendimento
- Informações sobre Produto
- Agendamento
- Agradecimento

## Em Caso de Erro

**Erro: "Tabela já existe"**
- A migration já foi executada, pode prosseguir

**Erro: "Access denied"**
- Verifique as credenciais no arquivo `.env`
- Certifique-se de que o usuário tem permissões

**Erro: "Can't connect to MySQL server"**
- Verifique se o MySQL está rodando: `systemctl status mysql`
- Verifique o host e porta no `.env`

## Após Executar a Migration

1. **Reinicie o backend** para carregar as novas rotas:
```bash
pm2 restart all
# ou
docker-compose restart backend
```

2. **Teste a API**:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://sua-vps/api/configuracoes/mensagens-predefinidas
```

A migration está pronta para produção! 🚀
