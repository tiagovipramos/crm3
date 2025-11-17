import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso - Bora Indicar',
  description: 'Termos de Uso da plataforma Bora Indicar',
};

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Termos de Uso</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Última atualização:</strong> 16 de novembro de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Bem-vindo à plataforma <strong>Bora Indicar</strong>. Ao acessar e utilizar nossos serviços, 
              você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concorda 
              com qualquer parte destes termos, não deve utilizar nossa plataforma.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Estes Termos de Uso constituem um acordo legal entre você (usuário) e a Bora Indicar. 
              Recomendamos que você leia atentamente todos os termos antes de utilizar a plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A Bora Indicar é uma plataforma de gestão de relacionamento com clientes (CRM) que oferece:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Sistema de gestão de leads e indicações</li>
              <li>Programa de recompensas e incentivos para indicadores</li>
              <li>Ferramentas de comunicação integradas (WhatsApp, mensagens)</li>
              <li>Dashboard administrativo para gestão de equipes e vendas</li>
              <li>Sistema de gamificação com lootbox e prêmios</li>
              <li>Relatórios e análises de desempenho</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Cadastro e Conta do Usuário</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Elegibilidade</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para utilizar a plataforma, você deve:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Ter pelo menos 18 anos de idade</li>
              <li>Possuir capacidade legal para firmar contratos</li>
              <li>Fornecer informações verdadeiras, precisas e completas</li>
              <li>Manter suas informações de cadastro atualizadas</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Responsabilidade pela Conta</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você é responsável por:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Não compartilhar sua conta com terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Uso Aceitável da Plataforma</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Você PODE:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Utilizar a plataforma para fins comerciais legítimos</li>
              <li>Fazer indicações de leads qualificados</li>
              <li>Comunicar-se de forma profissional com leads e equipe</li>
              <li>Participar do programa de recompensas conforme as regras</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Você NÃO PODE:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Usar a plataforma para atividades ilegais ou fraudulentas</li>
              <li>Criar múltiplas contas para obter vantagens indevidas</li>
              <li>Fazer spam, enviar mensagens abusivas ou impróprias</li>
              <li>Tentar hackear, comprometer ou prejudicar a plataforma</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Coletar dados de outros usuários sem autorização</li>
              <li>Utilizar bots, scripts ou ferramentas automatizadas não autorizadas</li>
              <li>Manipular o sistema de recompensas ou indicações</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Programa de Indicações e Recompensas</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.1 Regras do Programa</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>As recompensas são concedidas conforme critérios estabelecidos pelo administrador</li>
              <li>Indicações devem ser de leads reais e qualificados</li>
              <li>Indicações fraudulentas ou duplicadas podem ser desqualificadas</li>
              <li>A Bora Indicar reserva-se o direito de validar todas as indicações</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Pagamentos e Saques</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Pagamentos estão sujeitos às regras específicas do programa</li>
              <li>Valores mínimos para saque podem ser estabelecidos</li>
              <li>Prazo para processamento de saques conforme política interna</li>
              <li>Impostos e taxas são de responsabilidade do usuário</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Todo o conteúdo da plataforma, incluindo mas não limitado a textos, gráficos, logotipos, 
              ícones, imagens, áudios, vídeos, software e código, é propriedade da Bora Indicar ou de 
              seus licenciadores e está protegido pelas leis de direitos autorais e propriedade intelectual.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Você recebe uma licença limitada, não exclusiva e revogável para acessar e usar a plataforma 
              conforme estes Termos. Esta licença não permite:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Modificar, copiar ou reproduzir o conteúdo da plataforma</li>
              <li>Realizar engenharia reversa do software</li>
              <li>Remover marcas registradas ou avisos de direitos autorais</li>
              <li>Utilizar o conteúdo para fins comerciais sem autorização</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Conteúdo do Usuário</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ao enviar, publicar ou exibir conteúdo na plataforma (mensagens, fotos, dados de leads, etc.), 
              você concede à Bora Indicar uma licença mundial, não exclusiva e isenta de royalties para 
              usar, reproduzir, processar e armazenar esse conteúdo para operar e melhorar nossos serviços.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Você é o único responsável pelo conteúdo que compartilha e declara que possui todos os 
              direitos necessários sobre esse conteúdo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Privacidade e Proteção de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Sua privacidade é importante para nós. O tratamento de seus dados pessoais é regido por 
              nossa <a href="/politica-privacidade" className="text-blue-600 hover:underline">Política de Privacidade</a>, 
              que faz parte integrante destes Termos de Uso. Ao utilizar a plataforma, você também concorda 
              com os termos da Política de Privacidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Suspensão e Encerramento de Conta</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A Bora Indicar reserva-se o direito de suspender ou encerrar sua conta, a qualquer momento 
              e sem aviso prévio, se você:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Violar estes Termos de Uso</li>
              <li>Realizar atividades fraudulentas ou ilegais</li>
              <li>Comprometer a segurança da plataforma</li>
              <li>Prejudicar outros usuários ou a reputação da empresa</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Você pode encerrar sua conta a qualquer momento através das configurações da plataforma 
              ou entrando em contato com nosso suporte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Isenção de Garantias</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A plataforma é fornecida "COMO ESTÁ" e "CONFORME DISPONÍVEL", sem garantias de qualquer tipo, 
              expressas ou implícitas. Não garantimos que:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>A plataforma funcionará sem interrupções ou erros</li>
              <li>Os defeitos serão corrigidos imediatamente</li>
              <li>A plataforma estará livre de vírus ou componentes prejudiciais</li>
              <li>Os resultados obtidos serão precisos ou confiáveis</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Limitação de Responsabilidade</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Na máxima extensão permitida por lei, a Bora Indicar não será responsável por:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Danos diretos, indiretos, incidentais, especiais ou consequenciais</li>
              <li>Perda de lucros, receitas, dados ou oportunidades de negócio</li>
              <li>Interrupção de negócios ou perda de informações</li>
              <li>Atos ou omissões de terceiros</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Indenização</h2>
            <p className="text-gray-700 leading-relaxed">
              Você concorda em indenizar, defender e isentar a Bora Indicar, seus diretores, funcionários 
              e parceiros de quaisquer reivindicações, responsabilidades, danos, perdas e despesas 
              (incluindo honorários advocatícios) decorrentes de:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Sua violação destes Termos de Uso</li>
              <li>Seu uso inadequado da plataforma</li>
              <li>Violação de direitos de terceiros</li>
              <li>Qualquer conteúdo que você enviar ou compartilhar</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Modificações dos Termos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Quando fizermos 
              alterações materiais, notificaremos você por e-mail ou através de um aviso na plataforma.
            </p>
            <p className="text-gray-700 leading-relaxed">
              O uso continuado da plataforma após as alterações constitui sua aceitação dos novos termos. 
              Se você não concordar com as modificações, deve parar de usar a plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">14. Links para Sites de Terceiros</h2>
            <p className="text-gray-700 leading-relaxed">
              Nossa plataforma pode conter links para sites de terceiros. Não somos responsáveis pelo 
              conteúdo, políticas de privacidade ou práticas desses sites. O acesso a sites de terceiros 
              é por sua conta e risco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">15. Comunicações Eletrônicas</h2>
            <p className="text-gray-700 leading-relaxed">
              Ao utilizar a plataforma, você concorda em receber comunicações eletrônicas nossas, incluindo 
              e-mails, notificações push e mensagens na plataforma. Você concorda que todas as comunicações 
              eletrônicas satisfazem qualquer requisito legal de comunicação por escrito.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">16. Lei Aplicável e Jurisdição</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, incluindo:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</li>
              <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
              <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Qualquer disputa relacionada a estes termos será resolvida exclusivamente pelos tribunais 
              da comarca de [CIDADE], Brasil, com renúncia expressa a qualquer outro foro, por mais 
              privilegiado que seja.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">17. Disposições Gerais</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">17.1 Acordo Integral</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estes Termos de Uso, juntamente com a Política de Privacidade, constituem o acordo integral 
              entre você e a Bora Indicar.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">17.2 Divisibilidade</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais 
              disposições permanecerão em pleno vigor e efeito.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">17.3 Renúncia</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              A falha em exercer ou fazer cumprir qualquer direito ou disposição destes Termos não 
              constituirá renúncia a tal direito ou disposição.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">17.4 Cessão</h3>
            <p className="text-gray-700 leading-relaxed">
              Você não pode transferir ou ceder seus direitos sob estes Termos sem nosso consentimento 
              prévio por escrito. Podemos ceder nossos direitos a qualquer momento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">18. Contato</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Bora Indicar</strong></p>
              <p className="text-gray-700">E-mail: <a href="mailto:suporte@boraindicar.com.br" className="text-blue-600 hover:underline">suporte@boraindicar.com.br</a></p>
              <p className="text-gray-700">E-mail jurídico: <a href="mailto:juridico@boraindicar.com.br" className="text-blue-600 hover:underline">juridico@boraindicar.com.br</a></p>
              <p className="text-gray-700">Website: <a href="https://www.boraindicar.com.br" className="text-blue-600 hover:underline">www.boraindicar.com.br</a></p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 bg-blue-50 p-6 rounded-lg">
            <p className="text-sm text-gray-700 mb-4">
              <strong>Ao clicar em "Aceito" durante o cadastro ou ao continuar usando a plataforma Bora Indicar, 
              você reconhece que leu, compreendeu e concorda em estar vinculado a estes Termos de Uso.</strong>
            </p>
            <p className="text-sm text-gray-600">
              Recomendamos que você imprima ou salve uma cópia destes Termos para seus registros.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              © 2025 Bora Indicar. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
