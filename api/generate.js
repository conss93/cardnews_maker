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
    const { mode } = req.body;

    if (mode === "idea") {
      return await handleIdeaMode(req, res);
    }

    return await handleContentMode(req, res);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

async function handleIdeaMode(req, res) {
  const {
    rawIdea,
    brand,
    categoryHint,
    extraPrompt,
  } = req.body;

  const prompt = `
너는 '${brand || "청새치웹"}'의 콘텐츠 기획자다.

사용자가 입력한 거친 아이디어를 바탕으로 구글 시트 콘텐츠 DB에 바로 저장할 수 있는 형태로 정리해라.

[사용자 아이디어]
${rawIdea || ""}

[카테고리 힌트]
${categoryHint || "없음"}

[AI 추가 요청사항]
${extraPrompt || "없음"}

[작성 방향]
- 사용자의 거친 아이디어를 더 매력적인 콘텐츠 주제로 다듬어라.
- 제목은 너무 길지 않게, 카드뉴스/인스타/블로그/스레드로 확장 가능한 형태로 작성하라.
- 핵심메시지는 한 문장으로 분명하게 작성하라.
- 근거는 3개를 제안하라.
- 반드시 포함할 내용은 쉼표로 구분하라.
- 금지내용은 이 콘텐츠에서 벗어나지 않도록 피해야 할 방향을 쉼표로 구분하라.
- 메모는 ${brand || "청새치웹"} 관점에서 어떤 식으로 다루면 좋을지 간단히 작성하라.
- 카테고리는 사용자가 준 힌트를 우선하되, 없으면 주제에 맞게 짧게 정하라.

[출력 형식]
아래 JSON 객체만 출력한다.

{
  "category": "카테고리",
  "topic": "다듬은 주제",
  "coreMessage": "핵심메시지",
  "evidence1": "근거1",
  "evidence2": "근거2",
  "evidence3": "근거3",
  "requiredKeywords": "반드시 포함할 내용",
  "forbiddenTopics": "금지내용",
  "memo": "메모"
}

[중요]
- 설명문을 붙이지 마라.
- 마크다운 코드블록을 쓰지 마라.
- 반드시 JSON만 출력하라.
`;

  const response = await client.responses.create({
    model: "gpt-5",
    input: prompt,
  });

  return res.status(200).json({
    result: response.output_text,
  });
}

async function handleContentMode(req, res) {
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
    contentLength,
    customLength,
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
    contentLength,
    customLength,
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
- 분량: ${ctx.contentLength || "AI 추천"}
- 직접 입력 분량: ${ctx.customLength || "없음"}

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

  if (ctx.contentType === "카드뉴스") return base + cardNewsPrompt(ctx);
  if (ctx.contentType === "인스타설명글") return base + instagramPrompt(ctx);
  if (ctx.contentType === "블로그") return base + blogPrompt(ctx);
  if (ctx.contentType === "스레드") return base + threadPrompt(ctx);

  return base + cardNewsPrompt(ctx);
}

function lengthGuide(ctx, type) {
  const value = ctx.contentLength || "AI 추천";
  const custom = ctx.customLength || "";

  if (value === "직접 입력" && custom) {
    return `사용자가 직접 입력한 분량 기준을 따른다: ${custom}`;
  }

  if (type === "카드뉴스") {
    if (value === "짧게") return "총 5장으로 작성한다.";
    if (value === "보통") return "총 7장으로 작성한다.";
    if (value === "길게") return "총 9~10장으로 작성한다.";
    return "AI가 주제에 맞춰 5~9장 사이에서 적절히 정한다.";
  }

  if (type === "스레드") {
    if (value === "짧게") return "총 4~5개 포스트로 작성한다.";
    if (value === "보통") return "총 5~7개 포스트로 작성한다.";
    if (value === "길게") return "총 8~10개 포스트로 작성한다.";
    return "AI가 주제에 맞춰 5~8개 포스트 사이에서 적절히 정한다.";
  }

  if (type === "인스타설명글") {
    if (value === "짧게") return "짧고 간결한 캡션으로 작성한다.";
    if (value === "보통") return "중간 길이의 캡션으로 작성한다.";
    if (value === "길게") return "다소 긴 캡션이더라도 문단을 짧게 나눠 읽기 쉽게 작성한다.";
    return "AI가 주제와 목표에 맞춰 적절한 길이로 작성한다.";
  }

  if (type === "블로그") {
    if (value === "짧게") return "짧은 블로그 초안으로 작성한다.";
    if (value === "보통") return "중간 길이의 블로그 초안으로 작성한다.";
    if (value === "길게") return "충분히 자세한 블로그 초안으로 작성한다.";
    return "AI가 검색 의도와 주제에 맞춰 적절한 길이로 작성한다.";
  }

  return "AI가 적절한 분량으로 작성한다.";
}

function cardNewsPrompt(ctx) {
  return `
[카드뉴스 작성 방향]
카드뉴스는 "저장하고 싶은 정보"가 핵심이다.
독자가 읽고 "아, 이해됐다"라고 느껴야 한다.

[분량 기준]
${lengthGuide(ctx, "카드뉴스")}

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

function instagramPrompt(ctx) {
  return `
[인스타 설명글 작성 방향]
인스타 설명글은 "공감"과 "공유"가 핵심이다.
독자가 "나도 그런데?" 또는 "이거 누구한테 보내야겠다"라고 느끼게 써라.

[분량 기준]
${lengthGuide(ctx, "인스타설명글")}

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

function blogPrompt(ctx) {
  return `
[블로그 작성 방향]
블로그는 "검색 의도 해결"이 핵심이다.
독자가 검색해서 들어왔을 때 빠르게 답을 얻고, 끝까지 읽을 이유가 있어야 한다.

[분량 기준]
${lengthGuide(ctx, "블로그")}

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

function threadPrompt(ctx) {
  return `
[스레드 작성 방향]
스레드는 "관점"과 "대화"가 핵심이다.
정보를 정리하는 글이 아니라, 한 사람의 생각 흐름이 보여야 한다.

[분량 기준]
${lengthGuide(ctx, "스레드")}

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
