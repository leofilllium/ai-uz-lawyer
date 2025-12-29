/**
 * Lawyer Chat Page
 * Full RAG-powered legal chat with streaming responses.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, getChatSessions, type ChatSession, type Source } from '../api/client';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSmallTalk = searchParams.get('mode') === 'smalltalk';

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
        }
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
                onClick={() => setSessionId(session.id)}
              >
                <span className="session-title">{session.title}</span>
                <span className="session-count">{session.message_count} сообщ.</span>
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
          <h1>{isSmallTalk ? '🗣️ Просто поболтать' : '💬 AI Юрист'}</h1>
        </header>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className={`welcome-message ${isSmallTalk ? 'smalltalk-mode' : ''}`}>
              <h2>{isSmallTalk ? '👋 Привет! Давай поболтаем' : '⚖️ Добро пожаловать в AI Юрист'}</h2>
              <p>{isSmallTalk ? 'Спроси о чём угодно — я здесь чтобы помочь!' : 'Задайте юридический вопрос по законодательству Узбекистана'}</p>
              <div className="example-questions">
                {isSmallTalk ? (
                  <>
                    <button onClick={() => setInput('Расскажи что-нибудь интересное!')}>
                      Расскажи интересное
                    </button>
                    <button onClick={() => setInput('Как у тебя дела?')}>
                      Как дела?
                    </button>
                    <button onClick={() => setInput('Помоги мне с идеями для подарка')}>
                      Идеи для подарка
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
                <ReactMarkdown>{msg.content}</ReactMarkdown>
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
