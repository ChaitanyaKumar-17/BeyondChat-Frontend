export const PROFANITY_LIST = [
  'fuck','shit','ass','bitch','damn','dick','bastard','crap','piss',
  'cock','pussy','cunt','whore','slut','fag','nigger','nigga',
  'retard','douche','wanker','twat','bollocks','arse','bugger',
  'bloody','motherfucker','asshole','bullshit','goddamn','dammit',
  'dumbass','jackass','dipshit','shithead','dickhead','bitchass',
  'fucker','fucking','fucked','shitty','crappy','pissy','dicked',
  'prick','screw you','stfu','gtfo','lmfao','wtf','af',
  'suck my','blow me','eat shit','go to hell',
  'porn','xxx','nude','naked','sex','penis','vagina','boob','tits',
  'hentai','orgasm','fetish','erotic','kinky','dildo','viagra',
  'kill yourself','kys','die','suicide','rape','molest',
  'nazi','kkk','terrorist','bomb threat','shoot up',
];

// Normalize leet-speak: @ ? a, $ ? s, 0 ? o, 1 ? i, 3 ? e, etc.
export const normalizeLeet = (str) => {
  return str
    .replace(/@/g, 'a').replace(/\$/g, 's').replace(/0/g, 'o')
    .replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a')
    .replace(/5/g, 's').replace(/7/g, 't').replace(/8/g, 'b')
    .replace(/\|/g, 'l').replace(/!/g, 'i').replace(/\+/g, 't')
    .replace(/[_\-.*]+/g, ''); // Strip separators used to bypass filters
};

export const containsProfanity = (text, opts = {}) => {
  if (!text || typeof text !== 'string') return false;
  const { leetDetection = true, customBlocklist = [] } = opts;
  const lower = text.toLowerCase().trim();
  const normalized = leetDetection ? normalizeLeet(lower) : lower;
  // Check custom blocklist (substring match)
  for (const cw of customBlocklist) {
    if (cw && normalized.includes(cw.toLowerCase())) return true;
  }
  // Check built-in list — full phrases first
  for (const word of PROFANITY_LIST) {
    if (word.includes(' ')) {
      if (normalized.includes(word)) return true;
    }
  }
  // Word-boundary check for single words
  const words = normalized.split(/[\s,.\-!?;:'"()\[\]{}]+/).filter(Boolean);
  for (const w of words) {
    for (const bad of PROFANITY_LIST) {
      if (!bad.includes(' ') && (w === bad || w.includes(bad))) return true;
    }
  }
  return false;
};

export const sanitizeText = (text, opts = {}) => {
  if (!text) return text;
  const { leetDetection = true, customBlocklist = [] } = opts;
  let result = text;
  const lower = leetDetection ? normalizeLeet(text.toLowerCase()) : text.toLowerCase();
  // Mask custom blocked words
  for (const cw of customBlocklist) {
    if (!cw) continue;
    const escaped = cw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    result = result.replace(re, m => '*'.repeat(m.length));
  }
  // Mask built-in profanity
  for (const word of PROFANITY_LIST) {
    const idx = lower.indexOf(word);
    if (idx !== -1) {
      const stars = '*'.repeat(word.length);
      result = result.substring(0, idx) + stars + result.substring(idx + word.length);
    }
  }
  return result;
};

