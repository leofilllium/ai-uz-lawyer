/**
 * About/Landing Page
 * JurisHub - AI Legal Assistant Platform
 */

import { useState } from 'react';
// import { Link } from 'react-router-dom';
import { 
  ShieldCheck, FileSearch, FileText, MessageSquare, 
  Upload, Brain, CheckCircle, Scale, 
  Users, Building2, ScrollText, Home, Briefcase, Database, RefreshCw, Check, 
  Lock, Globe, Mail, Phone, MapPin, Send,
  ChevronRight, ChevronDown, Play, Rocket, Calendar,
  Clock, TrendingUp, AlertTriangle,
  Target
} from 'lucide-react';
import './About.css';
import { sendContactMessage } from '../api/client';

export default function About() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setContactForm(prev => ({ ...prev, [id]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('loading');
    setErrorMessage('');
    
    try {
      await sendContactMessage(contactForm.name, contactForm.email, contactForm.message);
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error: any) {
      setContactStatus('error');
      setErrorMessage(error.message || 'Ошибка отправки сообщения');
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      title: 'Проверка документов',
      subtitle: 'Document Verification',
      description: 'Проверка соответствия законодательству Узбекистана и выявление рисков.',
      items: [
        'Соответствие требованиям законодательства',
        'Выявление отсутствующих и рискованных пунктов',
        'Рекомендации по исправлению'
      ],
      icon: <ShieldCheck className="w-6 h-6" />
    },
    {
      title: 'Анализ договоров',
      subtitle: 'Contract Analysis',
      description: 'Поиск противоречий, отсутствующих условий и спорных формулировок.',
      items: [
        'Поиск противоречий',
        'Выявление отсутствующих условий',
        'Анализ спорных формулировок'
      ],
      icon: <FileSearch className="w-6 h-6" />
    },
    {
      title: 'Генерация договоров',
      subtitle: 'Contract Generation',
      description: 'Создание договоров с учётом актуальных норм права.',
      items: [
        'Учет актуальных норм права',
        'Автоматическое заполнение',
        'Юридически грамотные формулировки'
      ],
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: 'AI-консультация',
      subtitle: 'AI Legal Consultation',
      description: 'Ответы на юридические вопросы с указанием норм законодательства.',
      items: [
        'Ответы на юридические вопросы',
        'Ссылки на нормы законодательства',
        'Мгновенная помощь 24/7'
      ],
      icon: <MessageSquare className="w-6 h-6" />
    }
  ];

  const faqs = [
    { q: 'Как работает платформа?', a: 'LawHub использует передовые модели искусственного интеллекта, специально обученные на законодательстве Узбекистана. Загрузите документ или задайте вопрос — и получите мгновенный анализ с ссылками на нормативные акты.' },
    { q: 'Насколько безопасны мои данные?', a: 'Мы используем 256-битное шифрование, храним данные на серверах в Узбекистане и проходим регулярные аудиты безопасности. Ваши документы полностью конфиденциальны.' },
    { q: 'Как рассчитываются кредиты?', a: 'Каждая операция имеет свою стоимость в кредитах: проверка документов — 10 кредитов, анализ договоров — 50, генерация — 100, AI-консультация — 20 кредитов за вопрос.' },
    { q: 'Какие законы охвачены?', a: 'Наша база включает все кодексы Узбекистана, законы, подзаконные акты и обновляется в реальном времени при публикации новых нормативных документов.' },
    { q: 'Есть ли интеграции?', a: 'Да, мы предоставляем API для интеграции с вашими системами. Также доступны интеграции с популярными CRM и платёжными системами PayMe, Click.' },
    { q: 'Как работает поддержка?', a: 'Базовая поддержка по email включена во все тарифы. Тариф Professional включает приоритетную поддержку, Enterprise — персонального менеджера.' },
    { q: 'Есть ли бесплатный пробный период?', a: 'Да! Мы предоставляем 14-дневный бесплатный период без привязки банковской карты. Вы получите полный доступ ко всем функциям.' },
    { q: 'Имеют ли договоры юридическую силу?', a: 'Сгенерированные договоры соответствуют законодательству Узбекистана и могут использоваться в юридической практике. Рекомендуем финальную проверку юристом.' }
  ];

  // const testimonials = [
  //   {
  //     quote: 'LawHub сократил время проверки договоров почти на 80%. Мы стали обслуживать больше клиентов без увеличения команды.',
  //     name: 'Рустам Каримов',
  //     role: 'Управляющий партнёр, Tashkent Legal Group',
  //     initials: 'РК'
  //   },
  //   {
  //     quote: 'Юристы сосредоточились на стратегии, а не на рутинных проверках.',
  //     name: 'Малика Усманова',
  //     role: 'Глава юридического отдела, UzAuto',
  //     initials: 'МУ'
  //   },
  //   {
  //     quote: 'Качество договоров и понимание узбекского права превзошли ожидания.',
  //     name: 'Давид Ким',
  //     role: 'Нотариус, Ташкент',
  //     initials: 'ДК'
  //   }
  // ];

  return (
    <div className="landing-page">
      {/* ═══════════════════════════════════════════════════
          NAVBAR
          ═══════════════════════════════════════════════════ */}
      <nav className="landing-nav">
        <div className="landing-container nav-container">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Scale className="w-6 h-6 text-primary" /> Law<span className="text-primary">Hub</span>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection('product')}>Продукт</button>
            <button onClick={() => scrollToSection('features')}>Возможности</button>
            <button onClick={() => scrollToSection('pricing')}>Тарифы</button>
            <button onClick={() => scrollToSection('contact')}>Контакты</button>
          </div>
          {/* <div className="nav-actions">
            <Link to="/login" className="nav-login">Войти</Link>
            <Link to="/register" className="nav-btn">Начать</Link>
          </div> */}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════ */}
      <section className="hero-section" id="product">
        <div className="hero-floating-icons">
          <ScrollText className="floating-icon" />
          <Scale className="floating-icon" />
          <FileText className="floating-icon" />
          <Lock className="floating-icon" />
          <Brain className="floating-icon" />
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-icon"><Globe className="w-4 h-4" /></span>
              Анализ законодательства Узбекистана, проверка и создание договоров на основе актуальных норм права.
            </div>
            
            <h1 className="hero-title">
              Полная база законодательства Узбекистана.{' '}
              <span className="hero-title-highlight">Инструменты для работы юристов.</span>
            </h1>
            
            <p className="hero-subtitle">
              Автоматизируйте проверку документов, анализ договоров и юридические консультации. Сократите рутинную работу в 10 раз без потери качества.
            </p>
            
            <div className="hero-cta-group">
              <button className="btn-landing-secondary" onClick={() => scrollToSection('contact')}>
                <Play className="w-4 h-4" /> Смотреть демо
              </button>
            </div>
            
            <div className="hero-trust-badge">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Настройка за 5 минут · Банковская карта не требуется
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-mockup">
              <div className="mockup-header">
                <div className="mockup-dot red"></div>
                <div className="mockup-dot yellow"></div>
                <div className="mockup-dot green"></div>
              </div>
              
              <div className="mockup-content">
                <div className="mockup-document">
                  <div className="mockup-line title"></div>
                  <div className="mockup-line text"></div>
                  <div className="mockup-line text"></div>
                  <div className="mockup-line text"></div>
                </div>
                
                <div className="mockup-highlight">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Обнаружено несоответствие статье 354 ГК РУз
                </div>
                
                <div className="mockup-ai-indicator">
                  <Brain className="w-5 h-5 animate-pulse" />
                  Идёт анализ документа…
                </div>
                
                <div className="mockup-risk-score">
                  <div className="risk-circle">
                    <span className="risk-value">75%</span>
                  </div>
                  <div className="risk-label">
                    <div className="risk-label-title">Оценка соответствия</div>
                    <div className="risk-label-subtitle">Найдено 3 рекомендации по улучшению</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: TRUST INDICATORS
          ═══════════════════════════════════════════════════ */}
      <section className="trust-section" id="company">
        <div className="trust-container">
          <div className="trust-stat">
            <div className="trust-stat-value">500+</div>
            <div className="trust-stat-label">документов проанализировано</div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <div className="trust-stat-value">Будьте первыми</div>
            <div className="trust-stat-label">юридических фирм используют платформу</div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <div className="trust-stat-value">99,8%</div>
            <div className="trust-stat-label">точность анализа</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: PROBLEM
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section problem-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Проблемы юридических фирм сегодня</h2>
          <p className="landing-section-subtitle">
            Юридическая работа становится сложнее, а требования к качеству — выше.
          </p>
          
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon"><Clock className="w-10 h-10" /></div>
              <h3 className="problem-title">Потеря времени</h3>
              <p className="problem-description">
                Проверка одного договора вручную занимает 3–5 часов.
              </p>
            </div>
            
            <div className="problem-card">
              <div className="problem-icon"><AlertTriangle className="w-10 h-10" /></div>
              <h3 className="problem-title">Риск ошибок</h3>
              <p className="problem-description">
                Даже опытные юристы допускают неточности, которые приводят к спорам и убыткам.
              </p>
            </div>
            
            <div className="problem-card">
              <div className="problem-icon"><TrendingUp className="w-10 h-10" /></div>
              <h3 className="problem-title">Ограниченное масштабирование</h3>
              <p className="problem-description">
                Рост количества клиентов требует найма новых специалистов.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: FEATURES
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section features-section" id="features">
        <div className="landing-container">
          <h2 className="landing-section-title">Решение</h2>
          <p className="landing-section-subtitle">
            LegalAI.uz — рабочий инструмент для юридической практики. Платформа объединяет анализ законодательства, работу с договорами и консультации в одном интерфейсе.
          </p>
          
          <div className="features-tabs">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`feature-tab ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                <span className="mr-2">{feature.icon}</span> {feature.title}
              </button>
            ))}
          </div>
          
          <div className="feature-content">
            {features.map((feature, index) => (
              <div key={index} className={`feature-panel ${activeTab === index ? 'active' : ''}`}>
                <div className="feature-info">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <ul className="feature-list">
                    {feature.items.map((item, i) => (
                      <li key={i}>
                        <Check className="feature-check-icon w-5 h-5 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="feature-demo">
                  <div className="feature-demo-header">
                    <div className="feature-demo-icon">{feature.icon}</div>
                    <div className="feature-demo-title">{feature.subtitle}</div>
                  </div>
                  <div className="mockup-document">
                    <div className="mockup-line title"></div>
                    <div className="mockup-line text"></div>
                    <div className="mockup-line text"></div>
                  </div>
                  <div className="mockup-highlight">
                    <Brain className="w-4 h-4 mr-2" />
                    AI обрабатывает ваш запрос...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5: HOW IT WORKS
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section how-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Как это работает</h2>
          <p className="landing-section-subtitle">
            Три шага к результату
          </p>
          
          <div className="how-timeline">
            <div className="how-step">
              <div className="how-step-number">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h3 className="how-step-title">Загрузка</h3>
              <p className="how-step-description">
                Загрузите документ или сформулируйте запрос.
              </p>
            </div>
            
            <div className="how-step">
              <div className="how-step-number">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="how-step-title">Анализ</h3>
              <p className="how-step-description">
                Система применяет нормы законодательства Узбекистана.
              </p>
            </div>
            
            <div className="how-step">
              <div className="how-step-number">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="how-step-title">Результат</h3>
              <p className="how-step-description">
                Вы получаете готовые выводы, рекомендации или документ.
              </p>
            </div>
          </div>
          
          <div className="how-security">
            <div className="security-item">
              <Lock className="w-4 h-4 text-green-500" />
              256-битное шифрование
            </div>
            <div className="security-item">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Конфиденциальность данных
            </div>
            <div className="security-item">
              <Globe className="w-4 h-4 text-primary" />
              Серверы на территории Узбекистана
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6: PRICING
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section pricing-section" id="pricing">
        <div className="landing-container">
          <h2 className="landing-section-title">Тарифные планы</h2>
          <p className="landing-section-subtitle">
            Кредитная система — оплата только за фактическое использование
          </p>
          
          <div className="pricing-grid">
            {/* Starter */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">STARTER</h3>
                <div className="pricing-credits">20 000 кредитов / месяц</div>
                <div className="pricing-price">$299</div>
              </div>
              <ul className="pricing-features">
                <li><Check className="pricing-check" /> Проверка документов</li>
                <li><Check className="pricing-check" /> Анализ договоров</li>
                <li><Check className="pricing-check" /> Генерация договоров</li>
                <li><Check className="pricing-check" /> AI-консультации</li>
                <li><Check className="pricing-check" /> Email-поддержка</li>
                <li><Check className="pricing-check" /> До 5 пользователей</li>
              </ul>
              <button className="pricing-cta">Начать</button>
            </div>
            
            {/* Professional */}
            <div className="pricing-card featured">
              <div className="pricing-popular">Популярный</div>
              <div className="pricing-header">
                <h3 className="pricing-name">PROFESSIONAL</h3>
                <div className="pricing-credits">50 000 кредитов / месяц</div>
                <div className="pricing-price">$699</div>
              </div>
              <ul className="pricing-features">
                <li><Check className="pricing-check" /> Всё из Starter</li>
                <li><Check className="pricing-check" /> Приоритетная поддержка</li>
                <li><Check className="pricing-check" /> До 15 пользователей</li>
                <li><Check className="pricing-check" /> Кастомные шаблоны</li>
                <li><Check className="pricing-check" /> Доступ к API</li>
                <li><Check className="pricing-check" /> Аналитическая панель</li>
              </ul>
              <button className="pricing-cta">Выбрать</button>
            </div>
            
            {/* Enterprise */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">ENTERPRISE</h3>
                <div className="pricing-credits">150 000+ кредитов</div>
                <div className="pricing-price">INDIVISUAL</div>
              </div>
              <ul className="pricing-features">
                <li><Check className="pricing-check" /> Неограниченные пользователи</li>
                <li><Check className="pricing-check" /> Персональный менеджер</li>
                <li><Check className="pricing-check" /> Индивидуальные интеграции</li>
                <li><Check className="pricing-check" /> Обучение команды</li>
                <li><Check className="pricing-check" /> SLA-гарантия</li>
              </ul>
              <button className="pricing-cta">Связаться</button>
            </div>
          </div>
          
          <p className="pricing-note">
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Кредиты не сгорают и переносятся на следующий месяц.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: INDUSTRIES
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section industries-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Отрасли и кейсы</h2>
          <p className="landing-section-subtitle">
            Платформа адаптирована под разные направления юридической практики
          </p>
          
          <div className="industries-grid">
            <div className="industry-card">
              <div className="industry-icon"><Scale className="w-10 h-10" /></div>
              <h4 className="industry-name">Юридические фирмы</h4>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon"><Building2 className="w-10 h-10" /></div>
              <h4 className="industry-name">Корпоративные юр. отделы</h4>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon"><ScrollText className="w-10 h-10" /></div>
              <h4 className="industry-name">Нотариальные услуги</h4>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon"><Home className="w-10 h-10" /></div>
              <h4 className="industry-name">Недвижимость</h4>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon"><Briefcase className="w-10 h-10" /></div>
              <h4 className="industry-name">Бизнес-консалтинг</h4>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 8: TECHNOLOGY
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section tech-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Технологии</h2>
          <p className="landing-section-subtitle">
            Специализированный ИИ
          </p>
          
          <div className="tech-grid">
            <div className="tech-panel">
              <h3><Brain className="w-6 h-6 text-primary" /> Возможности</h3>
              <ul className="tech-list">
                <li>
                  <div className="tech-icon"><Target className="w-5 h-5" /></div>
                  <div className="tech-info">
                    <strong>Обучен на законодательстве Узбекистана</strong>
                    <span>Максимальная релевантность ответов</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon"><Database className="w-5 h-5" /></div>
                  <div className="tech-info">
                    <strong>Полная база законов</strong>
                    <span>Кодексы, законы и нормативные акты</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="tech-panel security-panel">
              <h3><ShieldCheck className="w-6 h-6 text-green-500" /> Точность</h3>
              <ul className="tech-list">
                <li>
                  <div className="tech-icon"><RefreshCw className="w-5 h-5" /></div>
                  <div className="tech-info">
                    <strong>Актуальность данных</strong>
                    <span>Обновления по мере изменений законодательства</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon"><CheckCircle className="w-5 h-5" /></div>
                  <div className="tech-info">
                    <strong>Подтверждённая точность</strong>
                    <span>99,8% по результатам практического использования</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 9: TESTIMONIALS
          ═══════════════════════════════════════════════════ */}
      {/* <section className="landing-section testimonials-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Отзывы клиентов</h2>
          
          <div className="testimonials-carousel">
            <div className="testimonials-track">
              {testimonials.map((t, index) => (
                <div key={index} className="testimonial-card">
                  <p className="testimonial-quote">“{t.quote}”</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.initials}</div>
                    <div className="testimonial-info">
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* ═══════════════════════════════════════════════════
          SECTION 10: FAQ
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section faq-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Часто задаваемые вопросы</h2>
          
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaq === index ? 'open' : ''}`}
              >
                <button 
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  {faq.q}
                  <span className="faq-icon">
                    {openFaq === index ? <ChevronDown /> : <ChevronRight />}
                  </span>
                </button>
                <div className="faq-answer">
                  <div className="faq-answer-content">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 11: CTA
          ═══════════════════════════════════════════════════ */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-content">
            <h2 className="cta-title">Готовы автоматизировать юридическую работу?</h2>
            <p className="cta-subtitle">
              Запросите демонстрацию платформы и узнайте, как LawHub может помочь вашему бизнесу.
            </p>
            
            <div className="cta-buttons">
              <button className="btn-cta-primary" onClick={() => scrollToSection('contact')}>
                <Rocket className="w-5 h-5" /> Запросить демо
              </button>
              <button className="btn-cta-secondary" onClick={() => scrollToSection('contact')}>
                <Calendar className="w-5 h-5" /> Связаться с нами
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION: CONTACT FORM
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section contact-section" id="contact">
        <div className="landing-container">
          <h2 className="landing-section-title">Обратная связь</h2>
          <p className="landing-section-subtitle">
            Остались вопросы? Свяжитесь с нами
          </p>
          
          <div className="contact-grid">
            <div className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Имя</label>
                  <input 
                    type="text" 
                    id="name" 
                    placeholder="Ваше имя" 
                    required 
                    value={contactForm.name}
                    onChange={handleContactChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="email@example.com" 
                    required 
                    value={contactForm.email}
                    onChange={handleContactChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Сообщение</label>
                  <textarea 
                    id="message" 
                    rows={4} 
                    placeholder="Ваш вопрос или сообщение..." 
                    required
                    value={contactForm.message}
                    onChange={handleContactChange}
                  ></textarea>
                </div>
                
                {contactStatus === 'success' && (
                  <div className="p-3 mb-4 text-green-700 bg-green-100 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Сообщение отправлено! Мы свяжемся с вами.
                  </div>
                )}
                
                {contactStatus === 'error' && (
                  <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {errorMessage}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="contact-submit"
                  disabled={contactStatus === 'loading' || contactStatus === 'success'}
                >
                  {contactStatus === 'loading' ? (
                    <span className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Отправка...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="w-4 h-4 mr-2" /> Отправить
                    </span>
                  )}
                </button>
              </form>
            </div>
            
            <div className="contact-info-wrapper">
              <h3>Контакты</h3>
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <strong>Email</strong>
                    <span>info@lawhub.uz</span>
                  </div>
                </div>
                <div className="contact-info-item">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <strong>Телефон</strong>
                    <span>+998 71 123 45 67</span>
                  </div>
                </div>
                <div className="contact-info-item">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <strong>Адрес</strong>
                    <span>Ташкент, Узбекистан</span>
                  </div>
                </div>
              </div>
              
              <div className="contact-hours">
                <h4>Режим работы</h4>
                <p>Пн-Пт: 9:00 - 18:00</p>
                <p>Сб-Вс: Выходные</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 12: FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="footer-section">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="landing-logo">
                <Scale className="w-8 h-8 text-white" /> Law<span className="text-primary">Hub</span>
              </div>
              <p>
                Бизнес-инструмент для юристов.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Telegram"><Users className="w-5 h-5" /></a>
                <a href="#" aria-label="LinkedIn"><Briefcase className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>Продукт</h4>
              <ul>
                <li><button onClick={() => scrollToSection('features')}>Возможности</button></li>
                <li><button onClick={() => scrollToSection('pricing')}>Тарифы</button></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2026 LawHub.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
