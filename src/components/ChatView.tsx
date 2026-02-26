import { useState, useRef, useEffect, useCallback } from 'react'
import { getTheme, FIGURE_IDS } from '../themes'
import { t } from '../i18n'
import type { FigureId, Message } from '../types'

const API_URL = import.meta.env.VITE_API_URL || ''

function loadHistory(key: string): Message[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

interface ChatViewProps {
  figure: FigureId
  onSwitch: (figure: FigureId) => void
}

export default function ChatView({ figure, onSwitch }: ChatViewProps) {
  const theme = getTheme(figure)
  const STORAGE_KEY = `logos-chat-${figure}`

  const [messages, setMessages] = useState<Message[]>(() => loadHistory(STORAGE_KEY))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const switcherRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages, STORAGE_KEY])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  // Close switcher on outside click
  useEffect(() => {
    if (!showSwitcher) return
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowSwitcher(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSwitcher])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(0, -1),
          figure,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      const replies: string[] = data.replies || []

      for (let i = 0; i < replies.length; i++) {
        const delay = Math.min(400 + replies[i].length * 80, 2500)
        await new Promise(r => setTimeout(r, delay))
        setMessages(prev => [...prev, { role: 'assistant', content: replies[i] }])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: t("Something went wrong. Try again.", "出了点问题，请重试。") },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const otherFigures = FIGURE_IDS.filter(id => id !== figure)

  // Group consecutive messages by role
  const groupedMessages: Message[][] = []
  for (const msg of messages) {
    const lastGroup = groupedMessages[groupedMessages.length - 1]
    if (lastGroup && lastGroup[0].role === msg.role) {
      lastGroup.push(msg)
    } else {
      groupedMessages.push([msg])
    }
  }

  return (
    <div className={`chat-container theme-${figure}`}>
      <div className="messages" ref={messagesRef}>
        <div className="chat-top" ref={switcherRef}>
          <button className="chat-top-btn" onClick={() => setShowSwitcher(!showSwitcher)}>
            <img className="chat-top-avatar" src={theme.avatar} alt={theme.name} />
            <div className="chat-top-name">{t(theme.name, theme.nameCn)}</div>
          </button>

          {showSwitcher && (
            <div className="figure-switcher">
              {otherFigures.map(id => {
                const other = getTheme(id)
                return (
                  <button
                    key={id}
                    className="figure-switcher-item"
                    onClick={() => { setShowSwitcher(false); onSwitch(id) }}
                  >
                    <img src={other.avatar} alt={other.name} />
                    <span>{t(other.name, other.nameCn)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="welcome">
            <p>{t(theme.welcomeText, theme.welcomeTextCn)}</p>
          </div>
        )}

        {groupedMessages.map((group, gi) => (
          <div key={gi} className={`message-group ${group[0].role}`}>
            {group[0].role === 'assistant' && (
              <img className="group-avatar" src={theme.avatar} alt={theme.name} />
            )}
            <div className="bubbles">
              {group.map((msg, mi) => (
                <div key={mi} className="bubble">
                  {msg.content}
                </div>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="typing-group">
            <img className="group-avatar" src={theme.avatar} alt={theme.name} />
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(theme.placeholder, theme.placeholderCn)}
            rows={1}
          />
        </div>
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          {t('Send', '发送')}
        </button>
      </div>
    </div>
  )
}
