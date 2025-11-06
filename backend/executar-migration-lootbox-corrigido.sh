#!/bin/bash

echo "🔄 Executando migration para corrigir configurações de lootbox..."

docker-compose exec backend node -e "
const pool = require('./dist/config/database').default;
const fs = require('fs');

const sql = fs.readFileSync('./migrations/11-corrigir-configuracoes-lootbox.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Migration 11 executada com sucesso!');
    console.log('📋 Novas colunas adicionadas:');
    console.log('  - indicacoes_necessarias');
    console.log('  - premio_minimo_indicacoes');
    console.log('  - premio_maximo_indicacoes');
    console.log('  - probabilidade_baixo_indicacoes');
    console.log('  - probabilidade_medio_indicacoes');
    console.log('  - probabilidade_alto_indicacoes');
    console.log('📋 Colunas renomeadas:');
    console.log('  - premio_minimo → premio_minimo_vendas');
    console.log('  - premio_maximo → premio_maximo_vendas');
    console.log('  - probabilidade_baixo → probabilidade_baixo_vendas');
    console.log('  - probabilidade_medio → probabilidade_medio_vendas');
    console.log('  - probabilidade_alto → probabilidade_alto_vendas');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao executar migration:', err);
    process.exit(1);
  });
"
