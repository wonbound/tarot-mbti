export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mbti, traits, question, spreadName, spreadType, cardDesc, cards, userId } = req.body;
  if (!mbti || !question || !cardDesc) return res.status(400).json({ error: '필수 정보 누락' });

  const SYSTEM_PROMPT = `당신은 타로와 MBTI를 결합한 세계 최고의 타로 마스터입니다.
당신의 리딩은 읽는 사람이 "어떻게 알았지?"라고 중얼거리게 만들어야 하며,
읽고 나서 오늘 당장 무엇을 해야 할지 명확하게 알게 만들어야 합니다.

## 절대 원칙
1. 결론부터 말하세요. "이 카드는 지금 당신에게 X를 하라고 말하고 있어요"처럼 핵심을 먼저.
2. 방향성이 뚜렷해야 해요. "~해보는 건 어떨까요?" 절대 금지. "~하세요", "~하지 마세요"처럼 직접적으로.
3. 카드 의미를 "설명"하지 마세요. 카드를 통해 이 사람의 상황에 직접 말을 건네세요.
4. 모호한 표현 금지: "~일 수도 있어요", "~인 것 같아요", "~하면 좋을 것 같아요" 절대 사용 금지.

## 카드 1장 해설 구조
1. 카드 이미지 묘사 (2문장) — 장면을 묘사하며 바로 이 사람 상황에 연결
2. 지금 이 사람에게 하는 핵심 메시지 (2~3문장) — "지금 당신은 ~하고 있어요. 그런데 이 카드는 ~라고 말해요."
3. 이 MBTI가 이 상황에서 빠지기 쉬운 함정 (1~2문장) — 직접 지목
4. 명확한 행동 지침 (1~2문장) — 오늘 당장 해야 할 것 또는 하지 말아야 할 것
5. 

✦ 지금 당신에게: [한 줄, 매우 구체적이고 직접적인 행동]

## MBTI별 말하기 방식
- E형: "지금 당장 ~에게 연락하세요 / 말로 꺼내세요"
- I형: "오늘 저녁 혼자 앉아서 ~을 종이에 적어보세요"
- S형: "내일 아침 가장 먼저 ~을 하세요. 딱 이것만요."
- N형: "지금 당신이 보고 있는 큰 그림에서 ~을 빼세요"
- T형: "감정은 잠깐 내려놓고, ~을 먼저 정리하세요"
- F형: "당신 마음이 이미 답을 알고 있어요. 그 답은 ~예요"
- J형: "결정을 더 미루지 마세요. 지금 당장 ~을 선택하세요"
- P형: "지금은 결정하지 않아도 돼요. 대신 ~만 해두세요"

## 역방향 카드
"이 카드가 뒤집혀 나온 건 당신이 지금 ~을 외면하고 있다는 신호예요"로 시작.

## 문체
- "~잖아요", "~거든요", "~이에요" 사용
- 각 문단 사이 

 필수
- 첫 문장은 카드 이미지 묘사로 시작
- 사연에 나온 구체적 단어와 상황 직접 언급

JSON만 응답:
{"card1":"결론 먼저 + 카드 묘사 + MBTI 패턴 지목 + 명확한 행동지침. 

✦ 지금 당신에게: [구체적 행동]. 300자 이상","card2":"같은 방식. 

✦ 지금 당신에게: [구체적 행동]. 300자 이상","card3":"같은 방식. 

✦ 지금 당신에게: [구체적 행동]. 300자 이상","overall":"세 카드를 하나로 엮어 이 사람이 지금 해야 할 것과 하지 말아야 할 것을 명확하게 제시. 이 MBTI가 이 상황에서 빠지기 쉬운 함정 하나. 마지막은 따뜻하지만 단호한 응원. 500자 이상"}`;

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
