import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 가능합니다." });
  }

  try {
    const {
      id,
      category,
      topic,
      coreMessage,
      evidence1,
      evidence2,
      evidence3,
      requiredKeywords,
      forbiddenTopics,
      memo,
      extraPrompt,
      contentType,
      contentGoal,
      tone,
      framework,
      brand,
    } = req.body;

    const context = {
      id,
      category,
      topic,
      coreMessage,
      evidenceList: [evidence1, evidence2, evidence3]
        .filter(Boolean)
        .map((item, index) => `${index + 1}. ${item}`)
        .join("\n"),
      requiredKeywords,
      forbiddenTopics,
      memo,
      extraPrompt,
      contentType,
      contentGoal,
      tone,
      framework,
      brand: brand || "청새치웹",
    };

    const prompt = buildPrompt(context);

    const response = await client.responses.create({
      model: "gpt-5",
      input: prompt,
    });

    return res.status(200).json({
      result: response.output_text,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

function buildPrompt(ctx) {
  const base = `
너는 '${ctx.brand}'의 콘텐츠 기획자이자 카피라이터다.

[콘텐츠 정보]
- ID: ${ctx.id || ""}
- 카테고리: ${ctx.category || ""}
- 주제: ${ctx.topic || ""}
- 핵심메시지: ${ctx.coreMessage || ""}
- 근거:
${ctx.evidenceList || "없음"}
- 반드시 포함할 내용: ${ctx.requiredKeywords || "없음"}
- 피해야 할 내용: ${ctx.forbiddenTopics || "없음"}
- 메모: ${ctx.memo || "없음"}

[생성 옵션]
- 콘텐츠 유형: ${ctx.contentType || ""}
- 콘텐츠 목표: ${ctx.contentGoal || "알아서 해줘"}
- 톤: ${ctx.tone || "알아서 해줘"}
- 구조: ${ctx.framework || "알아서 해줘"}

[AI 추가 요청사항]
${ctx.extraPrompt || "없음"}

[공통 원칙]
- 한국어로 작성한다.
- 과장 표현은 피한다.
- 너무 광고스럽게 쓰지 않는다.
- 핵심메시지를 반드시 반영한다.
- 반드시 포함할 내용은 자연스럽게 반영한다.
- 피해야 할 내용은 언급하지 않는다.
- AI 추가 요청사항이 있으면 이번 생성 결과에 우선 반영한다.
- ${ctx.brand}의 관점은 "감각보다 구조", "예쁨보다 흐름", "전환을 만드는 설계"에 가깝다.
`;

  if (ctx.contentType === "카드뉴스") return base + cardNewsPrompt();
  if (ctx.contentType === "인스타설명글") return base + instagramPrompt();
  if (ctx.contentType === "블로그") return base + blogPrompt();
  if (ctx.contentType === "스레드") return base + threadPrompt();

  return base + cardNewsPrompt();
}

function cardNewsPrompt() {
  return `
[카드뉴스 작성 방향]
카드뉴스는 "저장하고 싶은 정보"가 핵심이다.
독자가 읽고 "아, 이해됐다"라고 느껴야 한다.

[중요 비중]
- 정보 전달: 매우 중요
- 핵심메시지: 매우 중요
- 근거: 중요
- 구조: 중요
- 톤: 보조
- 공감: 보조

[해야 할 것]
- 결론을 초반에 보여준다.
- 한 장에는 하나의 메시지만 담는다.
- 추상적인 말보다 구체적인 원인, 예시, 체크포인트를 쓴다.
- 각 장 제목은 짧고 강하게 쓴다.
- 본문은 1~2문장으로 제한한다.
- 저장하고 싶게 만드는 실용성을 넣는다.

[하지 말 것]
- "좋은 홈페이지를 만드세요" 같은 추상적 조언 금지.
- 한 장에 여러 내용을 몰아넣지 말 것.
- 결론을 마지막까지 숨기지 말 것.
- 블로그처럼 길게 설명하지 말 것.

[출력 형식]
JSON 배열만 출력한다.
총 7장.
각 요소는 title, body를 가진다.

예:
[
  {
    "title": "1장 제목",
    "body": "1장 본문"
  }
]

[중요]
설명문, 마크다운 코드블록 없이 JSON만 출력하라.
`;
}

function instagramPrompt() {
  return `
[인스타 설명글 작성 방향]
인스타 설명글은 "공감"과 "공유"가 핵심이다.
독자가 "나도 그런데?" 또는 "이거 누구한테 보내야겠다"라고 느끼게 써라.

[중요 비중]
- 공감: 매우 중요
- 톤: 매우 중요
- 콘텐츠 목표: 중요
- 정보: 보조
- 구조: 약하게만 반영
- 근거: 필요한 만큼만 사용

[해야 할 것]
- 첫 문장은 짧고 공감되게 쓴다.
- 너무 설명하려 하지 말고 자연스럽게 말한다.
- 정보는 적게, 감정과 통찰은 선명하게 쓴다.
- 문단을 짧게 나눈다.
- 마지막은 저장, 공유, 댓글, DM 중 콘텐츠 목표에 맞게 부드럽게 유도한다.
- 해시태그는 5~8개 정도로 쓴다.

[하지 말 것]
- 블로그처럼 장황하게 설명하지 말 것.
- 교훈을 주려는 말투 금지.
- 번호 목록을 남발하지 말 것.
- 전문 용어를 과하게 쓰지 말 것.
- "반드시 해야 합니다"처럼 강압적으로 쓰지 말 것.

[출력 형식]
아래 JSON 객체만 출력한다.

{
  "caption": "인스타 설명글 본문",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3"]
}

[중요]
설명문, 마크다운 코드블록 없이 JSON만 출력하라.
`;
}

function blogPrompt() {
  return `
[블로그 작성 방향]
블로그는 "검색 의도 해결"이 핵심이다.
독자가 검색해서 들어왔을 때 빠르게 답을 얻고, 끝까지 읽을 이유가 있어야 한다.

[중요 비중]
- 문제 해결: 매우 중요
- 검색 의도 충족: 매우 중요
- 구조: 매우 중요
- 근거: 중요
- 톤: 보조
- 공감: 보조

[해야 할 것]
- 도입부에서 바로 결론 또는 핵심 답을 제시한다.
- 왜 이런 문제가 생기는지 설명한다.
- 실제 상황에 적용할 수 있는 기준이나 방법을 제시한다.
- 소제목이 있는 글처럼 논리적으로 구성한다.
- 감상문이 아니라 문제 해결 글로 쓴다.
- 마지막에는 자연스럽게 정리하고 필요 시 부드러운 CTA를 넣는다.

[하지 말 것]
- 불필요한 인사말 금지.
- 서론을 길게 끌지 말 것.
- 키워드를 억지로 반복하지 말 것.
- 정보 없는 감상문처럼 쓰지 말 것.
- 결론을 마지막까지 숨기지 말 것.

[출력 형식]
아래 JSON 객체만 출력한다.

{
  "title": "블로그 제목",
  "intro": "도입부",
  "body": "본문",
  "conclusion": "마무리"
}

[중요]
설명문, 마크다운 코드블록 없이 JSON만 출력하라.
`;
}

function threadPrompt() {
  return `
[스레드 작성 방향]
스레드는 "관점"과 "대화"가 핵심이다.
정보를 정리하는 글이 아니라, 한 사람의 생각 흐름이 보여야 한다.

[중요 비중]
- 관점: 매우 중요
- 대화 유도: 매우 중요
- 톤: 매우 중요
- 정보: 보조
- 구조: 거의 무시해도 됨
- 근거: 자연스럽게 녹일 것

[해야 할 것]
- 첫 문장은 짧고 생각을 자극하게 쓴다.
- "내가 보기에", "해보니까", "생각보다" 같은 사람 냄새 나는 흐름을 살린다.
- 하나의 생각을 여러 포스트로 자연스럽게 이어간다.
- 정보보다 관찰, 통찰, 의견을 중심에 둔다.
- 마지막은 완전히 닫지 말고 대화의 여지를 남긴다.
- 답글이 달릴 수 있는 여운을 만든다.

[하지 말 것]
- 카드뉴스처럼 번호 목록만 나열하지 말 것.
- 블로그 요약본처럼 쓰지 말 것.
- 전문가 흉내 내는 말투 금지.
- "결론은 이것입니다. 감사합니다."처럼 닫아버리지 말 것.
- 너무 장황하게 쓰지 말 것.
- 각 포스트는 짧게 쓴다.

[출력 형식]
JSON 배열만 출력한다.
총 5~7개 포스트.
각 요소는 post를 가진다.

예:
[
  {
    "post": "1번째 스레드"
  }
]

[중요]
설명문, 마크다운 코드블록 없이 JSON만 출력하라.
`;
}
