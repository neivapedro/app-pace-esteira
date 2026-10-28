// Avisos falados (voz do iPhone em português) e bipes curtos.
// O iPhone só libera som depois de um toque: chame prepararAudio() dentro de um clique.

let voz: SpeechSynthesisVoice | null = null;
let audio: AudioContext | null = null;

function escolherVoz(): void {
  if (!('speechSynthesis' in window)) return;
  const vozes = speechSynthesis.getVoices();
  voz = vozes.find((v) => v.lang === 'pt-BR') ?? vozes.find((v) => v.lang.startsWith('pt')) ?? null;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  escolherVoz();
  speechSynthesis.addEventListener?.('voiceschanged', escolherVoz);
}

export function vozDisponivel(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function falar(texto: string): void {
  if (!vozDisponivel()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    if (voz) u.voice = voz;
    u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch {
    /* sem voz */
  }
}

export function calar(): void {
  if (vozDisponivel()) speechSynthesis.cancel();
}

/** Libera som e voz (precisa vir de um toque). */
export function prepararAudio(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audio && Ctx) audio = new Ctx();
    void audio?.resume();
  } catch {
    /* sem áudio */
  }
  if (vozDisponivel()) {
    // Uma fala vazia "destrava" a voz no iPhone
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

/** Bipe curto. `agudo` para o último da contagem. */
export function bipe(agudo = false): void {
  if (!audio) return;
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = 'sine';
    o.frequency.value = agudo ? 1320 : 880;
    const t = audio.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (agudo ? 0.35 : 0.15));
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + 0.4);
  } catch {
    /* sem áudio */
  }
}

/** "10,9" -> "10 vírgula 9" para a voz não ler como data ou milhar. */
export function lerNumero(texto: string): string {
  return texto.replace(',', ' vírgula ');
}

/** "4:30" -> "4 e 30" */
export function lerPace(texto: string): string {
  const [m, s] = texto.split(':');
  return s === '00' ? `${m} minutos` : `${m} e ${Number(s)}`;
}
