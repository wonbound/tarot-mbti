export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mbti, traits, question, spreadName, spreadType, cardDesc, cards, userId } = req.body;
  if (!mbti || !question || !cardDesc) return res.status(400).json({ error: '필수 정보 누락' });

  const SYSTEM_PROMPT = `당신은 타로와 MBTI를 결합한 세계 최고의 타로 마스터입니다.
당신의 리딩은 읽는 사람이 화면 앞에서 눈물이 나거나, 소름이 돋거나, "어떻게 알았지?"라고 중얼거리게 만들어야 합니다.

## 절대 원칙
카드 의미를 "설명"하지 마세요. 카드를 통해 이 사람의 마음속에 있는 말을 대신 꺼내주세요.
"이 카드는 ~를 의미합니다" 같은 문장은 절대 쓰지 마세요.
타로 선생님이 아니라, 이 사람을 오래 지켜본 통찰력 있는 친구처럼 말하세요.

## 카드 1장 해설 구조
1. 카드 이미지 묘사로 시작 — 장면을 생생하게 묘사하며 이 사람의 상황과 연결
2. 이 MBTI가 이 상황에서 하고 있는 패턴 직접 지목 — "당신 지금 이러고 있지 않나요?"
3. 카드가 진짜 하고 싶은 말 — 솔직하지만 필요한 통찰
4. \n\n✦ 지금 당신에게: [아주 구체적인 한 가지 행동]

## MBTI별 접근
- E형: 관계·행동·표현 중심 / I형: 내면 성찰·혼자 정리 중심
- S형: 지금 당장 할 수 있는 구체적 행동 / N형: 숨겨진 패턴·의미·가능성
- T형: 논리적 원인 분석·객관화 / F형: 감정의 흐름·마음이 진짜 원하는 것
- J형: 명확한 방향·다음 한 걸음 / P형: 열린 가능성·흐름에 맡기기

## 역방향: "이 카드가 뒤집혀 나온 건 우연이 아니에요"로 시작
## 문체: ~잖아요, ~거든요, ~이에요 / 각 문단 사이 \n\n 필수

JSON만 응답:
{"card1":"300자 이상. \n\n✦ 지금 당신에게: [구체적]","card2":"300자 이상. \n\n✦ 지금 당신에게: [구체적]","card3":"300자 이상. \n\n✦ 지금 당신에게: [구체적]","overall":"500자 이상. 핵심통찰 + MBTI 함정 + 따뜻한 응원"}`;

  try {
    // 1. AI 리딩 생성
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!aiRes.ok) { const e = await aiRes.text(); return res.status(aiRes.status).json({ error: e }); }
    const aiData = await aiRes.json();
    const raw = aiData.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
    let reading;
    try { reading = JSON.parse(raw); } catch { return res.status(500).json({ error: 'JSON 파싱 실패' }); }

    // 2. Supabase에 기록 저장
    try {
      const c = cards || [];
      await fetch(`https://yzsecqofsobjorpgprda.supabase.co/rest/v1/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_4x3rOkG9m_SJ3who294dMw_FJ0ig2ZX',
          'Authorization': 'Bearer sb_publishable_4x3rOkG9m_SJ3who294dMw_FJ0ig2ZX',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          mbti,
          spread_type: spreadType || 'time',
          spread_name: spreadName,
          question,
          card1_name: c[0]?.name || '',
          card1_reversed: c[0]?.rev || false,
          card2_name: c[1]?.name || '',
          card2_reversed: c[1]?.rev || false,
          card3_name: c[2]?.name || '',
          card3_reversed: c[2]?.rev || false,
          reading_card1: reading.card1,
          reading_card2: reading.card2,
          reading_card3: reading.card3,
          reading_overall: reading.overall,
          user_id: userId || null,
        })
      });
    } catch (dbErr) {
      console.error('DB 저장 실패 (리딩은 정상):', dbErr);
      // DB 실패해도 리딩은 정상 반환
    }

    return res.status(200).json({ reading });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '서버 오류' });
  }
}
