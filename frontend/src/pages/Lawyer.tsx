/**
 * Lawyer Chat Page
 * Full RAG-powered legal chat with streaming responses.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChatMessage, getChatSessions, getChatSession, deleteHistoryItem, type ChatSession, type Source } from '../api/client';

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
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatMode, setChatMode] = useState<'risk-manager' | 'smalltalk' | 'consultant' | 'practitioner' | 'litigator' | 'legal-audit' | 'compliance' | 'tax' | 'corporate' | 'commercial' | 'negotiator' | 'startup' | 'procedural' | 'deadlines' | 'hr' | 'worker-protection' | 'analyst' | 'skeptic' | 'judge-questions' | 'odds' | 'strategist' | 'what-if'>('consultant');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    let assistantContent = '';

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
        chatMode
      );
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
    <div className="lawyer-page">
      {showSidebar && (
        <aside className="chat-sidebar">
          <button onClick={() => navigate('/')} className="btn-back">← Назад</button>
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
          </div>
        </aside>
      )}

      <main className="chat-main">
        <header className="chat-header">
          <button onClick={() => setShowSidebar(!showSidebar)} className="btn-toggle-sidebar">
            {showSidebar ? '◀' : '▶'}
          </button>
          <h1>{chatMode === 'smalltalk' ? '🗣️ Простые вопросы' : '💬 AI Юрист'}</h1>
          <div className="mode-selector">
            <select 
              value={chatMode} 
              onChange={(e) => setChatMode(e.target.value as typeof chatMode)}
              className="mode-dropdown"
            >
              <optgroup label="📚 Консультации">
                <option value="risk-manager">🛡️ Риск-менеджер</option>
                <option value="smalltalk">💬 Простые вопросы</option>
                <option value="consultant">📚 Юрист-консультант</option>
                <option value="practitioner">⚖️ Юрист-практик</option>
                <option value="litigator">🏛 Судебный юрист</option>
              </optgroup>
              <optgroup label="🧯 Риски и комплаенс">
                <option value="legal-audit">🚨 Юридический аудит</option>
                <option value="compliance">🛡 Комплаенс-офицер</option>
                <option value="tax">🧾 Налоговый юрист</option>
              </optgroup>
              <optgroup label="👔 Бизнес и корпоратив">
                <option value="corporate">🏢 Корпоративный юрист</option>
                <option value="commercial">📜 Коммерческий юрист</option>
                <option value="negotiator">🤝 Юрист по переговорам</option>
                <option value="startup">📈 Юрист для стартапов</option>
              </optgroup>
              <optgroup label="🧑‍⚖️ Суды и процесс">
                <option value="procedural">📝 Процессуальный юрист</option>
                <option value="deadlines">⏳ Сроки и давность</option>
              </optgroup>
              <optgroup label="🧑‍💼 Трудовое право">
                <option value="hr">👷 HR-юрист</option>
                <option value="worker-protection">🧑‍🤝‍🧑 Защита работника</option>
              </optgroup>
              <optgroup label="🧠 Умные режимы">
                <option value="analyst">🧩 Юрист-аналитик</option>
                <option value="skeptic">🔍 Юрист-скептик</option>
                <option value="judge-questions">🧠 Вопросы судьи</option>
                <option value="odds">📊 Оценка шансов</option>
              </optgroup>
              <optgroup label="🚀 Продвинутые">
                <option value="strategist">🤖 Юрист-стратег</option>
                <option value="what-if">🧪 Что если...</option>
              </optgroup>
            </select>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className={`welcome-message ${chatMode === 'smalltalk' ? 'smalltalk-mode' : ''}`}>
              <h2>{chatMode === 'smalltalk' ? '👋 Привет! Задай простой вопрос' : '⚖️ Добро пожаловать в AI Юрист'}</h2>
              <p>{chatMode === 'smalltalk' ? 'Быстрые ответы на простые юридические вопросы' : 'Детальный анализ рисков по законодательству Узбекистана'}</p>
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

          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-avatar">{msg.role === 'user' ? '👤' : '⚖️'}</div>
              <div className="message-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                {msg.sources && msg.sources.length > 0 && (
                  <details className="sources-expander">
                    <summary>📚 Источники ({msg.sources.length})</summary>
                    <ul className="sources-list">
                      {msg.sources.map((source, i) => (
                        <li key={i}>
                          <strong>Статья {source.article}</strong> — {source.source}
                          <br />
                          <span className="source-chapter">{source.chapter}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          ))}

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

        <form onSubmit={handleSubmit} className="chat-input-form">
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
