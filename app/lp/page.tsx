'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Gift, 
  Smartphone, 
  BarChart3,
  CheckCircle2,
  Star,
  ArrowRight,
  MessageCircle,
  Zap,
  Shield,
  Award
} from 'lucide-react';

export default function LandingPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você pode integrar com seu backend para salvar os leads
    console.log({ nome, email, telefone });
    setSubmitted(true);
    
    // Limpar formulário
    setTimeout(() => {
      setNome('');
      setEmail('');
      setTelefone('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Gift className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bora Indicar
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#beneficios" className="text-gray-700 hover:text-blue-600 transition">Benefícios</a>
              <a href="#como-funciona" className="text-gray-700 hover:text-blue-600 transition">Como Funciona</a>
              <a href="#depoimentos" className="text-gray-700 hover:text-blue-600 transition">Depoimentos</a>
              <a href="#contato" className="text-gray-700 hover:text-blue-600 transition">Contato</a>
            </div>
            <a 
              href="https://boraindicar.com.br/indicador/login" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-semibold">Transforme Indicações em Renda Extra</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Ganhe dinheiro 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> indicando </span>
                nossos produtos
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Sistema completo de indicações com gamificação, prêmios instantâneos e comissões automáticas. 
                Quanto mais você indica, mais você ganha!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#contato" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:shadow-xl transition font-semibold text-lg flex items-center justify-center group"
                >
                  Quero Ser Indicador
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
                </a>
                <a 
                  href="#como-funciona" 
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition font-semibold text-lg flex items-center justify-center"
                >
                  Como Funciona
                </a>
              </div>
              <div className="mt-8 flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">Sem mensalidade</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">Prêmios instantâneos</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ganhos Mensais</span>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900">R$ 5.847,00</div>
                  <div className="text-sm text-green-600 font-semibold">+32% este mês</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 w-3/4"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div>
                      <div className="text-sm text-gray-600">Indicações</div>
                      <div className="text-2xl font-bold text-gray-900">47</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Conversões</div>
                      <div className="text-2xl font-bold text-gray-900">28</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Taxa</div>
                      <div className="text-2xl font-bold text-green-600">59%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">2.500+</div>
              <div className="text-blue-100">Indicadores Ativos</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">R$ 2M+</div>
              <div className="text-blue-100">Pagos em Comissões</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">15K+</div>
              <div className="text-blue-100">Indicações Realizadas</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">4.8★</div>
              <div className="text-blue-100">Avaliação Média</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios Section */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que escolher o Bora Indicar?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistema completo de indicações com recursos exclusivos para maximizar seus ganhos
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Gift className="h-8 w-8" />,
                title: "Sistema de Lootbox",
                description: "Ganhe prêmios instantâneos a cada indicação! Cada lead cadastrado te dá direito a abrir uma caixa de prêmios com valores surpresa.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <DollarSign className="h-8 w-8" />,
                title: "Comissões Automáticas",
                description: "Receba suas comissões automaticamente quando suas indicações converterem em vendas. Sistema transparente e em tempo real.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Dashboard Completo",
                description: "Acompanhe todas suas indicações, conversões, ganhos e performance em um painel intuitivo e completo.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <MessageCircle className="h-8 w-8" />,
                title: "WhatsApp Integrado",
                description: "Gerencie toda comunicação com seus leads direto pela plataforma. WhatsApp oficial integrado ao sistema.",
                color: "from-emerald-500 to-teal-500"
              },
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "App Mobile Completo",
                description: "Acesse tudo pelo celular! Interface responsiva otimizada para mobile, funciona como um app nativo.",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Segurança Total",
                description: "Seus dados e ganhos protegidos com criptografia de ponta. Sistema auditado e seguro.",
                color: "from-indigo-500 to-purple-500"
              }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition group"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${benefit.color} text-white mb-4 group-hover:scale-110 transition`}>
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Como Funciona?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simples, rápido e lucrativo. Comece a ganhar em 4 passos
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Cadastre-se",
                description: "Crie sua conta gratuitamente em menos de 2 minutos. Sem taxas, sem mensalidade.",
                icon: <Users className="h-8 w-8" />
              },
              {
                step: "2",
                title: "Indique Amigos",
                description: "Cadastre leads no sistema ou compartilhe seu link exclusivo de indicação.",
                icon: <MessageCircle className="h-8 w-8" />
              },
              {
                step: "3",
                title: "Ganhe Prêmios",
                description: "A cada lead cadastrado, abra uma lootbox e ganhe prêmios instantâneos!",
                icon: <Gift className="h-8 w-8" />
              },
              {
                step: "4",
                title: "Receba Comissões",
                description: "Quando suas indicações virarem vendas, receba comissões automaticamente.",
                icon: <Award className="h-8 w-8" />
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-2xl font-bold mb-4 mx-auto">
                    {step.step}
                  </div>
                  <div className="text-center mb-4 text-blue-600">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{step.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              O que nossos indicadores dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Histórias reais de pessoas que transformaram indicações em renda extra
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Carlos Silva",
                role: "Indicador Premium",
                image: "👨‍💼",
                comment: "Em 3 meses já ganhei mais de R$ 12 mil em comissões! O sistema é muito fácil de usar e o suporte é excelente.",
                rating: 5,
                earnings: "R$ 12.450"
              },
              {
                name: "Maria Santos",
                role: "Indicadora Gold",
                image: "👩‍💼",
                comment: "Adoro o sistema de lootbox! É muito divertido e motivador. Já ganhei vários prêmios além das comissões normais.",
                rating: 5,
                earnings: "R$ 8.920"
              },
              {
                name: "João Oliveira",
                role: "Indicador Expert",
                image: "👨‍🎓",
                comment: "Melhor programa de indicações que já participei. Pagamentos pontuais e transparência total. Super recomendo!",
                rating: 5,
                earnings: "R$ 15.300"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{testimonial.image}</div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Ganhos</div>
                    <div className="font-bold text-green-600">{testimonial.earnings}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pronto para começar a ganhar?
            </h2>
            <p className="text-xl text-blue-100">
              Cadastre-se agora e comece a transformar suas indicações em renda extra
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Recebido!</h3>
                <p className="text-gray-600">Em breve nossa equipe entrará em contato com você.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-sm font-semibold text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:shadow-xl transition font-semibold text-lg flex items-center justify-center group"
                >
                  Quero Ser Indicador Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
                </button>
                <p className="text-sm text-gray-500 text-center">
                  Ao se cadastrar, você concorda com nossos{' '}
                  <a href="/termos-de-uso" className="text-blue-600 hover:underline">Termos de Uso</a>
                  {' '}e{' '}
                  <a href="/politica-privacidade" className="text-blue-600 hover:underline">Política de Privacidade</a>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Tudo o que você precisa saber sobre o Bora Indicar
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "Como funciona o pagamento das comissões?",
                answer: "As comissões são pagas automaticamente quando suas indicações convertem em vendas. Você pode solicitar o saque a qualquer momento através do painel do indicador."
              },
              {
                question: "Existe algum custo para ser indicador?",
                answer: "Não! O cadastro é 100% gratuito e não há nenhuma mensalidade ou taxa para participar do programa."
              },
              {
                question: "Como funcionam as Lootboxes?",
                answer: "A cada lead que você cadastra no sistema, você ganha o direito de abrir uma lootbox com prêmios instantâneos que variam de R$ 5 a R$ 500."
              },
              {
                question: "Quanto posso ganhar como indicador?",
                answer: "Não há limite de ganhos! Quanto mais você indica e suas indicações convertem, mais você ganha. Temos indicadores que faturam mais de R$ 15 mil por mês."
              },
              {
                question: "Preciso de conhecimento técnico?",
                answer: "Não! Nossa plataforma é super intuitiva e fácil de usar. Você vai aprender tudo rapidamente, além de ter suporte sempre disponível."
              }
            ].map((faq, index) => (
              <details key={index} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition group">
                <summary className="font-semibold text-lg text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <ArrowRight className="h-5 w-5 text-blue-600 group-open:rotate-90 transition" />
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Gift className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">Bora Indicar</span>
              </div>
              <p className="text-gray-400">
                Transforme suas indicações em renda extra com o melhor programa de afiliados do mercado.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#beneficios" className="hover:text-white transition">Benefícios</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition">Como Funciona</a></li>
                <li><a href="#depoimentos" className="hover:text-white transition">Depoimentos</a></li>
                <li><a href="#contato" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/termos-de-uso" className="hover:text-white transition">Termos de Uso</a></li>
                <li><a href="/politica-privacidade" className="hover:text-white transition">Política de Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contato</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📧 contato@boraindicar.com.br</li>
                <li>📱 (11) 99999-9999</li>
                <li>⏰ Seg-Sex: 9h às 18h</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Bora Indicar. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
