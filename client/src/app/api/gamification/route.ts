import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_GAMIFICATION_CONFIG, GamificationConfig, GameReward } from '@/types/gamification';
import { isValidAdminToken } from '@/utils/adminAuthServer';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = 'https://bhjfsthxmzqumajquyvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fvqOImRG-8kMsfQxln9WMw_JmBmCmNy';

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

// Global in-memory fallback for serverless
let inMemoryConfig: GamificationConfig = { ...DEFAULT_GAMIFICATION_CONFIG };
const inMemoryHistory = new Map<string, { lastPlayedAt: number; wonReward: any }>();

async function getStoredConfig(): Promise<GamificationConfig> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.gamification_config&select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].value) {
        const parsed = JSON.parse(data[0].value);
        inMemoryConfig = { ...DEFAULT_GAMIFICATION_CONFIG, ...parsed };
        return inMemoryConfig;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch gamification_config from Supabase, using fallback');
  }
  return inMemoryConfig;
}

async function saveStoredConfig(newConfig: GamificationConfig): Promise<boolean> {
  inMemoryConfig = { ...newConfig, updatedAt: new Date().toISOString() };
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        key: 'gamification_config',
        value: JSON.stringify(inMemoryConfig)
      })
    });
    return true;
  } catch (e) {
    console.error('Failed to save gamification_config to Supabase:', e);
    return false;
  }
}

async function getUserPlayHistory(phone: string): Promise<{ lastPlayedAt: number; wonReward: any } | null> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  if (!cleanPhone) return null;

  // Check memory first
  if (inMemoryHistory.has(cleanPhone)) {
    return inMemoryHistory.get(cleanPhone)!;
  }

  // Check Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.game_hist_${cleanPhone}&select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].value) {
        const hist = JSON.parse(data[0].value);
        inMemoryHistory.set(cleanPhone, hist);
        return hist;
      }
    }
  } catch (e) {}

  return null;
}

async function recordUserPlay(phone: string, wonReward: any): Promise<void> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  if (!cleanPhone) return;

  const record = {
    lastPlayedAt: Date.now(),
    wonReward
  };

  inMemoryHistory.set(cleanPhone, record);

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        key: `game_hist_${cleanPhone}`,
        value: JSON.stringify(record)
      })
    });
  } catch (e) {}
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const config = await getStoredConfig();

  let userStatus = {
    canPlay: true,
    nextPlayAt: null as string | null,
    lastWon: null as any
  };

  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    const hist = await getUserPlayHistory(cleanPhone);
    if (hist && hist.lastPlayedAt) {
      const cooldownMs = (config.cooldownHours || 24) * 60 * 60 * 1000;
      const timeSincePlay = Date.now() - hist.lastPlayedAt;
      if (timeSincePlay < cooldownMs) {
        userStatus.canPlay = false;
        userStatus.nextPlayAt = new Date(hist.lastPlayedAt + cooldownMs).toISOString();
        userStatus.lastWon = hist.wonReward;
      }
    }
  }

  // Public config hides secret probability weights so users cannot inspect client data
  const sanitizedRewards = config.rewards.map(r => ({
    id: r.id,
    label: r.label,
    type: r.type,
    color: r.color,
    textColor: r.textColor,
    description: r.description
  }));

  return NextResponse.json({
    success: true,
    isEnabled: config.isEnabled,
    activeGame: config.activeGame,
    targetAudience: config.targetAudience,
    ineligibilityMessage: config.ineligibilityMessage,
    title: config.title,
    subtitle: config.subtitle,
    rewards: sanitizedRewards,
    userStatus
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ==========================================
    // 1. ADMIN ACTIONS (Token Protected)
    // ==========================================
    if (action === 'admin-get') {
      const authHeader = req.headers.get('authorization');
      if (!isValidAdminToken(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
      }
      const config = await getStoredConfig();
      return NextResponse.json({ success: true, config });
    }

    if (action === 'admin-save') {
      const authHeader = req.headers.get('authorization');
      if (!isValidAdminToken(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
      }
      const { config } = body;
      if (!config) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
      }
      await saveStoredConfig(config);
      return NextResponse.json({ success: true, message: 'Game configuration saved successfully', config });
    }

    // ==========================================
    // 2. CUSTOMER PLAY ACTION
    // ==========================================
    if (action === 'play') {
      const { phone, gender, userName, gameType } = body;

      if (!phone) {
        return NextResponse.json({ success: false, error: 'Mobile number is required to play' }, { status: 400 });
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ success: false, error: 'Valid 10-digit mobile number required' }, { status: 400 });
      }

      const config = await getStoredConfig();

      if (!config.isEnabled) {
        return NextResponse.json({ success: false, error: 'Lucky games are currently paused. Please check back soon!' }, { status: 403 });
      }

      // 1. GENDER ELIGIBILITY VERIFICATION
      const userGender = (gender || 'other').toLowerCase();
      const target = (config.targetAudience || 'all').toLowerCase();

      let isEligible = true;
      if (target === 'female' && userGender !== 'female') {
        isEligible = false;
      } else if (target === 'male' && userGender !== 'male') {
        isEligible = false;
      } else if (target === 'female_other' && userGender !== 'female' && userGender !== 'other') {
        isEligible = false;
      } else if (target === 'other' && userGender !== 'other') {
        isEligible = false;
      }

      if (!isEligible) {
        return NextResponse.json({
          success: false,
          eligible: false,
          ineligibilityMessage: config.ineligibilityMessage || 'This exclusive lucky reward is reserved for special category customers.'
        });
      }

      // 2. 24-HOUR COOLDOWN VERIFICATION
      const hist = await getUserPlayHistory(cleanPhone);
      const cooldownMs = (config.cooldownHours || 24) * 60 * 60 * 1000;
      if (hist && hist.lastPlayedAt && (Date.now() - hist.lastPlayedAt < cooldownMs)) {
        const nextPlayAt = new Date(hist.lastPlayedAt + cooldownMs).toISOString();
        return NextResponse.json({
          success: false,
          alreadyPlayed: true,
          eligible: true,
          nextPlayAt,
          lastWonReward: hist.wonReward,
          error: 'You have already played today! Please come back tomorrow for another chance.'
        });
      }

      // 3. DETERMINE WINNING REWARD
      let wonReward: GameReward;

      // Forced Winner Override by Admin
      if (config.forcedWinnerId) {
        const forced = config.rewards.find(r => r.id === config.forcedWinnerId);
        wonReward = forced || config.rewards[0];
      } else {
        // Weighted Probability Random Selection
        const totalWeight = config.rewards.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
        let randomNum = Math.random() * (totalWeight > 0 ? totalWeight : 100);

        let cumulative = 0;
        let selectedReward = config.rewards[0];

        for (const reward of config.rewards) {
          cumulative += Number(reward.weight) || 0;
          if (randomNum <= cumulative) {
            selectedReward = reward;
            break;
          }
        }
        wonReward = selectedReward;
      }

      const sliceIndex = config.rewards.findIndex(r => r.id === wonReward.id);

      // 4. RECORD PLAY HISTORY
      await recordUserPlay(cleanPhone, wonReward);

      return NextResponse.json({
        success: true,
        eligible: true,
        sliceIndex: sliceIndex >= 0 ? sliceIndex : 0,
        wonReward: {
          id: wonReward.id,
          label: wonReward.label,
          type: wonReward.type,
          value: wonReward.value,
          minOrder: wonReward.minOrder,
          couponCode: wonReward.couponCode,
          description: wonReward.description,
          color: wonReward.color
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Gamification API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
