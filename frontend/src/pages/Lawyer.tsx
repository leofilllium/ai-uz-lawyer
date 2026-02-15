/**
 * Lawyer Chat Page
 * Full RAG-powered legal chat with streaming responses.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { sendChatMessage, getChatSessions, getChatSession, deleteHistoryItem, getTasks, type ChatSession, type Source, type Task } from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export default function Lawyer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [chatMode, setChatMode] = useState<'auto-detect' | 'risk-manager' | 'smalltalk' | 'consultant' | 'practitioner' | 'litigator' | 'legal-audit' | 'compliance' | 'tax' | 'corporate' | 'commercial' | 'negotiator' | 'startup' | 'procedural' | 'deadlines' | 'hr' | 'worker-protection' | 'analyst' | 'skeptic' | 'judge-questions' | 'odds' | 'strategist' | 'what-if' | 'interview-practice' | 'family' | 'real-estate' | 'notary' | 'ip' | 'criminal-defense' | 'criminal-prosecution' | 'admin-defense' | 'admin-procedure' | 'customs' | 'procurement' | 'enforcement' | 'arbitration' | 'constitutional' | 'consumer-protection' | 'housing' | 'land-disputes' | 'digital-law' | 'environmental' | 'antitrust' | 'insurance' | 'banking' | 'securities' | 'investor-protection' | 'mediation' | 'doc-review' | 'legal-letter' | 'compliance-hr' | 'debt-collection' | 'bankruptcy' | 'merger-acquisition' | 'licensing' | 'regulatory' | 'cross-border' | 'forensic-legal' | 'quick-answer'>('auto-detect');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Task context state
  const [showTaskContext, setShowTaskContext] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskContextFile, setTaskContextFile] = useState<File | null>(null);
  const [taskContextFileText, setTaskContextFileText] = useState('');
  const [fileError, setFileError] = useState('');
  
  // Load available tasks when context panel is opened
  useEffect(() => {
    if (showTaskContext && availableTasks.length === 0) {
      getTasks().then(setAvailableTasks).catch(() => setAvailableTasks([]));
    }
  }, [showTaskContext]);

  // Load session from URL parameter on mount
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    if (sessionParam) {
      const sessionIdFromUrl = parseInt(sessionParam, 10);
      if (!isNaN(sessionIdFromUrl)) {
        // Load the session
        getChatSession(sessionIdFromUrl)
          .then((data) => {
            setSessionId(sessionIdFromUrl);
            setMessages(data.messages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              sources: m.sources || undefined,
            })));
          })
          .catch((err) => {
            console.error('Failed to load session from URL:', err);
          });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async (reset = true) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const data = await getChatSessions(currentOffset, LIMIT);
      
      if (reset) {
        setSessions(data);
        setOffset(LIMIT);
      } else {
        setSessions(prev => [...prev, ...data]);
        setOffset(prev => prev + LIMIT);
      }
      
      setHasMore(data.length === LIMIT);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleLoadMore = () => {
    loadSessions(false);
  };

  const handleSessionClick = async (session: ChatSession) => {
    setSessionId(session.id);
    try {
      const data = await getChatSession(session.id);
      setMessages(data.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        sources: m.sources || undefined,
      })));
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    if (!confirm('Удалить этот чат?')) return;
    
    try {
      await deleteHistoryItem('chat', session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      if (sessionId === session.id) {
        setMessages([]);
        setSessionId(undefined);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Handle file selection and text extraction
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    setTaskContextFileText('');
    
    if (!file) {
      setTaskContextFile(null);
      return;
    }
    
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['txt', 'docx', 'doc'].includes(ext || '')) {
      setFileError('Поддерживаются только .txt, .docx и .doc файлы');
      setTaskContextFile(null);
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Файл слишком большой (макс. 10МБ)');
      setTaskContextFile(null);
      return;
    }
    
    setTaskContextFile(file);
    
    // Extract text from file
    try {
      if (ext === 'txt') {
        const text = await file.text();
        if (text.length > 50000) {
          setFileError('Текст файла слишком большой (>50KB), контекст не будет использован');
          setTaskContextFileText('');
        } else {
          setTaskContextFileText(text);
        }
      } else if (ext === 'docx' || ext === 'doc') {
        // Read as ArrayBuffer and extract text from docx XML
        const buffer = await file.arrayBuffer();
        try {
          // Use JSZip-like approach: read the docx as a zip and extract word/document.xml
          const blob = new Blob([buffer]);
          const text = await extractDocxText(blob);
          if (text.length > 50000) {
            setFileError('Текст файла слишком большой (>50KB), контекст не будет использован');
            setTaskContextFileText('');
          } else {
            setTaskContextFileText(text);
          }
        } catch {
          setFileError('Не удалось извлечь текст из файла');
          setTaskContextFileText('');
        }
      }
    } catch {
      setFileError('Ошибка при чтении файла');
    }
  };
  
  // Simple docx text extraction using browser APIs
  const extractDocxText = async (blob: Blob): Promise<string> => {
    // A .docx file is a ZIP archive. We can use the browser's built-in
    // decompression to read the XML content.
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    
    // Find the PK signature (ZIP file)
    if (uint8[0] !== 0x50 || uint8[1] !== 0x4B) {
      throw new Error('Not a valid docx file');
    }
    
    // Use the Response API to decompress
    const response = await fetch(URL.createObjectURL(blob));
    const ab = await response.arrayBuffer();
    
    // Simple approach: convert to text and extract from XML tags
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(ab);
    
    // Look for word/document.xml content between <w:t> tags
    const textParts: string[] = [];
    const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = regex.exec(rawText)) !== null) {
      textParts.push(match[1]);
    }
    
    if (textParts.length > 0) {
      return textParts.join(' ');
    }
    
    // Fallback: strip all XML/HTML tags
    return rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 50000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    let assistantContent = '';
    
    // Build task context if provided
    const selectedTask = availableTasks.find(t => t.id === selectedTaskId);
    const taskContext = (selectedTask || taskContextFileText) ? {
      name: selectedTask?.title || undefined,
      description: selectedTask?.description || undefined,
      fileText: taskContextFileText || undefined,
    } : undefined;

    try {
      await sendChatMessage(
        userMessage,
        sessionId,
        (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === 'assistant') {
              lastMessage.content = assistantContent;
            } else {
              newMessages.push({ role: 'assistant', content: assistantContent });
            }
            return [...newMessages];
          });
        },
        (newSessionId, sources) => {
          setSessionId(newSessionId);
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.role === 'assistant') {
              lastMessage.sources = sources;
            }
            return [...newMessages];
          });
          loadSessions();
        },
        chatMode,
        taskContext
      );
      // Refresh list to update message count/title, resetting the list
      loadSessions(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  return (
    <div className={`lawyer-page ${!showSidebar ? 'sidebar-collapsed' : ''}`}>
      <div 
        className={`sidebar-backdrop ${showSidebar ? 'active' : ''}`} 
        onClick={() => setShowSidebar(false)}
      />
      <aside className={`chat-sidebar ${!showSidebar ? 'collapsed' : ''}`}>
          <button onClick={() => navigate('/dashboard')} className="btn-back">← Назад</button>
          <button onClick={startNewChat} className="btn-new-chat">+ Новый чат</button>
          <div className="sessions-list">
            <h3>История чатов</h3>
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${session.id === sessionId ? 'active' : ''}`}
                onClick={() => handleSessionClick(session)}
              >
                <div className="session-info">
                  <span className="session-title">{session.title}</span>
                  <span className="session-count">{session.message_count} сообщ.</span>
                </div>
                <button 
                  className="btn-delete-small" 
                  onClick={(e) => handleDeleteSession(e, session)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            ))}
            {hasMore && sessions.length > 0 && (
              <button 
                className="btn-load-more" 
                onClick={handleLoadMore}
                style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                Еще...
              </button>
            )}
          </div>
        </aside>

      <main className="chat-main">
        <header className="chat-header">
          <button onClick={() => setShowSidebar(!showSidebar)} className="btn-toggle-sidebar">
            {showSidebar ? '◀' : '▶'}
          </button>
          <h1>{chatMode === 'smalltalk' ? '🗣️ Простые вопросы' : chatMode === 'auto-detect' ? '🔮 Авто-определение' : '💬 AI Юрист'}</h1>
          <div className="mode-selector">
            <select 
              value={chatMode} 
              onChange={(e) => setChatMode(e.target.value as typeof chatMode)}
              className="mode-dropdown"
            >
              <optgroup label="🔮 Авто">
                <option value="auto-detect">🔮 Авто-определение</option>
              </optgroup>
              
              <optgroup label="📚 Базовые режимы">
                <option value="consultant">📚 Юрист-консультант</option>
                <option value="risk-manager">🛡️ Риск-менеджер</option>
                <option value="practitioner">⚖️ Юрист-практик</option>
                <option value="smalltalk">💬 Простые вопросы</option>
                <option value="quick-answer">⚡ Быстрый ответ</option>
              </optgroup>
              
              <optgroup label="⚖️ Уголовное право">
                <option value="criminal-defense">�️ Адвокат (Защита)</option>
                <option value="criminal-prosecution">⚔️ Прокурор (Обвинение)</option>
              </optgroup>

              <optgroup label="🏛️ Административное право">
                <option value="admin-defense">🛡️ Адм. защита (Штрафы)</option>
                <option value="admin-procedure">📋 Адм. процедуры</option>
              </optgroup>

              <optgroup label="💼 Бизнес и Корпоратив">
                <option value="corporate">🏢 Корпоративный юрист</option>
                <option value="commercial">📜 Коммерческий юрист</option>
                <option value="startup">� Юрист для стартапов</option>
                <option value="merger-acquisition">🤝 Слияния (M&A)</option>
                <option value="antitrust">� Антимонопольный юрист</option>
                <option value="bankruptcy">🏚️ Банкротство</option>
                <option value="procurement">🏛️ Госзакупки</option>
                <option value="licensing">📋 Лицензирование</option>
                <option value="regulatory">🌐 Регуляторный комплаенс</option>
              </optgroup>

              <optgroup label="� Финансы и Налоги">
                <option value="tax">🧾 Налоговый юрист</option>
                <option value="banking">🏦 Банковский юрист</option>
                <option value="securities">📈 Ценные бумаги и IPO</option>
                <option value="insurance">🛡️ Страховой юрист</option>
                <option value="debt-collection">💸 Взыскание долгов</option>
                <option value="investor-protection">� Защита инвесторов</option>
                <option value="cross-border">🌍 Трансграничные сделки</option>
                <option value="customs">🚢 Таможенный юрист</option>
              </optgroup>

              <optgroup label="🏠 Недвижимость и Быт">
                <option value="real-estate">🏠 Недвижимость</option>
                <option value="housing">🏘️ Жилищное право (ЖКХ)</option>
                <option value="land-disputes">🌾 Земельные споры</option>
                <option value="family">�‍👩‍👧 Семейный юрист</option>
                <option value="consumer-protection">🛒 Защита прав потребителей</option>
                <option value="notary">📜 Нотариус</option>
              </optgroup>

              <optgroup label="� Трудовое право">
                <option value="hr">� HR-юрист</option>
                <option value="worker-protection">👷 Защита прав работника</option>
                <option value="compliance-hr">👥 HR-комплаенс</option>
              </optgroup>

              <optgroup label="⚖️ Суды и Споры">
                <option value="litigator">🏛️ Судебный юрист</option>
                <option value="procedural">📝 Процессуалист</option>
                <option value="arbitration">🤝 Арбитраж</option>
                <option value="mediation">🕊️ Медиация</option>
                <option value="enforcement">� Исполнение решений</option>
                <option value="deadlines">⏳ Сроки и давность</option>
                <option value="forensic-legal">� Судебная экспертиза</option>
                <option value="constitutional">🏛️ Конституционное право</option>
              </optgroup>

              <optgroup label="� IT и Интеллектуальная собственность">
                <option value="ip">💡 IP-юрист (Авторское право)</option>
                <option value="digital-law">💻 Цифровое право (IT)</option>
              </optgroup>

              <optgroup label="🧯 Риски и Проверки">
                <option value="legal-audit">🚨 Юридический аудит</option>
                <option value="compliance">🛡️ Общий комплаенс</option>
                <option value="environmental">� Экологическое право</option>
                <option value="doc-review">📄 Проверка документа</option>
              </optgroup>
              
              <optgroup label="🛠️ Инструменты">
                <option value="legal-letter">✉️ Написать претензию</option>
                <option value="negotiator">🤝 Переговорщик</option>
                <option value="interview-practice">🎤 Интервьюер</option>
              </optgroup>

              <optgroup label="🧠 Аналитика">
                <option value="analyst">🧩 Аналитик</option>
                <option value="skeptic">🔍 Скептик</option>
                <option value="strategist">🤖 Стратег</option>
                <option value="judge-questions">⚖️ Вопросы судьи</option>
                <option value="odds">� Шансы на успех</option>
                <option value="what-if">🧪 Что если...</option>
              </optgroup>
            </select>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className={`welcome-message ${chatMode === 'smalltalk' ? 'smalltalk-mode' : chatMode === 'auto-detect' ? 'auto-detect-mode' : ''}`}>
              <h2>{chatMode === 'smalltalk' ? '👋 Привет! Задай простой вопрос' : chatMode === 'auto-detect' ? '🔮 Авто-определение режима' : '⚖️ Добро пожаловать в AI Юрист'}</h2>
              <p>{chatMode === 'smalltalk' ? 'Быстрые ответы на простые юридические вопросы' : chatMode === 'auto-detect' ? 'AI автоматически определит тип вашего вопроса и выберет лучший режим консультации' : 'Детальный анализ рисков по законодательству Узбекистана'}</p>
              <div className="example-questions">
                {chatMode === 'smalltalk' ? (
                  <>
                    <button onClick={() => setInput('Можно ли работать без трудового договора?')}>
                      Работа без договора
                    </button>
                    <button onClick={() => setInput('Нужна ли регистрация для продажи онлайн?')}>
                      Продажи онлайн
                    </button>
                    <button onClick={() => setInput('Какие документы нужны для ИП?')}>
                      Документы для ИП
                    </button>
                  </>
                ) : chatMode === 'family' ? (
                  <>
                    <button onClick={() => setInput('Как подать на алименты без развода?')}>
                      Алименты без развода
                    </button>
                    <button onClick={() => setInput('Как делится имущество при разводе?')}>
                      Раздел имущества
                    </button>
                    <button onClick={() => setInput('Как определить порядок общения с ребенком?')}>
                      Общение с ребенком
                    </button>
                  </>
                ) : chatMode === 'real-estate' ? (
                  <>
                    <button onClick={() => setInput('Как проверить квартиру перед покупкой?')}>
                      Проверка квартиры
                    </button>
                    <button onClick={() => setInput('Как оформить кадастр на новый дом?')}>
                      Оформление кадастра
                    </button>
                    <button onClick={() => setInput('Права собственника при сносе (снос)?')}>
                      Компенсация за снос
                    </button>
                  </>
                ) : chatMode === 'notary' ? (
                  <>
                    <button onClick={() => setInput('Какие документы нужны для доверенности?')}>
                      Доверенность на авто
                    </button>
                    <button onClick={() => setInput('Как вступить в наследство?')}>
                      Оформление наследства
                    </button>
                    <button onClick={() => setInput('Сколько стоит согласие на выезд ребенка?')}>
                      Согласие на выезд
                    </button>
                  </>
                ) : chatMode === 'ip' ? (
                  <>
                    <button onClick={() => setInput('Как зарегистрировать товарный знак?')}>
                      Регистрация бренда
                    </button>
                    <button onClick={() => setInput('Как защитить авторские права на код?')}>
                      Защита кода
                    </button>
                    <button onClick={() => setInput('Что делать, если украли контент?')}>
                      Кража контента
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setInput('Какие права имеет работник при увольнении?')}>
                      Права при увольнении
                    </button>
                    <button onClick={() => setInput('Как зарегистрировать ООО в Узбекистане?')}>
                      Регистрация ООО
                    </button>
                    <button onClick={() => setInput('Каковы сроки исковой давности по договорам?')}>
                      Исковая давность
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            // Create markdown components with interactive citations
            const components: Components = {
              p: ({children, ...props}) => {
                if (typeof children === 'string' && msg.sources) {
                  // Process text to add citation links
                  const processedChildren = children.split(/(Статья\s+\d+(?:\.\d+)?)/g).map((part, i) => {
                    const match = part.match(/Статья\s+(\d+(?:\.\d+)?)/);
                    if (match) {
                      const articleNum = match[1];
                      const sourceIndex = msg.sources?.findIndex(s => s.article === articleNum);
                      if (sourceIndex !== undefined && sourceIndex >= 0) {
                        return (
                          <a
                            key={i}
                            href={`#source-${idx}-${sourceIndex}`}
                            className="citation-link"
                            onClick={(e) => {
                              e.preventDefault();
                              const sourceEl = document.getElementById(`source-${idx}-${sourceIndex}`);
                              const detailsEl = sourceEl?.closest('details');
                              if (detailsEl && !detailsEl.open) {
                                detailsEl.open = true;
                              }
                              sourceEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              sourceEl?.classList.add('highlighted');
                              setTimeout(() => sourceEl?.classList.remove('highlighted'), 2000);
                            }}
                          >
                            {part}
                          </a>
                        );
                      }
                    }
                    return part;
                  });
                  return <p {...props}>{processedChildren}</p>;
                }
                return <p {...props}>{children}</p>;
              },
            };

            return (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-avatar">{msg.role === 'user' ? '👤' : '⚖️'}</div>
                <div className="message-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={msg.role === 'assistant' ? components : undefined}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.sources && msg.sources.length > 0 && (
                    <details className="sources-expander">
                      <summary>📚 Источники ({msg.sources.length})</summary>
                      <ul className="sources-list">
                        {msg.sources.map((source, i) => (
                          <li key={i} id={`source-${idx}-${i}`} className="source-item-entry">
                            <div className="source-header-info">
                              <strong>{source.source}</strong>
                              <span className="source-article-badge">Статья {source.article}</span>
                            </div>
                            {source.chapter && (
                              <div className="source-chapter">{source.chapter}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="message assistant loading">
              <div className="message-avatar">⚖️</div>
              <div className="message-content">
                <span className="typing-indicator">●●●</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Task Context Panel */}
        {showTaskContext && (
          <div className="task-context-panel" style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>📋 Контекст задачи</span>
              <button 
                onClick={() => setShowTaskContext(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '18px' }}
              >✕</button>
            </div>
            <select
              value={selectedTaskId ?? ''}
              onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option value="">— Выберите задачу —</option>
              {availableTasks.map(task => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.status})
                </option>
              ))}
            </select>
            {selectedTaskId && (() => {
              const task = availableTasks.find(t => t.id === selectedTaskId);
              return task?.description ? (
                <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-primary)', fontSize: '12px', color: 'var(--text-secondary)', maxHeight: '60px', overflow: 'auto' }}>
                  {task.description}
                </div>
              ) : null;
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                📎 {taskContextFile ? taskContextFile.name : 'Прикрепить файл (.txt, .docx, .doc)'}
                <input
                  type="file"
                  accept=".txt,.docx,.doc"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              {taskContextFile && (
                <button 
                  onClick={() => { setTaskContextFile(null); setTaskContextFileText(''); setFileError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '14px' }}
                >🗑️</button>
              )}
            </div>
            {fileError && <span style={{ color: '#e74c3c', fontSize: '12px' }}>⚠️ {fileError}</span>}
            {taskContextFileText && <span style={{ color: '#2ecc71', fontSize: '12px' }}>✅ Текст извлечён ({(taskContextFileText.length / 1024).toFixed(1)}KB)</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="chat-input-form">
          <button
            type="button"
            onClick={() => setShowTaskContext(!showTaskContext)}
            title="Добавить контекст задачи"
            style={{
              background: showTaskContext || selectedTaskId || taskContextFileText ? 'var(--accent-color, #6c5ce7)' : 'var(--bg-secondary)',
              color: showTaskContext || selectedTaskId || taskContextFileText ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              fontSize: '16px',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >📋</button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Задайте юридический вопрос..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Отправить
          </button>
        </form>
      </main>
    </div>
  );
}
