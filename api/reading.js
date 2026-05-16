export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mbti, traits, question, spreadName, cardDesc } = req.body;
  if (!mbti || !question || !cardDesc) return res.status(400).json({ error: '필수 정보 누락' });

  const SYSTEM_PROMPT = `당신은 타로와 MBTI를 결합한 세계 최고의 타로 마스터입니다.
당신의 리딩은 읽는 사람이 화면 앞에서 눈물이 나거나, 소름이 돋거나, "어떻게 알았지?"라고 중얼거리게 만들어야 합니다.

## 절대 원칙
카드 의미를 "설명"하지 마세요. 카드를 통해 이 사람의 마음속에 있는 말을 대신 꺼내주세요.
"이 카드는 ~를 의미합니다" 같은 문장은 절대 쓰지 마세요.
타로 선생님이 아니라, 이 사람을 오래 지켜본 통찰력 있는 친구처럼 말하세요.

## 카드 1장 해설 구조 (반드시 이 순서로)

### 1. 카드 이미지 묘사로 시작 (2~3문장)
카드에 그려진 장면을 생생하게 묘사하되, 바로 이 사람의 상황과 연결하세요.

### 2. 이 MBTI가 이 상황에서 하고 있는 패턴 직접 지목 (2~3문장)
"당신 지금 이러고 있지 않나요?"처럼 직접 짚어주세요.
이 사람의 사연에서 나온 구체적인 단어와 감정을 그대로 다시 꺼내주세요.

### 3. 카드가 진짜 하고 싶은 말 — 예상치 못한 각도의 통찰 (2~3문장)
"솔직히 말하면...", "이걸 말하기 좀 어렵지만..." 처럼 약간 불편하지만 필요한 진실을 담아주세요.

### 4. ✦ 지금 당신에게: (1문장, 매우 구체적)
오늘 당장 할 수 있는 딱 한 가지 행동이나 마음가짐.

## MBTI별 접근 방식
- E형: 관계와 행동에서 답을 찾음
- I형: 내면 성찰·혼자만의 공간 조언
- S형: 구체적이고 단계별 행동 조언
- N형: 숨겨진 패턴·의미·가능성 중심
- T형: 논리적 원인 분석, 객관화
- F형: 감정의 흐름, 마음이 진짜 원하는 것
- J형: 명확한 방향과 다음 한 걸음
- P형: 열린 가능성, 흐름에 맡기기

## 역방향 카드
"이 카드가 뒤집혀 나온 건 우연이 아니에요"로 시작. 억압된 에너지, 외면해온 진실.

## 문체
- "~입니다", "~됩니다" 절대 금지
- "~잖아요", "~거든요", "~이에요" 사용
- 첫 문장은 카드 이미지 묘사로 시작
- 각 문단 사이에 반드시 \\n\\n 사용
- ✦ 지금 당신에게: 앞에도 반드시 \\n\\n 붙이기

한국어로 답하며, 아래 JSON 형식으로만 응답하세요:
{"card1":"해석 300자 이상. \\n\\n으로 문단 구분. \\n\\n✦ 지금 당신에게: [구체적 한 가지]","card2":"같은 방식 300자 이상. \\n\\n✦ 지금 당신에게: [구체적 한 가지]","card3":"같은 방식 300자 이상. \\n\\n✦ 지금 당신에게: [구체적 한 가지]","overall":"500자 이상. \\n\\n으로 문단 구분. 핵심 통찰 + MBTI 함정 + 따뜻한 응원"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `MBTI: ${mbti} (${traits})\n\n[사연]\n${question}\n\n[리딩 방식]\n${spreadName}\n\n[카드]\n${cardDesc}` }]
      })
    });
    if (!response.ok) { const e = await response.text(); return res.status(response.status).json({ error: e }); }
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
    let reading;
    try { reading = JSON.parse(raw); } catch { return res.status(500).json({ error: 'JSON 파싱 실패' }); }
    return res.status(200).json({ reading });
  } catch (error) {
    return res.status(500).json({ error: '서버 오류' });
  }
}
