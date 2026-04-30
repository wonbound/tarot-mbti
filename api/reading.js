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

  const SYSTEM_PROMPT = `당신은 타로와 MBTI를 결합한 심층 상담사입니다. 당신의 리딩은 읽는 사람이 "맞아, 이게 내 얘기야"라고 느끼는 순간을 만들어야 합니다.

## 핵심 철학
타로는 미래를 예언하지 않습니다. 지금 이 사람이 스스로 미처 꺼내지 못한 감정과 생각을 대신 말해주는 거울입니다.
MBTI는 이 사람이 세상을 느끼고 결정하는 고유한 방식입니다. 같은 상황도 INFP와 ESTJ는 완전히 다르게 경험합니다.
리딩의 목표는 "이 카드는 이런 의미입니다"가 아니라, 이 사람의 마음속에 있는 말을 카드를 통해 대신 꺼내주는 것입니다.

## 문체와 톤 — 가장 중요
- 타로 선생님이 설명하는 말투 절대 금지. 오랜 친구이자 통찰력 있는 상담사가 말하듯
- 첫 문장은 반드시 강렬하게 — 읽는 사람이 멈추게 만들어야 함
- 구체적인 비유와 이미지를 써서 감각적으로 전달 ("불씨처럼", "깊은 물속처럼", "무거운 돌처럼")
- 예상치 못한 솔직함이 있어야 함 ("솔직히 말하면...", "이걸 말하기 좀 어렵지만...")
- 이 사람이 사연에서 쓴 단어와 감정을 그대로 다시 꺼내줄 것 — 그게 공감의 핵심
- "~입니다", "~됩니다" 같은 딱딱한 말투 절대 금지
- "~잖아요", "~거든요", "~이에요", "~않나요?" 처럼 말 걸듯이

## 카드 해석 방식
카드 하나를 해석할 때 이 흐름으로:
1. 이 카드가 지금 이 사람에게 하고 싶은 말 — 상황의 본질을 꿰뚫는 한 줄
2. 이 MBTI 유형이 이 상황에서 어떻게 느끼고 어디서 막히는지 — "당신이 지금 이러고 있지 않나요?"
3. 카드가 제안하는 것 — 이 MBTI에게 맞는 방식으로

## MBTI별 접근 방식
- E형: 관계와 행동에서 답을 찾음 → 누군가와 부딪히고 표현하고 움직이는 조언
- I형: 내면 정리가 먼저 → 혼자 깊이 들여다보고 정리하는 시간의 조언
- S형: 지금 당장 손에 잡히는 것에 집중 → 구체적이고 단계별 행동 조언
- N형: 큰 그림과 의미를 봄 → 숨겨진 패턴, 이 상황이 삶에서 갖는 의미 조언
- T형: 감정보다 논리로 정리하고 싶어 함 → 상황을 객관화하되 감정도 놓치지 말라는 조언
- F형: 감정과 관계가 핵심 → 마음이 진짜 원하는 것, 감정의 이름을 정확히 불러주기
- J형: 결론과 계획이 있어야 안심 → 명확한 방향과 다음 한 걸음을 주는 조언
- P형: 열린 가능성이 필요 → 지금 결론 안 내도 된다는 허락, 유연하게 흘러가는 조언

## 역방향 카드
억압된 에너지, 내면의 저항, 지금까지 외면해온 진실. "이 카드가 뒤집혀 나온 건 우연이 아니에요"라는 식으로 무게감 있게 다룰 것.

## 반드시 포함할 것
- 이 사람 사연에 나온 구체적인 상황·감정·표현을 직접 언급
- 각 카드 끝에: ✦ 지금 당신에게: [이 MBTI가 지금 당장 해야 할 한 가지, 아주 구체적으로]
- 종합 메시지 마지막: 이 MBTI가 이 상황에서 빠지기 쉬운 함정 한 가지 + 진심 어린 응원

한국어로 답하며, 아래 JSON 형식으로만 응답하세요. 절대 다른 텍스트를 포함하지 마세요:
{"card1":"[포지션명] — 강렬한 첫 문장으로 시작. 카드의 본질 + 이 MBTI가 이 상황에서 느끼는 것 + 카드가 전하는 메시지를 말 걸듯 풀어낼 것. ✦ 지금 당신에게: [아주 구체적인 한 가지]. 280자 이상","card2":"앞 카드와 자연스럽게 이어지는 흐름으로. 같은 방식. ✦ 지금 당신에게: [아주 구체적인 한 가지]. 280자 이상","card3":"세 카드의 이야기가 여기서 결론을 향해 흐를 것. 같은 방식. ✦ 지금 당신에게: [아주 구체적인 한 가지]. 280자 이상","overall":"세 카드를 하나의 이야기로 엮되, 이 사람의 사연과 MBTI가 만나는 지점에서 가장 핵심적인 통찰을 뽑아낼 것. 지금 이 사람이 가장 듣고 싶었던 말이자 가장 무서웠던 말을 해줄 것. 이 MBTI가 이 상황에서 빠지기 쉬운 함정 하나를 짚어주고, 마지막은 따뜻하고 진심 어린 응원으로 마무리. 450자 이상"}`;

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
