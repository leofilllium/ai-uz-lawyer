/**
 * About/Landing Page
 * LegalAI.uz - AI Legal Assistant Platform
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      title: 'Проверка документов',
      subtitle: 'Document Validation',
      description: 'Мгновенно проверяйте соответствие законодательству Узбекистана',
      items: [
        'Соответствие законодательным требованиям',
        'Выявление отсутствующих пунктов',
        'Автоматическое исправление ошибок'
      ],
      icon: '📋'
    },
    {
      title: 'Анализ договоров',
      subtitle: 'Contract Analysis',
      description: 'Выявляйте риски в договоре за считанные секунды',
      items: [
        'Оценка рисков (risk scoring)',
        'Выделение неоднозначных пунктов',
        'Сравнительный анализ'
      ],
      icon: '🔍'
    },
    {
      title: 'Генерация договоров',
      subtitle: 'Contract Generation',
      description: 'Создавайте профессиональные договоры за минуты',
      items: [
        '50+ шаблонов, соответствующих законодательству Узбекистана',
        'Умные рекомендации пунктов',
        'Многосторонние договоры'
      ],
      icon: '📝'
    },
    {
      title: 'AI Юридическая консультация',
      subtitle: 'AI Legal Consultation',
      description: 'Мгновенные ответы по законам Узбекистана',
      items: [
        'Ссылки на нормы законодательства',
        'Судебные прецеденты',
        'Пошаговые инструкции'
      ],
      icon: '💬'
    }
  ];

  const faqs = [
    { q: 'Как работает платформа?', a: 'LegalAI.uz использует передовые модели искусственного интеллекта, специально обученные на законодательстве Узбекистана. Загрузите документ или задайте вопрос — и получите мгновенный анализ с ссылками на нормативные акты.' },
    { q: 'Насколько безопасны мои данные?', a: 'Мы используем 256-битное шифрование, храним данные на серверах в Узбекистане и проходим регулярные аудиты безопасности. Ваши документы полностью конфиденциальны.' },
    { q: 'Как рассчитываются кредиты?', a: 'Каждая операция имеет свою стоимость в кредитах: проверка документов — 10 кредитов, анализ договоров — 50, генерация — 100, AI-консультация — 20 кредитов за вопрос.' },
    { q: 'Какие законы охвачены?', a: 'Наша база включает все кодексы Узбекистана, законы, подзаконные акты и обновляется в реальном времени при публикации новых нормативных документов.' },
    { q: 'Есть ли интеграции?', a: 'Да, мы предоставляем API для интеграции с вашими системами. Также доступны интеграции с популярными CRM и платёжными системами PayMe, Click.' },
    { q: 'Как работает поддержка?', a: 'Базовая поддержка по email включена во все тарифы. Тариф Professional включает приоритетную поддержку, Enterprise — персонального менеджера.' },
    { q: 'Есть ли бесплатный пробный период?', a: 'Да! Мы предоставляем 14-дневный бесплатный период без привязки банковской карты. Вы получите полный доступ ко всем функциям.' },
    { q: 'Имеют ли договоры юридическую силу?', a: 'Сгенерированные договоры соответствуют законодательству Узбекистана и могут использоваться в юридической практике. Рекомендуем финальную проверку юристом.' }
  ];

  const testimonials = [
    {
      quote: 'LegalAI.uz сократил время проверки наших договоров на 80%. Теперь мы можем обслуживать больше клиентов.',
      name: 'Рустам Каримов',
      role: 'Управляющий партнёр, Tashkent Legal Group',
      initials: 'РК'
    },
    {
      quote: 'Теперь наши юристы тратят время на стратегические задачи, а не на рутинную проверку документов.',
      name: 'Малика Усманова',
      role: 'Глава юридического отдела, UzAuto',
      initials: 'МУ'
    },
    {
      quote: 'Качество генерируемых договоров превзошло наши ожидания. AI понимает нюансы узбекского права.',
      name: 'Давид Ким',
      role: 'Нотариус, Ташкент',
      initials: 'ДК'
    }
  ];

  return (
    <div className="landing-page">
      {/* ═══════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-floating-icons">
          <span className="floating-icon">📜</span>
          <span className="floating-icon">⚖️</span>
          <span className="floating-icon">📋</span>
          <span className="floating-icon">🔒</span>
          <span className="floating-icon">✍️</span>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-icon">🇺🇿</span>
              100% база данных законодательства Узбекистана
            </div>
            
            <h1 className="hero-title">
              Автоматизируйте юридические процессы.{' '}
              <span className="hero-title-highlight">Экономьте время в 10 раз.</span>
            </h1>
            
            <p className="hero-subtitle">
              Анализируйте законодательство Узбекистана, проверяйте и создавайте договоры с помощью искусственного интеллекта.
            </p>
            
            <div className="hero-cta-group">
              <Link to="/register" className="btn-landing-primary">
                🚀 Попробовать бесплатно
              </Link>
              <button className="btn-landing-secondary">
                ▶️ Смотреть демо
              </button>
            </div>
            
            <div className="hero-trust-badge">
              <span>✓</span>
              Настройка за 5 минут • Без банковской карты
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
                  ⚠️ Обнаружено несоответствие статье 354 ГК РУз
                </div>
                
                <div className="mockup-ai-indicator">
                  🤖 AI анализирует документ...
                </div>
                
                <div className="mockup-risk-score">
                  <div className="risk-circle">
                    <span className="risk-value">75%</span>
                  </div>
                  <div className="risk-label">
                    <div className="risk-label-title">Оценка соответствия</div>
                    <div className="risk-label-subtitle">3 рекомендации по улучшению</div>
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
      <section className="trust-section">
        <div className="trust-container">
          <div className="trust-stat">
            <div className="trust-stat-value">500+</div>
            <div className="trust-stat-label">Проанализировано документов</div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <div className="trust-stat-value">50+</div>
            <div className="trust-stat-label">Юридических фирм</div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <div className="trust-stat-value">99.8%</div>
            <div className="trust-stat-label">Точность анализа</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: PROBLEM
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section problem-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Проблемы, с которыми сталкиваются юридические фирмы</h2>
          <p className="landing-section-subtitle">
            Традиционные методы юридической работы неэффективны в современном мире
          </p>
          
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">⏰</div>
              <h3 className="problem-title">Потеря времени</h3>
              <p className="problem-description">
                Ручная проверка договоров занимает 3–5 часов на каждый документ
              </p>
            </div>
            
            <div className="problem-card">
              <div className="problem-icon">⚠️</div>
              <h3 className="problem-title">Риск ошибок</h3>
              <p className="problem-description">
                Человеческие ошибки приводят к дорогостоящим судебным разбирательствам
              </p>
            </div>
            
            <div className="problem-card">
              <div className="problem-icon">📈</div>
              <h3 className="problem-title">Сложность масштабирования</h3>
              <p className="problem-description">
                Для увеличения числа клиентов требуется нанимать больше юристов
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: FEATURES
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section features-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Полноценное AI-решение для юристов</h2>
          <p className="landing-section-subtitle">
            Четыре мощных инструмента для автоматизации юридической работы
          </p>
          
          <div className="features-tabs">
            {features.map((feature, index) => (
              <button
                key={index}
                className={`feature-tab ${activeTab === index ? 'active' : ''}`}
                onClick={() => setActiveTab(index)}
              >
                {feature.icon} {feature.title}
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
                        <span className="feature-check">✓</span>
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
                    ✨ AI обрабатывает ваш запрос...
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
            Три простых шага к автоматизации юридических процессов
          </p>
          
          <div className="how-timeline">
            <div className="how-step">
              <div className="how-step-number">📤</div>
              <h3 className="how-step-title">1. Загрузка</h3>
              <p className="how-step-description">
                Загрузите документ или начните диалог с ИИ
              </p>
            </div>
            
            <div className="how-step">
              <div className="how-step-number">🧠</div>
              <h3 className="how-step-title">2. Анализ</h3>
              <p className="how-step-description">
                ИИ применяет законодательство Узбекистана
              </p>
            </div>
            
            <div className="how-step">
              <div className="how-step-number">📄</div>
              <h3 className="how-step-title">3. Результат</h3>
              <p className="how-step-description">
                Получите готовый результат или договор
              </p>
            </div>
          </div>
          
          <div className="how-security">
            <div className="security-item">
              <span>🔒</span>
              256-битное шифрование
            </div>
            <div className="security-item">
              <span>🛡️</span>
              Конфиденциальность данных
            </div>
            <div className="security-item">
              <span>🇺🇿</span>
              Серверы в Узбекистане
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6: PRICING
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section pricing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Тарифные планы</h2>
          <p className="landing-section-subtitle">
            Кредитная система: платите только за фактически использованные услуги
          </p>
          
          <div className="pricing-grid">
            {/* Starter */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">STARTER</h3>
                <div className="pricing-credits">20 000 кредитов / месяц</div>
                <div className="pricing-price">$299<span>/месяц</span></div>
              </div>
              <ul className="pricing-features">
                <li><span className="pricing-check">✓</span> Проверка документов (10 кредитов)</li>
                <li><span className="pricing-check">✓</span> Анализ договоров (50 кредитов)</li>
                <li><span className="pricing-check">✓</span> Генерация договоров (100 кредитов)</li>
                <li><span className="pricing-check">✓</span> AI-консультация (20 кред./вопрос)</li>
                <li><span className="pricing-check">✓</span> Поддержка по email</li>
                <li><span className="pricing-check">✓</span> До 5 пользователей</li>
              </ul>
              <button className="pricing-cta">Начать</button>
            </div>
            
            {/* Professional */}
            <div className="pricing-card featured">
              <div className="pricing-popular">Самый популярный</div>
              <div className="pricing-header">
                <h3 className="pricing-name">PROFESSIONAL</h3>
                <div className="pricing-credits">50 000 кредитов / месяц</div>
                <div className="pricing-price">$699<span>/месяц</span></div>
              </div>
              <ul className="pricing-features">
                <li><span className="pricing-check">✓</span> Всё из Starter</li>
                <li><span className="pricing-check">✓</span> Приоритетная поддержка</li>
                <li><span className="pricing-check">✓</span> До 15 пользователей</li>
                <li><span className="pricing-check">✓</span> Кастомные шаблоны</li>
                <li><span className="pricing-check">✓</span> Доступ к API</li>
                <li><span className="pricing-check">✓</span> Аналитическая панель</li>
              </ul>
              <button className="pricing-cta">Выбрать</button>
            </div>
            
            {/* Enterprise */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">ENTERPRISE</h3>
                <div className="pricing-credits">150 000+ кредитов</div>
                <div className="pricing-price">Индивидуально</div>
              </div>
              <ul className="pricing-features">
                <li><span className="pricing-check">✓</span> Всё из Professional</li>
                <li><span className="pricing-check">✓</span> Неограниченные пользователи</li>
                <li><span className="pricing-check">✓</span> Персональный менеджер</li>
                <li><span className="pricing-check">✓</span> Индивидуальные интеграции</li>
                <li><span className="pricing-check">✓</span> Обучающие сессии</li>
                <li><span className="pricing-check">✓</span> SLA-гарантия</li>
              </ul>
              <button className="pricing-cta">Связаться</button>
            </div>
          </div>
          
          <p className="pricing-note">
            Кредиты не сгорают — переносятся на следующий месяц
          </p>
          
          <div className="pricing-calculator">
            <h4>📊 Калькулятор кредитов</h4>
            <p>Скоро: рассчитайте вашу месячную потребность</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: INDUSTRIES
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section industries-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Кейсы и отрасли</h2>
          <p className="landing-section-subtitle">
            LegalAI.uz адаптирован для различных сфер юридической практики
          </p>
          
          <div className="industries-grid">
            <div className="industry-card">
              <div className="industry-icon">⚖️</div>
              <h4 className="industry-name">Юридические фирмы</h4>
              <p className="industry-desc">Автоматизация рутинных процессов</p>
              <span className="industry-link">Подробнее →</span>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon">🏢</div>
              <h4 className="industry-name">Корпоративные отделы</h4>
              <p className="industry-desc">Юридическая поддержка бизнеса</p>
              <span className="industry-link">Подробнее →</span>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon">📜</div>
              <h4 className="industry-name">Нотариальные услуги</h4>
              <p className="industry-desc">Проверка и подготовка документов</p>
              <span className="industry-link">Подробнее →</span>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon">🏠</div>
              <h4 className="industry-name">Недвижимость</h4>
              <p className="industry-desc">Договоры купли-продажи и аренды</p>
              <span className="industry-link">Подробнее →</span>
            </div>
            
            <div className="industry-card">
              <div className="industry-icon">💼</div>
              <h4 className="industry-name">Бизнес-консалтинг</h4>
              <p className="industry-desc">Юридическое сопровождение сделок</p>
              <span className="industry-link">Подробнее →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 8: TECHNOLOGY
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section tech-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Технологии и безопасность</h2>
          <p className="landing-section-subtitle">
            Передовые технологии и высочайший уровень защиты данных
          </p>
          
          <div className="tech-grid">
            <div className="tech-panel">
              <h3>🧠 Технологии</h3>
              <ul className="tech-list">
                <li>
                  <div className="tech-icon">🎯</div>
                  <div className="tech-info">
                    <strong>Специализированный ИИ</strong>
                    <span>Обучен на законодательстве Узбекистана</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon">📚</div>
                  <div className="tech-info">
                    <strong>Полная база законов</strong>
                    <span>Все кодексы, законы и нормативные акты</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon">🔄</div>
                  <div className="tech-info">
                    <strong>Обновления в реальном времени</strong>
                    <span>Актуальные данные по законодательству</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon">✅</div>
                  <div className="tech-info">
                    <strong>99.8% точность</strong>
                    <span>Подтверждено практикующими юристами</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="tech-panel security-panel">
              <h3>🔒 Безопасность</h3>
              <ul className="tech-list">
                <li>
                  <div className="tech-icon">🔐</div>
                  <div className="tech-info">
                    <strong>256-битное шифрование</strong>
                    <span>Банковский уровень защиты данных</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon">🌍</div>
                  <div className="tech-info">
                    <strong>Соответствие GDPR</strong>
                    <span>Международные стандарты приватности</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon">🇺🇿</div>
                  <div className="tech-info">
                    <strong>Серверы в Узбекистане</strong>
                    <span>Локальное хранение данных</span>
                  </div>
                </li>
                <li>
                  <div className="tech-icon">🛡️</div>
                  <div className="tech-info">
                    <strong>Регулярные аудиты</strong>
                    <span>Независимые проверки безопасности</span>
                  </div>
                </li>
              </ul>
              <div className="tech-badges">
                <span className="tech-badge">ISO 27001</span>
                <span className="tech-badge">SOC 2</span>
                <span className="tech-badge">GDPR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 9: TESTIMONIALS
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section testimonials-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Отзывы клиентов</h2>
          <p className="landing-section-subtitle">
            Что говорят о нас ведущие юридические фирмы Узбекистана
          </p>
          
          <div className="testimonials-carousel">
            <div className="testimonials-track">
              {testimonials.map((t, index) => (
                <div key={index} className="testimonial-card">
                  <p className="testimonial-quote">"{t.quote}"</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.initials}</div>
                    <div className="testimonial-info">
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                      <div className="testimonial-stars">★★★★★</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="carousel-nav">
            <button className="carousel-btn">←</button>
            <button className="carousel-btn">→</button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 10: FAQ
          ═══════════════════════════════════════════════════ */}
      <section className="landing-section faq-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Часто задаваемые вопросы</h2>
          <p className="landing-section-subtitle">
            Ответы на популярные вопросы о платформе
          </p>
          
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
                  <span className="faq-icon">+</span>
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
            <h2 className="cta-title">Начните сегодня — увидьте результат уже завтра</h2>
            <p className="cta-subtitle">
              14 дней бесплатно. Без банковской карты. Полный доступ ко всем функциям.
            </p>
            
            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary">
                🚀 Начать бесплатный период
              </Link>
              <button className="btn-cta-secondary">
                📅 Запросить демо
              </button>
            </div>
            
            <p className="cta-note">
              Настройка за 5 минут. Доступ к 500+ законов Узбекистана.
            </p>
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
                ⚖️ Legal<span>AI</span>.uz
              </div>
              <p>
                Сила искусственного интеллекта в законодательстве Узбекистана. 
                Юридическая аналитика на базе ИИ для современных юридических фирм.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Telegram">📱</a>
                <a href="#" aria-label="LinkedIn">💼</a>
                <a href="#" aria-label="YouTube">▶️</a>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>Продукт</h4>
              <ul>
                <li><a href="#">Возможности</a></li>
                <li><a href="#">Цены</a></li>
                <li><a href="#">Демо</a></li>
                <li><a href="#">API-документация</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Компания</h4>
              <ul>
                <li><a href="#">О нас</a></li>
                <li><a href="#">Блог</a></li>
                <li><a href="#">Карьера</a></li>
                <li><a href="#">Контакты</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Контакты</h4>
              <div className="footer-contact-item">
                <span>📧</span>
                <span>info@legalai.uz</span>
              </div>
              <div className="footer-contact-item">
                <span>📞</span>
                <span>+998 71 123 45 67</span>
              </div>
              <div className="footer-contact-item">
                <span>📍</span>
                <span>Ташкент, Узбекистан</span>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-copyright">
              © 2026 LegalAI.uz. Все права защищены.
            </div>
            
            <div className="footer-links">
              <a href="#">Политика конфиденциальности</a>
              <a href="#">Условия использования</a>
              <a href="#">Cookies</a>
            </div>
            
            <div className="footer-lang">
              <button>O'zbek</button>
              <button className="active">Русский</button>
              <button>English</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
