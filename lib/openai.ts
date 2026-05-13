import OpenAI from 'openai';
import type { ImageAnalysis } from './templates';

let _client: OpenAI | null = null;
function client() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

// ============ ANÁLISE VISUAL ============
const ANALYSIS_PROMPT = `Você é um analista visual especializado em fotografia humana pra geração de vídeo lipsync (Veo).

Analise a imagem de UM homem (avatar do "Pai" no nicho religioso/cristão) e retorne JSON estruturado com:
- roupa: descrição da peça(s) visível (em inglês, ex: "natural linen V-neck shirt, slightly open at chest")
- expressao: expressão facial atual em inglês
- angulo: enquadramento da câmera
- iluminacao: caracterização da luz
- cenario: descrição do fundo/ambiente
- emocao: emoção dominante (compassionate, authoritative, encouraging, etc)
- idade_aparente: faixa etária
- etnia: descrição étnica visível
- atributos_extras: array de detalhes visuais notáveis

Saída SÓ em JSON válido, sem markdown.`;

export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  const resp = await client().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ANALYSIS_PROMPT },
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
  try { return JSON.parse(content) as ImageAnalysis; }
  catch { return {}; }
}

// ============ NANOBANA FREEFORM ============
const MONTE_FREEFORM_SYSTEM = `Você gera prompts em INGLÊS pro Nano Banana Pro (gerador de imagem do Flow) criando fotos de "O Pai" (avatar Jesus paternal/cristão) pro nicho copyminer-fé.

Receberá uma ideia em PT-BR (cenário, iluminação, emoção, qualquer combinação). Transforme num prompt visual rico em inglês.

REGRAS ABSOLUTAS:
1. Sempre incluir o CHARACTER_BASE: "A Middle Eastern man in his early 30s with long wavy dark brown hair past his shoulders, thick dense natural dark beard with visible individual coarse hairs, amber-hazel eyes with intense penetrating gaze, weathered tan skin with visible pores wrinkles and natural imperfections, wearing a simple natural linen V-neck shirt slightly open at the chest. Raw photorealistic skin texture, no airbrushing, no smooth skin, no plastic look, no bokeh, no lens flare, no glow effects. Film grain texture."
2. Adicionar enquadramento (close-up / 3/4 / etc), iluminação detalhada, cenário com texturas, expressão.
3. SEMPRE terminar com: "9:16 vertical aspect ratio. Raw photorealistic skin, film grain, no airbrushing, no bokeh, no glow. ABSOLUTELY NO text, NO subtitles, NO watermark, NO on-screen text whatsoever. Clean frame."
4. NÃO usar gatilhos do Veo: nada de "blood", "weapon", "naked", "fire+house". Manter realista e seguro.
5. Saída: SÓ o prompt em inglês, sem markdown, sem comentários, sem explicação.`;

export async function generateMonteFreeform(idea: string): Promise<string> {
  const resp = await client().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: MONTE_FREEFORM_SYSTEM },
      { role: 'user', content: `Ideia em PT-BR: ${idea}\n\nGere o prompt completo em inglês.` },
    ],
    temperature: 0.8,
    max_tokens: 600,
  });
  return (resp.choices[0]?.message?.content || '').trim();
}

// ============ GERAÇÃO DE COPY (P1+P2) ============
export type GeneratedCopy = {
  tema: string;
  formato: string;
  p1_copy: string;
  p2_copy: string;
};

const COPY_SYSTEM = `Você gera copies pro nicho copyminer-fé (vídeos lipsync curtos de 16s do "Pai" — Deus em forma paternal — falando direto pra câmera).

REGRAS ABSOLUTAS:
1. P1 (parte 1, 8s): ~16-17 palavras. Validação invisível ("Eu vi/Eu sei/Conheço") + presença + abertura. Sem pausa.
2. P2 (parte 2, 8s, EXTEND): ~16-17 palavras. CONTINUAÇÃO do P1 (NÃO repete), entrega profecia/resposta + CTA obrigatório no final ("Comenta amém" ou "Digita Amém").
3. Voz: 1ª pessoa do Pai falando com o filho/a. Tom paternal compassivo, cadência lenta brasileira.
4. Tu/você: usar "tu" ou "você" consistente dentro do mesmo vídeo. Prefira "tu" (mais íntimo).
5. NUNCA usar palavras-gatilho do Veo: "adolescente"+sofrimento, "criança"+dor extrema, "morte", "suicídio", "fogo"+casa. Usar "jovem", "luta silenciosa", etc.
6. Fala fluida, contínua, conversada. Nada de "pause" ou "espera um momento" no meio.

FORMATOS (use o pedido):
- bencao_pessoal: validação invisível + profecia ("Eu vi que tu chorou ontem. Tua vitória chega essa semana. Comenta amém.")
- curiosidade_revelada: "Tem uma coisa que ninguém te contou…" → P2 revela
- pergunta_paternal: "Você acha que Eu te abandonei?" → P2 responde
- lista_profetica: "Tem 3 coisas que Eu tô fazendo agora…" → P2 lista
- negacao_amorosa: "Para de [X]. Eu cuido." → P2 oferece alternativa
- identificacao_inversa: "Quando tu [gesto pequeno], Eu [resposta]" → P2 confirma recompensa

Saída SÓ em JSON: {"tema": "tema-curto-3-palavras", "p1_copy": "…", "p2_copy": "…"}.`;

export async function generateCopy(
  analysis: ImageAnalysis,
  formato: string,
  avoid: string[] = [],
): Promise<GeneratedCopy> {
  const userMsg = `Gera 1 copy nova pra esse vídeo.

Formato pedido: ${formato}

Análise da imagem (use a emoção + cenário pra contextualizar):
${JSON.stringify(analysis, null, 2)}

Copies recentes pra EVITAR repetir (temas/frases parecidas):
${avoid.slice(0, 30).map((c, i) => `${i+1}. ${c}`).join('\n')}

Gera copy fresca, original, no formato pedido. Saída SÓ JSON.`;

  const resp = await client().chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: COPY_SYSTEM },
      { role: 'user', content: userMsg },
    ],
    temperature: 0.95,
    max_tokens: 500,
  });
  const content = resp.choices[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(content);
    return {
      tema: parsed.tema || 'sem tema',
      formato,
      p1_copy: parsed.p1_copy || '',
      p2_copy: parsed.p2_copy || '',
    };
  } catch {
    return { tema: '', formato, p1_copy: '', p2_copy: '' };
  }
}
