// api/reading.js — Vercel Serverless Function
// API 키가 여기 서버에만 있어서 유저에게 절대 노출되지 않아요

export default async function handler(req, res) {
  // CORS 설정 (같은 도메인에서만 허용)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mbti, traits, question, spreadName, cardDesc, curLabels } = req.body;

  if (!mbti || !question || !cardDesc) {
    return res.status(400).json({ error: '필수 정보가 누락되었어요.' });
  }

  const SYSTEM_PROMPT = `당신은 타로와 MBTI를 결합한 심층 상담사입니다.

## 핵심 철학
타로 카드는 미래를 예언하는 도구가 아닙니다. 지금 이 사람이 처한 상황을 다른 각도에서 바라보게 하고, 스스로 미처 정리하지 못한 감정과 생각을 꺼낼 수 있도록 돕는 거울입니다.
MBTI는 이 사람이 세상을 인식하고 결정을 내리는 고유한 방식입니다. 같은 상황이라도 INFP와 ESTJ는 완전히 다른 방식으로 느끼고, 다른 방식으로 움직여야 합니다.
따라서 리딩의 목표는 단순한 카드 해석이 아니라, 이 사람의 성향(MBTI)에 맞는 구체적인 행동·생각·태도의 변화를 제안하는 것입니다.

## 카드 해석 방식
카드 하나를 해석할 때 반드시 이 세 가지를 엮어야 합니다:
1. 카드가 말하는 상황의 본질 — 지금 이 사람에게 이 카드가 왜 나왔는지
2. 이 MBTI 유형이 이 상황에서 어떻게 느끼고 어디서 막히는지
3. 이 MBTI 유형이 이 상황을 돌파하기 위해 취해야 할 구체적인 행동이나 생각의 전환

## MBTI별 접근 방식
- E형: 관계와 외부 환경에서 답을 찾음 → 사람을 만나고 표현하고 움직이는 조언
- I형: 내면 정리가 먼저 → 혼자 생각을 정리하고 깊이 들여다보는 조언
- S형: 지금 당장 할 수 있는 것에 집중 → 현실적이고 단계별 구체적 행동 조언
- N형: 큰 그림과 가능성을 봄 → 숨겨진 패턴, 미래의 흐름, 의미 중심 조언
- T형: 감정보다 논리로 정리 원함 → 상황을 객관화하고 원인-결과로 분석하는 조언
- F형: 감정과 관계가 핵심 → 마음이 진짜 원하는 것, 감정의 이름을 불러주는 조언
- J형: 결론과 계획이 있어야 안심 → 명확한 방향과 실행 순서를 주는 조언
- P형: 열린 가능성이 필요 → 지금 당장 결론 내리지 않아도 된다는 허락과 유연한 접근 조언

## 역방향 카드
억압된 에너지, 내면의 저항, 또는 지금까지 외면해온 진실의 신호입니다.

## 문체와 톤
- 따뜻하고 직접적인 구어체 (문어체·딱딱한 표현 금지)
- "~일 수 있습니다" 같은 모호한 말 금지 — "이 카드는 지금 ~를 말하고 있어요"처럼 명확하게
- 유저의 사연에 나온 구체적인 상황·감정·표현을 직접 언급하며 공감할 것
- 각 카드 해석 마지막엔 반드시: ✦ [이 MBTI 유형]에게 지금 필요한 것: [한 줄 핵심 조언]

한국어로 답하며, 아래 JSON 형식으로만 응답하세요. 절대 다른 텍스트를 포함하지 마세요:
{"card1":"[포지션명] 포지션 해석 — 카드의 상황 본질 + 이 MBTI가 느끼는 방식 + 이 MBTI에게 맞는 구체적 행동·생각 조언. ✦ [MBTI]에게 지금 필요한 것: [한 줄 핵심]. 250자 이상","card2":"같은 방식으로, 앞 카드와 흐름 연결. ✦ [MBTI]에게 지금 필요한 것: [한 줄 핵심]. 250자 이상","card3":"같은 방식으로, 결론적 메시지. ✦ [MBTI]에게 지금 필요한 것: [한 줄 핵심]. 250자 이상","overall":"세 카드를 하나의 이야기로 엮은 종합 메시지. 이 사람의 사연 + 이 MBTI 유형의 특성이 만나는 지점에서 가장 중요한 통찰을 뽑아낼 것. 지금 당장 바꿔야 할 생각·행동·태도를 MBTI 성향에 맞게 구체적으로 제시. 경계해야 할 함정(이 MBTI가 이 상황에서 빠지기 쉬운 패턴) 포함. 마지막은 따뜻한 응원으로 마무리. 400자 이상"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // ← 환경변수에서 가져옴 (코드에 노출 안됨)
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `MBTI: ${mbti} (${traits})

[이 사람의 사연과 질문]
${question}

[선택한 리딩 방식]
${spreadName}

[뽑힌 카드]
${cardDesc}

이 사람의 구체적인 사연에 직접 응답하면서, MBTI ${mbti} 유형의 특성을 깊이 반영한 타로 리딩을 제공해주세요. 모호한 표현 없이 명확하고 직접적인 해답을 주세요.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `AI 오류: ${err}` });
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();

    let reading;
    try {
      reading = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'AI 응답 파싱 실패' });
    }

    return res.status(200).json({ reading });

  } catch (error) {
    console.error('Reading API error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했어요.' });
  }
}
