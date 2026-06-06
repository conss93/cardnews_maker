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
      topic,
      category,
      tag,
      framework,
      target,
      goal,
      tone,
      brand,
    } = req.body;

    const prompt = `
너는 인스타 카드뉴스 전문 기획자다.

아래 정보를 바탕으로 7장짜리 카드뉴스 문구를 작성해라.

[입력 정보]
- 브랜드: ${brand || "청새치웹"}
- 카테고리: ${category || "웹사이트"}
- 주제: ${topic}
- 태그: ${tag || "없음"}
- 구조: ${framework || "PAS"}
- 타겟: ${target || "소상공인, 1인 사업자"}
- 목적: ${goal || "상담 문의"}
- 톤: ${tone || "친근하지만 구조적으로 설명"}

[작성 조건]
- 한국어
- 인스타 카드뉴스용
- 총 7장
- title, body를 가진 JSON 배열만 출력
- title은 짧고 강하게
- body는 1~2문장
- 너무 광고스럽지 않게
- 과장 표현 금지
- 구조, 흐름, 전환 관점을 자연스럽게 반영
- 마지막 장에는 부드러운 CTA 포함
`;

    const response = await client.responses.create({
      model: "gpt-5.5-mini",
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
