export type GameType = 'wheel' | 'mystery_box' | 'both';
export type TargetAudience = 'all' | 'female' | 'male' | 'female_other' | 'other';

export interface GameReward {
  id: string;
  label: string;
  type: 'FLAT_DISCOUNT' | 'PERCENT_DISCOUNT' | 'FREE_LENS' | 'FREE_FRAME' | 'TRY_AGAIN';
  value: number;
  minOrder: number;
  couponCode: string;
  weight: number; // Probability weight
  color: string;
  textColor: string;
  description?: string;
}

export interface GamificationConfig {
  isEnabled: boolean;
  activeGame: GameType;
  targetAudience: TargetAudience;
  ineligibilityMessage: string;
  title: string;
  subtitle: string;
  forcedWinnerId: string; // Empty string for normal weighted mode, or specific reward id to force win
  rewards: GameReward[];
  cooldownHours: number;
  updatedAt?: string;
}

export interface PlayHistoryItem {
  phone: string;
  userName?: string;
  gender: string;
  playedAt: string;
  rewardId: string;
  rewardLabel: string;
  couponCode: string;
  gameType: 'wheel' | 'mystery_box';
}

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  isEnabled: true,
  activeGame: 'both',
  targetAudience: 'all',
  ineligibilityMessage: "Oops! Yeh exclusive lucky reward abhi sirf Female & Other category ke users ke liye active hai. Aapke liye naye offers jald hi aayenge! Tab tak hamari latest collections explore karein.",
  title: "Lucky Spin & Mystery Rewards",
  subtitle: "Daily Exclusive Lucky Draw for Eyevengers Members",
  forcedWinnerId: "",
  cooldownHours: 24,
  rewards: [
    {
      id: "rew-1",
      label: "₹150 OFF",
      type: "FLAT_DISCOUNT",
      value: 150,
      minOrder: 799,
      couponCode: "LUCKY150",
      weight: 35,
      color: "#004777",
      textColor: "#ffffff",
      description: "Flat ₹150 OFF on orders above ₹799"
    },
    {
      id: "rew-2",
      label: "₹300 OFF",
      type: "FLAT_DISCOUNT",
      value: 300,
      minOrder: 1199,
      couponCode: "MEGA300",
      weight: 25,
      color: "#D4AF37",
      textColor: "#000000",
      description: "Flat ₹300 OFF on orders above ₹1199"
    },
    {
      id: "rew-3",
      label: "20% OFF",
      type: "PERCENT_DISCOUNT",
      value: 20,
      minOrder: 999,
      couponCode: "FESTIVE20",
      weight: 15,
      color: "#0A1128",
      textColor: "#ffffff",
      description: "Flat 20% OFF on all eyeglasses and sunglasses"
    },
    {
      id: "rew-4",
      label: "Free Anti-Glare Lens",
      type: "FREE_LENS",
      value: 100,
      minOrder: 999,
      couponCode: "FREELENS",
      weight: 15,
      color: "#16a34a",
      textColor: "#ffffff",
      description: "Get 100% Free Anti-Glare Coating on your lenses"
    },
    {
      id: "rew-5",
      label: "₹500 Jackpot",
      type: "FLAT_DISCOUNT",
      value: 500,
      minOrder: 1999,
      couponCode: "JACKPOT500",
      weight: 5,
      color: "#dc2626",
      textColor: "#ffffff",
      description: "Mega Jackpot: Flat ₹500 OFF on premium frames"
    },
    {
      id: "rew-6",
      label: "Try Tomorrow",
      type: "TRY_AGAIN",
      value: 0,
      minOrder: 0,
      couponCode: "",
      weight: 5,
      color: "#64748b",
      textColor: "#ffffff",
      description: "Better luck next time! Try again in 24 hours"
    }
  ]
};
