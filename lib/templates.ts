/**
 * Templates de prompt — versão TS dos templates da skill copyminer-fé.
 * Fonte de verdade: batch-v9-extend.js + character-jesus-reference.md
 */

export const CHARACTER_BASE =
  'A Middle Eastern man in his early 30s with long wavy dark brown hair past his shoulders, ' +
  'thick dense natural dark beard with visible individual coarse hairs, ' +
  'amber-hazel eyes with intense penetrating gaze, ' +
  'weathered tan skin with visible pores wrinkles and natural imperfections, ' +
  'wearing a simple natural linen V-neck shirt slightly open at the chest. ' +
  'Raw photorealistic skin texture, no airbrushing, no smooth skin, no plastic look, ' +
  'no bokeh, no lens flare, no glow effects. Film grain texture.';

export const EMOCOES = [
  { key: 'compassivo', label: 'Compassivo', prompt: 'deep compassion, brow slightly furrowed, eyes carrying weight of understanding' },
  { key: 'autoritario', label: 'Autoritário', prompt: 'intense penetrating gaze, slight forward lean' },
  { key: 'confiante', label: 'Confiante', prompt: 'warm confident certainty, slight nod' },
  { key: 'encorajador', label: 'Encorajador', prompt: 'earnest and encouraging, slight lean forward' },
  { key: 'misterioso', label: 'Misterioso', prompt: 'mysterious knowing expression, slight smile' },
  { key: 'acolhedor', label: 'Acolhedor', prompt: 'tender strength, hands opening in welcoming gesture' },
  { key: 'misericordioso', label: 'Misericordioso', prompt: 'gentle knowing smile, eyes full of understanding' },
  { key: 'urgente', label: 'Urgente', prompt: 'urgent sincere expression, slight forward lean' },
  { key: 'empatico', label: 'Empático', prompt: 'understanding expression, brow slightly lifted in compassion' },
  { key: 'paternal', label: 'Paternal', prompt: 'paternal proud warmth, eyes moist with love' },
  { key: 'contemplativo', label: 'Contemplativo', prompt: 'serene contemplative warmth' },
  { key: 'revelatorio', label: 'Revelatório', prompt: 'revealing warmth, a secret being shared' },
] as const;

export const ILUMINACOES = [
  { key: 'rembrandt-esquerda', label: 'Rembrandt (lateral esquerda)', prompt: 'Dramatic Rembrandt side lighting from the left creating deep shadows on the right side of his face' },
  { key: 'golden-hour', label: 'Golden hour', prompt: 'Warm golden hour lighting, soft directional light, late afternoon glow' },
  { key: 'lamparina', label: 'Lamparina noturna', prompt: 'Warm lamp light from below, deep shadows around, night ambient' },
  { key: 'amanhecer', label: 'Amanhecer', prompt: 'Cool dawn light from above, soft pastel sky, early morning haze' },
  { key: 'vela-unica', label: 'Vela única', prompt: 'Single candle light, intimate close shadows, soft flicker' },
  { key: 'estrelado', label: 'Céu estrelado', prompt: 'Deep blue night ambient with starlight, very low contrast' },
] as const;

export const CENARIOS = [
  { key: 'tenda', label: 'Tenda escura (default)', prompt: 'dark muted textured background like fabric or tent material' },
  { key: 'fogueira', label: 'Junto a fogueira à noite', prompt: 'sitting by a small campfire at night, embers in foreground out of focus' },
  { key: 'colina', label: 'Colina ao amanhecer', prompt: 'on a hillside at dawn, distant rolling landscape in background' },
  { key: 'sala-pedra', label: 'Sala de pedra com mesa', prompt: 'inside a small stone room with a wooden table and lamparina' },
  { key: 'portico-chuva', label: 'Pórtico de pedra com chuva', prompt: 'under a stone portico during light rain, wet stones in background' },
  { key: 'beira-mar', label: 'Beira-mar ao pôr do sol', prompt: 'by the seaside at sunset, calm waves out of focus behind him' },
  { key: 'oliveiras', label: 'Entre oliveiras', prompt: 'among olive trees with dappled light filtering through branches' },
  { key: 'rio-floresta', label: 'Junto a rio na floresta', prompt: 'crouched near a forest river, soft moss and stones around' },
  { key: 'deserto-noite', label: 'Deserto à noite', prompt: 'under a starry desert sky at night, deep silence around' },
  { key: 'quarto-vela', label: 'Quarto com vela', prompt: 'small dark room with a single candle on a wooden surface' },
] as const;

export const ANGULOS = [
  { key: 'frontal', label: 'Frontal (chest up)', prompt: 'Close-up portrait framing from chest up, looking directly at camera' },
  { key: 'tres-quartos', label: '3⁄4 perfil', prompt: 'Three-quarter portrait angle, slight body turn, eyes meeting camera' },
  { key: 'baixo', label: 'Levemente de baixo', prompt: 'Slightly low angle from below, conveying authority and stature' },
] as const;

export type EmocaoKey = typeof EMOCOES[number]['key'];
export type IluminacaoKey = typeof ILUMINACOES[number]['key'];
export type CenarioKey = typeof CENARIOS[number]['key'];
export type AnguloKey = typeof ANGULOS[number]['key'];

/**
 * Prompt P1 (image-to-video Veo) — usa análise da imagem se fornecida,
 * caindo no CHARACTER_BASE como fallback.
 */
export type ImageAnalysis = {
  roupa?: string;
  expressao?: string;
  angulo?: string;
  iluminacao?: string;
  cenario?: string;
  emocao?: string;
  idade_aparente?: string;
  etnia?: string;
  atributos_extras?: string[];
};

export function buildP1Prompt(analysis: ImageAnalysis | null, fala: string): string {
  const charDesc = analysis
    ? [
        analysis.etnia,
        analysis.idade_aparente,
        analysis.roupa ? `wearing ${analysis.roupa}` : null,
        analysis.expressao ? `expression: ${analysis.expressao}` : null,
      ].filter(Boolean).join(', ')
    : CHARACTER_BASE;
  const lighting = analysis?.iluminacao || 'natural lighting from the reference image';
  const scene = analysis?.cenario || 'same environment as the reference image';

  return (
    `Realistic movements. The man from the reference image (${charDesc}; ${lighting}; ${scene}) ` +
    `looks directly at camera and speaks continuously throughout the full 8 seconds with no silent gaps, ` +
    `in Brazilian Portuguese (São Paulo / Rio de Janeiro accent, NOT European Portuguese, NOT Lisbon accent), ` +
    `perfect lip sync, deep paternal compassionate male voice, slow Brazilian cadence, ` +
    `saying: ${fala} NO subtitles, NO captions, NO text overlay.`
  );
}

/**
 * Prompt Extend (Consistency Lock) — versão validada por MK 2026-05-12 com aspas duplas no `saying:`.
 */
export function buildExtendPrompt(analysis: ImageAnalysis | null, fala: string): string {
  const charLock = analysis
    ? `Same ${analysis.etnia || '8K character'} model, same ${analysis.roupa || 'wardrobe'}, ` +
      `same ${analysis.iluminacao || 'lighting'}, same ${analysis.cenario || 'environment'}, no changes to features.`
    : 'Same 8K character model, 35mm lens bokeh, golden hour lighting, same environment, no changes to features.';

  return (
    `Realistic movements. The man from the reference image continues exactly from the last frame. ` +
    `${charLock} ` +
    `He looks directly at camera and speaks continuously throughout the full 8 seconds with no silent gaps, ` +
    `in Brazilian Portuguese (São Paulo / Rio de Janeiro accent, NOT European Portuguese), ` +
    `perfect lip sync, deep paternal compassionate male voice, slow Brazilian cadence, ` +
    `saying: "${fala}" NO subtitles, NO captions, NO text overlay.`
  );
}

/**
 * Prompt Nanobana (criar nova imagem MONTE no Nano Banana Pro do Flow).
 */
export function buildMontePrompt(params: {
  emocaoKey: EmocaoKey;
  iluminacaoKey: IluminacaoKey;
  cenarioKey: CenarioKey;
  anguloKey: AnguloKey;
  extras?: string;
}): string {
  const emocao = EMOCOES.find(e => e.key === params.emocaoKey)!;
  const ilum = ILUMINACOES.find(i => i.key === params.iluminacaoKey)!;
  const cen = CENARIOS.find(c => c.key === params.cenarioKey)!;
  const ang = ANGULOS.find(a => a.key === params.anguloKey)!;

  const extras = params.extras?.trim() ? ` ${params.extras.trim()}` : '';

  return (
    `${CHARACTER_BASE} ${ang.prompt}. ${ilum.prompt}, ${cen.prompt}. ` +
    `Expression: ${emocao.prompt}.${extras} ` +
    `9:16 vertical aspect ratio. Raw photorealistic skin, film grain, no airbrushing, no bokeh, no glow. ` +
    `ABSOLUTELY NO text, NO subtitles, NO watermark, NO on-screen text whatsoever. Clean frame.`
  );
}
