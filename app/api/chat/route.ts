import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function isChatMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== 'object') return false

  const candidate = message as Record<string, unknown>
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ reply: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { messages } = await request.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: '' }, { status: 400 })
    }

    const chatMessages = messages.filter(isChatMessage).slice(-20)
    const lastUserMessage = [...chatMessages].reverse().find(message => message.role === 'user')

    if (!lastUserMessage) {
      return NextResponse.json({ reply: '' }, { status: 400 })
    }

    const apiUrl = process.env.PILLDATA_CHAT_API_URL
    if (!apiUrl) {
      return NextResponse.json(
        { reply: 'PILLDATA_CHAT_API_URL이 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const apiKey = process.env.PILLDATA_CHAT_API_KEY
    const history = chatMessages
      .filter(message => message !== lastUserMessage)
      .slice(-10)

    const res = await fetch(new URL('/chat/stream', apiUrl).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify({
        message: lastUserMessage.content,
        history,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Pilldata Chat API error:', res.status, errText)
      return NextResponse.json(
        { reply: '답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      )
    }

    if (!res.body) {
      return NextResponse.json(
        { reply: '답변을 생성하지 못했습니다.' },
        { status: 502 }
      )
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { reply: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }
}
