import OpenAI from 'openai';
import type { ImageAnalysis } from './templates';

let _client: OpenAI | null = null;
function client() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const SYSTEM_PROMPT = `Você é um analista visual especializado em fotografia humana pra geração de vídeo lipsync (Veo).

Analise a imagem de UM homem (avatar do "Pai" no nicho religioso/cristão) e retorne JSON estruturado com:
- roupa: descrição da peça(s) visível (em inglês, terso, ex: "natural linen V-neck shirt, slightly open at chest")
- expressao: expressão facial atual em inglês (ex: "warm contemplative smile, eyes soft")
- angulo: enquadramento da câmera (ex: "Close-up portrait framing from chest up, looking slightly to the side")
- iluminacao: caracterização da luz (ex: "Rembrandt side lighting from the left, warm tone")
- cenario: descrição do fundo/ambiente (ex: "dark muted textured background like fabric or tent material")
- emocao: emoção dominante transmitida (ex: "compassionate", "authoritative", "encouraging")
- idade_aparente: faixa etária (ex: "early 30s", "mid 30s")
- etnia: descrição étnica visível (ex: "Middle Eastern", "Latino")
- atributos_extras: array de detalhes visuais notáveis (cabelo, barba, pele, acessórios), ex: ["long wavy dark brown hair past shoulders", "thick dense natural dark beard", "weathered tan skin with visible pores"]

Importante:
- Saída SÓ em JSON válido, sem markdown, sem comentários.
- Descrições em inglês curtas e precisas (serão injetadas em prompt do Veo).
- Não inventar detalhes que não estão visíveis na imagem.
- Se algo não for visível, omitir o campo ou usar string vazia.`;

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const resp = await client().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analise essa imagem do "Pai" e retorne o JSON estruturado.' },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 800,
  });
  const content = resp.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(content) as ImageAnalysis;
  } catch {
    return {};
  }
}
