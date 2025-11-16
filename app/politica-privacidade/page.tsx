import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade - Bora Indicar',
  description: 'Política de Privacidade da plataforma Bora Indicar',
};

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Última atualização:</strong> 16 de novembro de 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              A <strong>Bora Indicar</strong> ("nós", "nosso" ou "nos") está comprometida em proteger 
              sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos 
              e protegemos suas informações quando você utiliza nossa plataforma.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo 
              com esta política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Informações que Coletamos</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Dados de Cadastro:</strong> Nome, e-mail, telefone, CPF/CNPJ</li>
              <li><strong>Dados de Perfil:</strong> Foto de perfil, informações profissionais</li>
              <li><strong>Dados de Comunicação:</strong> Mensagens trocadas através da plataforma</li>
              <li><strong>Dados de Indicações:</strong> Informações sobre leads e indicações realizadas</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Endereço IP e informações do dispositivo</li>
              <li>Tipo de navegador e sistema operacional</li>
              <li>Páginas visitadas e tempo de navegação</li>
              <li>Dados de cookies e tecnologias similares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Como Usamos Suas Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Fornecer, operar e manter nossa plataforma</li>
              <li>Processar suas indicações e gerenciar seu programa de recompensas</li>
              <li>Comunicar-nos com você sobre atualizações, ofertas e informações relevantes</li>
              <li>Melhorar nossos serviços e desenvolver novos recursos</li>
              <li>Prevenir fraudes e garantir a segurança da plataforma</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Enviar notificações importantes sobre sua conta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas 
              seguintes situações:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Com seu consentimento:</strong> Quando você autoriza expressamente</li>
              <li><strong>Prestadores de serviços:</strong> Empresas que nos auxiliam na operação da plataforma</li>
              <li><strong>Obrigações legais:</strong> Quando exigido por lei ou ordem judicial</li>
              <li><strong>Proteção de direitos:</strong> Para proteger nossos direitos, propriedade ou segurança</li>
              <li><strong>Parceiros comerciais:</strong> Somente informações necessárias para processar indicações</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Segurança dos Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Criptografia de dados em trânsito e em repouso (SSL/TLS)</li>
              <li>Controles de acesso rigorosos</li>
              <li>Monitoramento contínuo de segurança</li>
              <li>Backups regulares e seguros</li>
              <li>Auditorias periódicas de segurança</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Apesar de nossos esforços, nenhum método de transmissão pela internet é 100% seguro. 
              Não podemos garantir segurança absoluta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Seus Direitos (LGPD)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Acesso:</strong> Solicitar informações sobre seus dados pessoais</li>
              <li><strong>Correção:</strong> Atualizar dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais</li>
              <li><strong>Portabilidade:</strong> Solicitar a transferência de seus dados</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
              <li><strong>Oposição:</strong> Opor-se ao tratamento de seus dados</li>
              <li><strong>Informação:</strong> Obter informações sobre com quem compartilhamos seus dados</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Para exercer seus direitos, entre em contato conosco através do e-mail: <strong>privacidade@boraindicar.com.br</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos cookies e tecnologias similares para:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Manter você conectado à plataforma</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o desempenho da plataforma</li>
              <li>Personalizar sua experiência</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Você pode configurar seu navegador para recusar cookies, mas isso pode afetar a funcionalidade 
              da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Retemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos 
              nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei. 
              Após este período, seus dados serão excluídos ou anonimizados de forma segura.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Transferência Internacional de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Seus dados podem ser transferidos e mantidos em servidores localizados fora do seu estado, 
              província, país ou outra jurisdição governamental. Ao utilizar nossos serviços, você concorda 
              com essa transferência. Garantimos que todas as transferências são realizadas em conformidade 
              com as leis aplicáveis de proteção de dados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Menores de Idade</h2>
            <p className="text-gray-700 leading-relaxed">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente 
              informações pessoais de menores. Se você é pai ou responsável e acredita que seu filho nos 
              forneceu informações pessoais, entre em contato conosco para que possamos tomar as medidas 
              necessárias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Alterações nesta Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre 
              quaisquer alterações publicando a nova política nesta página e atualizando a data de 
              "Última atualização". Recomendamos que você revise esta política periodicamente para se 
              manter informado sobre como protegemos suas informações.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contato</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre nossas práticas de 
              privacidade, entre em contato conosco:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Bora Indicar</strong></p>
              <p className="text-gray-700">E-mail: <a href="mailto:privacidade@boraindicar.com.br" className="text-blue-600 hover:underline">privacidade@boraindicar.com.br</a></p>
              <p className="text-gray-700">E-mail de suporte: <a href="mailto:suporte@boraindicar.com.br" className="text-blue-600 hover:underline">suporte@boraindicar.com.br</a></p>
              <p className="text-gray-700">Website: <a href="https://www.boraindicar.com.br" className="text-blue-600 hover:underline">www.boraindicar.com.br</a></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">13. Encarregado de Dados (DPO)</h2>
            <p className="text-gray-700 leading-relaxed">
              Nomeamos um Encarregado de Proteção de Dados (Data Protection Officer - DPO) para garantir 
              a conformidade com a LGPD. Para questões específicas sobre proteção de dados, entre em 
              contato com nosso DPO através do e-mail: <strong>dpo@boraindicar.com.br</strong>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              © 2025 Bora Indicar. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
