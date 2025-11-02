# Dockerfile para Backend (Node.js + TypeScript)
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3001

# Comando para iniciar em modo desenvolvimento
CMD ["npm", "run", "dev"]
