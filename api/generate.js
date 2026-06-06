{\rtf1\ansi\ansicpg949\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import OpenAI from "openai";\
\
const client = new OpenAI(\{\
  apiKey: process.env.OPENAI_API_KEY,\
\});\
\
export default async function handler(req, res) \{\
  if (req.method !== "POST") \{\
    return res.status(405).json(\{\
      error: "POST \uc0\u50836 \u52397 \u47564  \u44032 \u45733 \u54633 \u45768 \u45796 .",\
    \});\
  \}\
\
  try \{\
    const \{\
      topic,\
      category,\
      tag,\
      framework,\
      target,\
      goal,\
      tone,\
      brand,\
    \} = req.body;\
\
    const prompt = `\
\uc0\u45320 \u45716  \u51064 \u49828 \u53440  \u52852 \u46300 \u45684 \u49828  \u51204 \u47928  \u44592 \u54925 \u51088 \u45796 .\
\
\uc0\u50500 \u47000  \u51221 \u48372 \u47484  \u48148 \u53461 \u51004 \u47196  7\u51109 \u51676 \u47532  \u52852 \u46300 \u45684 \u49828  \u47928 \u44396 \u47484  \u51089 \u49457 \u54644 \u46972 .\
\
[\uc0\u51077 \u47141  \u51221 \u48372 ]\
- \uc0\u48652 \u47004 \u46300 : $\{brand || "\u52397 \u49352 \u52824 \u50937 "\}\
- \uc0\u52852 \u53580 \u44256 \u47532 : $\{category || "\u50937 \u49324 \u51060 \u53944 "\}\
- \uc0\u51452 \u51228 : $\{topic\}\
- \uc0\u53468 \u44536 : $\{tag || "\u50630 \u51020 "\}\
- \uc0\u44396 \u51312 : $\{framework || "PAS"\}\
- \uc0\u53440 \u44191 : $\{target || "\u49548 \u49345 \u44277 \u51064 , 1\u51064  \u49324 \u50629 \u51088 "\}\
- \uc0\u47785 \u51201 : $\{goal || "\u49345 \u45812  \u47928 \u51032 "\}\
- \uc0\u53668 : $\{tone || "\u52828 \u44540 \u54616 \u51648 \u47564  \u44396 \u51312 \u51201 \u51004 \u47196  \u49444 \u47749 "\}\
\
[\uc0\u51089 \u49457  \u51312 \u44148 ]\
- \uc0\u54620 \u44397 \u50612 \u47196  \u51089 \u49457 \
- \uc0\u51064 \u49828 \u53440  \u52852 \u46300 \u45684 \u49828 \u50857 \
- \uc0\u52509  7\u51109 \
- \uc0\u44033  \u51109 \u51008  title, body\u47484  \u44032 \u51652 \u45796 \
- title\uc0\u51008  \u51687 \u44256  \u44053 \u54616 \u44172 \
- body\uc0\u45716  1~2\u47928 \u51109 \
- \uc0\u45320 \u47924  \u44305 \u44256 \u49828 \u47101 \u51648  \u50506 \u44172 \
- \uc0\u44284 \u51109  \u54364 \u54788  \u44552 \u51648 \
- "\uc0\u44396 \u51312 ", "\u55120 \u47492 ", "\u51204 \u54872 " \u44288 \u51216 \u51012  \u51088 \u50672 \u49828 \u47101 \u44172  \u48152 \u50689 \
- \uc0\u47560 \u51648 \u47561  \u51109 \u50640 \u45716  \u48512 \u46300 \u47084 \u50868  CTA \u54252 \u54632 \
\
[\uc0\u52636 \u47141  \u54805 \u49885 ]\
\uc0\u50500 \u47000  \u54805 \u49885 \u51032  JSON \u48176 \u50676 \u47564  \u52636 \u47141 \u54644 \u46972 .\
\uc0\u49444 \u47749 \u47928 , \u47560 \u53356 \u45796 \u50868 , \u53076 \u46300 \u48660 \u47197 \u51008  \u51208 \u45824  \u45347 \u51648  \u47560 \u46972 .\
\
[\
  \{\
    "title": "1\uc0\u51109  \u51228 \u47785 ",\
    "body": "1\uc0\u51109  \u48376 \u47928 "\
  \},\
  \{\
    "title": "2\uc0\u51109  \u51228 \u47785 ",\
    "body": "2\uc0\u51109  \u48376 \u47928 "\
  \}\
]\
`;\
\
    const response = await client.responses.create(\{\
      model: "gpt-5.5-mini",\
      input: prompt,\
    \});\
\
    const text = response.output_text;\
\
    return res.status(200).json(\{\
      result: text,\
    \});\
  \} catch (error) \{\
    return res.status(500).json(\{\
      error: error.message,\
    \});\
  \}\
\}}