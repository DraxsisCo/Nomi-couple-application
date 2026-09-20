export type Tab = "home" | "calendar" | "cycle" | "diary" | "settings";

export type MoodState = {
  emoji: string;
  label: string;
};

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
  senderId?: string;
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
  authorId: string;
  authorName: string;
  reply?: string;
  replyAuthorName?: string;
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
