import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a medication consultation assistant for '약속' service.
CRITICAL: You MUST respond ONLY in Korean (한국어). Never use Japanese, Chinese characters, or any other language.
If you find yourself writing non-Korean characters, stop and rewrite in Korean only.

다음 규칙을 반드시 지키세요:
1. 반드시 한국어로만 답변합니다. 일본어, 한자, 영어 단어를 절대 섞지 마세요.
2. 의약품 정보, 복약 방법, 부작용, 주의사항 등에 대해서만 답변합니다
3. 의료 진단, 처방, 질병 치료에 대한 조언은 제공하지 않습니다
4. 모든 답변 끝에 "정확한 복약 지도는 의사 또는 약사와 상담하세요"를 명시합니다
5. 답변은 명확하고 이해하기 쉽게 작성합니다
6. 위험할 수 있는 정보(약물 과다복용 등)는 절대 제공하지 않습니다`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    if (!messages?.length) return NextResponse.json({ reply: '' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ reply: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const chatMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: m.content }))

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatMessages,
        ],
        max_tokens: 1024,
      }),
    })

    const data = await res.json()
    console.log('Groq 전체 응답:', JSON.stringify(data, null, 2))

    const reply = data?.choices?.[0]?.message?.content ?? '답변을 생성하지 못했습니다.'
    return NextResponse.json({ reply })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ reply: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}