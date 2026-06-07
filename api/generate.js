import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 가능합니다.",
    });
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

    const evidenceList = [evidence1, evidence2, evidence3]
      .filter(Boolean)
      .map((item, index) => `${index + 1}. ${item}`)
      .join("\n");

    const prompt = `
너는 '${brand || "청새치웹"}'의 콘텐츠 기획자이자 카피라이터다.

아래 콘텐츠 DB 정보와 생성 옵션을 바탕으로 사용자가 선택한 플랫폼에 맞는 게시물을 작성해라.

[콘텐츠 DB]
- ID: ${id || ""}
- 카테고리: ${category || ""}
- 주제: ${topic || ""}
- 핵심메시지: ${coreMessage || ""}
- 근거:
${evidenceList || "없음"}
- 반드시 포함할 내용/키워드: ${requiredKeywords || "없음"}
- 피해야 할 내용/키워드: ${forbiddenTopics || "없음"}
- 메모: ${memo || "없음"}

[생성 옵션]
- 브랜드: ${brand || "청새치웹"}
- 콘텐츠 유형: ${contentType || "카드뉴스"}
- 콘텐츠 목표: ${contentGoal || "브랜딩"}
- 톤: ${tone || "친근하지만 구조적으로 설명"}
- 구조: ${framework || "문제-원인-해결"}

[AI 추가 요청사항]
${extraPrompt || "없음"}

[공통 작성 원칙]
- 한국어로 작성한다.
- 과장 표현은 피한다.
- 너무 광고스럽게 쓰지 않는다.
- 핵심메시지를 반드시 반영한다.
- 반드시 포함할 내용/키워드는 자연스럽게 반영한다.
- 피해야 할 내용/키워드는 언급하지 않는다.
- AI 추가 요청사항이 있으면 이번 생성 결과에 우선적으로 반영한다.
- 청새치웹의 관점은 "감각보다 구조", "예쁨보다 흐름", "전환을 만드는 설계"에 가깝다.
- 사용자가 바로 복사해서 쓸 수 있게 작성한다.

[콘텐츠 유형별 출력 형식]

1) 콘텐츠 유형이 "카드뉴스"인 경우:
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

2) 콘텐츠 유형이 "인스타설명글"인 경우:
아래 JSON 객체만 출력한다.
{
  "caption": "인스타 설명글 본문",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3"]
}

3) 콘텐츠 유형이 "블로그"인 경우:
아래 JSON 객체만 출력한다.
{
  "title": "블로그 제목",
  "intro": "도입부",
  "body": "본문",
  "conclusion": "마무리"
}

4) 콘텐츠 유형이 "스레드"인 경우:
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
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
