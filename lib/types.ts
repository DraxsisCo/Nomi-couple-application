export type Tab = "home" | "calendar" | "cycle" | "diary" | "settings";

export type CycleState = {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  symptoms: string[];
  note: string;
  sharedWithPartner: boolean;
};

export type IntimacyState = {
  adultConfirmed: boolean;
  signal: string | null;
  emoji: string | null;
  message: string;
  sentAt: string | null;
  expiresAt: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  day: number;
  month: string;
  time: string;
  daysLeft: number;
  reminder: string;
  startsAt?: string;
};

export type MemoryItem = {
  id: string;
  title: string;
  body: string;
  date: string;
  emoji: string;
  reply?: string;
};

export const MOODS = [
  { emoji: "😊", label: "خوشحال" },
  { emoji: "🥰", label: "عاشق" },
  { emoji: "😌", label: "آروم" },
  { emoji: "😴", label: "خسته" },
  { emoji: "🥺", label: "دلتنگ" },
  { emoji: "😔", label: "غمگین" },
  { emoji: "🤩", label: "هیجان‌زده" },
  { emoji: "😵‍💫", label: "درگیر" },
] as const;

export const ACTIVITIES = ["مشغول کار", "در حال استراحت", "در مسیر", "آماده‌ی تماس", "مشغول درس", "وقت آزاد"];

export const INITIAL_EVENTS: EventItem[] = [
  { id: "e1", title: "قرار کافه‌ی همیشگی", day: 28, month: "شهریور", time: "ساعت ۱۸:۳۰", daysLeft: 2, reminder: "یک روز قبل" },
  { id: "e2", title: "سالگرد آشنایی‌مون", day: 8, month: "مهر", time: "تمام روز", daysLeft: 13, reminder: "یک هفته قبل" },
  { id: "e3", title: "سفر شمال", day: 18, month: "مهر", time: "ساعت ۶:۰۰", daysLeft: 23, reminder: "یک هفته قبل" },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  { id: "m1", title: "یک عصر بارونی", body: "همون کافه‌ی کوچیک و بوی قهوه؛ یکی از ساده‌ترین و قشنگ‌ترین عصرهامون بود.", date: "۲۳ شهریور ۱۴۰۵", emoji: "☕", reply: "من هنوز آهنگی که پخش می‌شد رو یادمه 🤍" },
  { id: "m2", title: "اولین سفر دونفره", body: "صبح زود راه افتادیم و تمام مسیر رو با آهنگ‌های قدیمی خوندیم. باید دوباره تکرارش کنیم!", date: "۱۲ مرداد ۱۴۰۵", emoji: "🌿", reply: "این بار من پلی‌لیست رو می‌سازم 😄" },
];
