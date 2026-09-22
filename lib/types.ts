export type Tab = "home" | "us" | "plans" | "memories" | "profile" | "cycle";

export type ActivityType = "status" | "poke" | "daily" | "challenge" | "event" | "memory";

export type ActivityReaction = {
  userId: string;
  reaction: string;
};

export type ActivityReply = {
  id: string;
  authorId: string;
  body: string;
  updatedAt: string;
};

export type ActivityItem = {
  id: string;
  actorId: string;
  type: ActivityType;
  payload: Record<string, string | boolean | null>;
  createdAt: string;
  reactions: ActivityReaction[];
  replies: ActivityReply[];
};

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
  createdBy?: string;
  title: string;
  day: number;
  month: string;
  time: string;
  daysLeft: number;
  reminder: string;
  startsAt?: string;
  isPast?: boolean;
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

export type DailyAnswer = {
  id: string;
  userId: string;
  answer: string;
  reaction: string | null;
  createdAt: string;
};

export type PokeKind = "hug" | "kiss" | "miss_you" | "thinking_of_you" | "date_tonight";

export type CouplePoke = {
  id: string;
  senderId: string;
  kind: PokeKind;
  message: string;
  seenAt: string | null;
  createdAt: string;
};

export type ChallengeDeck = "general" | "adult";
export type ChallengeState = "accepted" | "completed" | "skipped";

export type ChallengeResponse = {
  id: string;
  userId: string;
  challengeKey: string;
  deck: ChallengeDeck;
  state: ChallengeState;
  updatedAt: string;
};

export type FunPreferences = {
  viewerAdultEnabled: boolean;
  partnerAdultEnabled: boolean;
  bothAdultsConfirmed: boolean;
  adultDeckUnlocked: boolean;
  viewerIntimacyEnabled: boolean;
  partnerIntimacyEnabled: boolean;
  intimacyUnlocked: boolean;
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
