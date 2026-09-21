import { ChallengeDeck, PokeKind } from "./types";

export type DailyPrompt = { id: string; text: string; emoji: string };
export type TinyChallenge = { id: string; text: string; emoji: string; deck: ChallengeDeck };

export const DAILY_PROMPTS: DailyPrompt[] = [
  { id: "tiny-favorite", emoji: "✨", text: "یه چیز کوچیک که این روزا از من خیلی دوست داری چیه؟" },
  { id: "repeat-day", emoji: "🔁", text: "اگه می‌شد یکی از روزهای دوتایی‌مون رو دوباره زندگی کنیم، کدوم بود؟" },
  { id: "secret-talent", emoji: "🎭", text: "فکر می‌کنی بامزه‌ترین استعداد پنهان من چیه؟" },
  { id: "dream-date", emoji: "🌙", text: "قرار رؤیایی‌مون با بودجه نامحدود کجا بود؟" },
  { id: "comfort", emoji: "🫶", text: "وقتی روز سختی دارم، چه کاری از تو بیشتر آرومم می‌کنه؟" },
  { id: "inside-joke", emoji: "😂", text: "کدوم شوخی خودمون هنوزم بی‌دلیل خنده‌داره؟" },
  { id: "future-home", emoji: "🏡", text: "یه جزئیات کوچیک از خونه‌ی آینده‌مون که تو ذهنت هست چیه؟" },
  { id: "first-impression", emoji: "👀", text: "اولین چیزی که باعث شد بیشتر دنبالم کنی چی بود؟" },
  { id: "soundtrack", emoji: "🎧", text: "اگه رابطه‌مون یه آهنگ بود، امروز کدوم آهنگ بود؟" },
  { id: "three-words", emoji: "💬", text: "حال‌وهوای این روزهای ما رو با سه کلمه بگو." },
  { id: "little-trip", emoji: "🧳", text: "برای یه سفر یه‌روزه، همین الان کجا می‌بردیم همدیگه رو؟" },
  { id: "proud", emoji: "🌱", text: "این اواخر بابت چه چیزی به من افتخار کردی؟" },
];

export const GENERAL_CHALLENGES: TinyChallenge[] = [
  { id: "voice-note", emoji: "🎙️", deck: "general", text: "یه ویس ۳۰ ثانیه‌ای بفرست و فقط از چیزی بگو که توی پارتنرت دوست داری." },
  { id: "meme-hunt", emoji: "😂", deck: "general", text: "یه میم پیدا کن که دقیقاً انرژی رابطه‌تون رو نشون بده." },
  { id: "photo-now", emoji: "📸", deck: "general", text: "همین الان بدون آماده‌سازی یه عکس واقعی از لحظه‌ت بفرست." },
  { id: "mini-date", emoji: "☕", deck: "general", text: "برای این هفته یه دیت ۳۰ دقیقه‌ای و کم‌هزینه بچینین." },
  { id: "old-memory", emoji: "🗂️", deck: "general", text: "یه عکس قدیمی دوتایی پیدا کن و بگو چرا هنوز دوستش داری." },
  { id: "song-drop", emoji: "🎵", deck: "general", text: "یه آهنگ برای مود امشبتون انتخاب و برای هم بفرستین." },
  { id: "specific-thanks", emoji: "💜", deck: "general", text: "برای یه کار خیلی مشخص که اخیراً انجام داده ازش تشکر کن." },
  { id: "no-phone", emoji: "📵", deck: "general", text: "امروز ۲۰ دقیقه گوشی‌ها کنار؛ فقط با هم حرف بزنین." },
  { id: "snack-surprise", emoji: "🍫", deck: "general", text: "خوراکی موردعلاقه‌ش رو بی‌خبر براش جور کن." },
  { id: "walk-talk", emoji: "🚶", deck: "general", text: "یه پیاده‌روی کوتاه برین و هر نفر یه آرزوی امسال رو بگه." },
];

export const ADULT_CHALLENGES: TinyChallenge[] = [
  { id: "flirty-line", emoji: "😏", deck: "adult", text: "یه جمله‌ی فلرتی بفرست که تا آخر روز توی ذهنش بمونه." },
  { id: "kiss-map", emoji: "💋", deck: "adult", text: "سه جای موردعلاقه‌ت برای بوسه رو به پارتنرت بگو." },
  { id: "tonight-wish", emoji: "🔥", deck: "adult", text: "یه خواسته‌ی صمیمی برای امشب بگو؛ جواب نه یا الان‌نه کاملاً اوکیه." },
  { id: "slow-date", emoji: "🕯️", deck: "adult", text: "برای امشب یه تایم بدون عجله و بدون گوشی هماهنگ کنین." },
  { id: "favorite-touch", emoji: "🫦", deck: "adult", text: "محبت فیزیکی موردعلاقه‌ت رو با یک پیام واضح و محترمانه بگو." },
  { id: "tease-note", emoji: "🔐", deck: "adult", text: "یه پیام شیطون ولی رضایت‌محور برای پارتنرت بنویس." },
];

export const POKES: { kind: PokeKind; emoji: string; label: string }[] = [
  { kind: "hug", emoji: "🫂", label: "یه بغل" },
  { kind: "kiss", emoji: "💋", label: "یه بوس" },
  { kind: "miss_you", emoji: "🥺", label: "دلم تنگه" },
  { kind: "thinking_of_you", emoji: "💭", label: "یادتم" },
  { kind: "date_tonight", emoji: "🌙", label: "دیت امشب؟" },
];

function stableIndex(seed: string, length: number) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % length;
}

export function dailyPrompt(coupleId: string, day: string) {
  return DAILY_PROMPTS[stableIndex(`prompt:v1:${coupleId}:${day}`, DAILY_PROMPTS.length)];
}

export function dailyChallenge(coupleId: string, day: string, deck: ChallengeDeck = "general") {
  const source = deck === "adult" ? ADULT_CHALLENGES : GENERAL_CHALLENGES;
  return source[stableIndex(`challenge:v1:${deck}:${coupleId}:${day}`, source.length)];
}

export function pokeDetails(kind: PokeKind) {
  return POKES.find((poke) => poke.kind === kind) ?? POKES[0];
}
