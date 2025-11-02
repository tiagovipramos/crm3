# Dockerfile para Frontend (Next.js)
FROM node:20-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm install

# Rebuild do código fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build do Next.js
RUN npm run build

# Imagem de produção, copiar todos os arquivos e rodar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar node_modules e arquivos de build
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
