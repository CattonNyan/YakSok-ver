'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, AlertCircle, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function createMessage(role: Message['role'], content: string): Message {
  return { id: crypto.randomUUID(), role, content }
}

const QUICK = [
  '타이레놀 하루 최대 용량이 얼마인가요?',
  '공복에 먹으면 안 되는 약이 있나요?',
  '항생제를 중간에 끊어도 되나요?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage('assistant', '안녕하세요! 저는 약속의 AI 상담 도우미입니다 💊\n\n복약 방법, 약물 부작용, 의약품 정보 등 궁금한 점을 자유롭게 물어보세요.\n\n⚠️ 본 서비스는 참고용이며 의료 진단을 대체하지 않습니다.')
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMessage = createMessage('user', text)
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, createMessage('assistant', data.reply ?? '답변을 생성하지 못했습니다.')])
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
      setMessages(prev => [...prev, createMessage('assistant', '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      {/* 헤더 */}
      <div className="mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-mint-400 to-mint-600 rounded-2xl flex items-center justify-center shadow-sm shadow-mint-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sage-900 tracking-tight">AI 상담</h1>
            <p className="text-sm text-sage-400">약에 관한 궁금한 점을 물어보세요</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-mint-600 bg-mint-50 border border-mint-100 px-3 py-1.5 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
            온라인
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        {messages.map((m) => (
          <div key={m.id} className={clsx('flex gap-3 items-end', m.role === 'user' && 'flex-row-reverse')}>
            {/* 아바타 */}
            <div className={clsx(
              'w-8 h-8 rounded-2xl flex items-center justify-center shrink-0',
              m.role === 'assistant'
                ? 'bg-gradient-to-br from-mint-400 to-mint-600 shadow-sm shadow-mint-500/20'
                : 'bg-sage-800'
            )}>
              {m.role === 'assistant'
                ? <Bot className="w-4 h-4 text-white" />
                : <User className="w-4 h-4 text-white" />}
            </div>

            {/* 말풍선 */}
            <div className={clsx(
              'max-w-[78%] px-4 py-3.5 text-sm leading-relaxed whitespace-pre-line',
              m.role === 'assistant'
                ? 'bg-white border border-sage-100 shadow-sm text-sage-800 rounded-3xl rounded-bl-lg'
                : 'bg-mint-500 text-white rounded-3xl rounded-br-lg'
            )}>
              {m.content}
            </div>
          </div>
        ))}

        {/* 로딩 */}
        {loading && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-sage-100 shadow-sm px-5 py-3.5 rounded-3xl rounded-bl-lg flex items-center gap-2.5">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-sage-400">답변 생성 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 빠른 질문 */}
      {messages.length === 1 && (
        <div className="shrink-0 mb-3">
          <p className="text-xs font-semibold text-sage-400 mb-2 px-1">자주 묻는 질문</p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="shrink-0 text-xs bg-white border border-sage-200 text-sage-600 px-3.5 py-2 rounded-2xl hover:border-mint-300 hover:text-mint-700 hover:bg-mint-50 transition-all font-medium whitespace-nowrap shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 면책 고지 */}
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <AlertCircle className="w-3 h-3 text-sage-300 shrink-0" />
        <p className="text-xs text-sage-400">참고용 정보입니다. 의료 진단을 대체하지 않습니다.</p>
      </div>

      {/* 입력창 */}
      <div className="flex gap-2 shrink-0" role="form" aria-label="메시지 입력">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="약에 대해 궁금한 점을 입력하세요..."
          aria-label="메시지 입력"
          className="input-base flex-1 rounded-2xl"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label={loading ? '전송 중' : '메시지 전송'}
          className="w-12 h-12 flex items-center justify-center bg-mint-500 hover:bg-mint-600 text-white rounded-2xl transition-all duration-150 shadow-md shadow-mint-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            : <Send className="w-5 h-5" aria-hidden />}
        </button>
      </div>
    </div>
  )
}
