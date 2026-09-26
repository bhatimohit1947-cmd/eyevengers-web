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
let inMemoryRegistry: any[] = [];

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

  if (inMemoryHistory.has(cleanPhone)) {
    return inMemoryHistory.get(cleanPhone)!;
  }

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

// Master Gamification Plays Registry
async function getGamificationPlaysRegistry(): Promise<any[]> {
  let plays: any[] = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=eq.gamification_plays_registry&select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].value) {
        plays = JSON.parse(data[0].value);
      }
    }
  } catch (e) {}

  if (!Array.isArray(plays) || plays.length === 0) {
    plays = inMemoryRegistry;
  }

  // Cross-check redemption status with Supabase referral_vouchers
  try {
    const vRes = await fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers?id=like.GAME-%25&select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    if (vRes.ok) {
      const vRows = await vRes.json();
      if (Array.isArray(vRows) && vRows.length > 0) {
        const vMap = new Map();
        vRows.forEach((r: any) => vMap.set(r.id, r));

        let hasUpdates = false;
        plays = plays.map((p: any) => {
          const matched = vMap.get(p.id);
          if (matched && matched.status === 'CLAIMED' && p.status !== 'CLAIMED') {
            hasUpdates = true;
            return {
              ...p,
              status: 'CLAIMED',
              claimedAt: matched.claimed_at,
              claimedStore: matched.claimed_store,
              claimedStaff: matched.claimed_by_staff,
              invoiceNo: matched.invoice_no
            };
          }
          return p;
        });

        if (hasUpdates) {
          saveGamificationPlaysRegistry(plays);
        }
      }
    }
  } catch (e) {}

  // Auto-scan all game_hist_* records to ensure zero data loss
  try {
    const ghRes = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?key=like.game_hist_%25&select=*`, {
      headers: supabaseHeaders,
      cache: 'no-store'
    });
    if (ghRes.ok) {
      const ghRows = await ghRes.json();
      if (Array.isArray(ghRows) && ghRows.length > 0) {
        // Fetch customers to resolve names
        let customerMap = new Map();
        try {
          const cRes = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*`, { headers: supabaseHeaders, cache: 'no-store' });
          if (cRes.ok) {
            const cList = await cRes.json();
            if (Array.isArray(cList)) {
              cList.forEach((c: any) => {
                const p = (c.phone || '').replace(/[^0-9]/g, '').slice(-10);
                if (p) customerMap.set(p, c);
              });
            }
          }
        } catch (e) {}

        let hasNewPlays = false;
        const existingPhones = new Set(plays.map(p => p.phone));

        for (const row of ghRows) {
          const phone = row.key.replace('game_hist_', '').slice(-10);
          if (phone && !existingPhones.has(phone)) {
            try {
              const data = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
              const won = data?.wonReward;
              if (won) {
                hasNewPlays = true;
                const cust = customerMap.get(phone);
                const playRecord = {
                  id: `GAME-${phone}-${String(data.lastPlayedAt || Date.now()).slice(-6)}`,
                  phone,
                  userName: cust?.name || 'Customer',
                  gender: cust?.gender || 'other',
                  gameType: 'wheel',
                  rewardId: won.id,
                  rewardLabel: won.label,
                  rewardType: won.type,
                  rewardValue: won.value,
                  minOrder: won.minOrder || 0,
                  couponCode: won.couponCode || '',
                  status: won.couponCode ? 'ACTIVE' : 'TRY_AGAIN',
                  playedAt: new Date(data.lastPlayedAt || Date.now()).toISOString(),
                  claimedAt: null,
                  claimedChannel: null,
                  claimedStore: null,
                  claimedStaff: null,
                  invoiceNo: null
                };
                plays.push(playRecord);
                existingPhones.add(phone);

                if (won.couponCode) {
                  fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers`, {
                    method: 'POST',
                    headers: supabaseHeaders,
                    body: JSON.stringify({
                      id: playRecord.id,
                      code: won.couponCode.toUpperCase(),
                      referrer_phone: phone,
                      referrer_name: `${cust?.name || 'Customer'} (Lucky Wheel)`,
                      referred_phone: phone,
                      referred_name: won.label,
                      benefit_type: won.type,
                      benefit_value: won.value,
                      benefit_title: won.label,
                      status: 'ACTIVE',
                      issued_at: playRecord.playedAt,
                      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })
                  }).catch(() => {});
                }
              }
            } catch (e) {}
          }
        }

        if (hasNewPlays) {
          saveGamificationPlaysRegistry(plays);
        }
      }
    }
  } catch (e) {}

  return plays.sort((a, b) => new Date(b.playedAt || 0).getTime() - new Date(a.playedAt || 0).getTime());
}

async function saveGamificationPlaysRegistry(plays: any[]): Promise<void> {
  inMemoryRegistry = plays;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/global_settings`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        key: 'gamification_plays_registry',
        value: JSON.stringify(plays.slice(0, 1000)) // Keep recent 1000 plays
      })
    });
  } catch (e) {}
}

async function recordUserPlay(
  phone: string, 
  wonReward: any, 
  meta: { userName?: string; gender?: string; gameType?: string }
): Promise<any> {
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  if (!cleanPhone) return null;

  const playRecord = {
    id: `GAME-${cleanPhone}-${Date.now().toString().slice(-6)}`,
    phone: cleanPhone,
    userName: meta.userName || 'Member',
    gender: meta.gender || 'other',
    gameType: meta.gameType || 'wheel',
    rewardId: wonReward.id,
    rewardLabel: wonReward.label,
    rewardType: wonReward.type,
    rewardValue: wonReward.value,
    minOrder: wonReward.minOrder || 0,
    couponCode: wonReward.couponCode || '',
    status: wonReward.couponCode ? 'ACTIVE' : 'TRY_AGAIN',
    playedAt: new Date().toISOString(),
    claimedAt: null,
    claimedChannel: null,
    claimedStore: null,
    claimedStaff: null,
    invoiceNo: null
  };

  // 1. Update individual user history (for 24h cooldown)
  const record = {
    lastPlayedAt: Date.now(),
    wonReward: {
      ...wonReward,
      id: playRecord.id,
      status: playRecord.status
    }
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

  // 2. If coupon won, also record to referral_vouchers for physical store redemption
  if (wonReward.couponCode) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          id: playRecord.id,
          code: wonReward.couponCode.toUpperCase(),
          referrer_phone: cleanPhone,
          referrer_name: `${meta.userName || 'Customer'} (${meta.gameType === 'mystery_box' ? 'Mystery Box' : 'Wheel'})`,
          referred_phone: cleanPhone,
          referred_name: wonReward.label,
          benefit_type: wonReward.type,
          benefit_value: wonReward.value,
          benefit_title: wonReward.label,
          status: 'ACTIVE',
          issued_at: playRecord.playedAt,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    } catch (e) {
      console.warn('Failed to insert game voucher into referral_vouchers:', e);
    }
  }

  // 3. Update master registry
  try {
    const existing = await getGamificationPlaysRegistry();
    const updated = [playRecord, ...existing.filter(p => p.id !== playRecord.id)];
    await saveGamificationPlaysRegistry(updated);
  } catch (e) {}

  return playRecord;
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
    const authHeader = req.headers.get('authorization');
    const referer = req.headers.get('referer') || '';
    const isAdmin = isValidAdminToken(authHeader) || referer.includes('/admin');

    // ==========================================
    // 1. ADMIN ACTIONS
    // ==========================================
    if (action === 'admin-get') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
      }
      const config = await getStoredConfig();
      return NextResponse.json({ success: true, config });
    }

    if (action === 'admin-save') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
      }
      const { config } = body;
      if (!config) {
        return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
      }
      await saveStoredConfig(config);
      return NextResponse.json({ success: true, message: 'Game configuration saved successfully', config });
    }

    if (action === 'admin-get-players') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
      }
      const players = await getGamificationPlaysRegistry();
      const totalCoupons = players.filter(p => p.couponCode).length;
      const activeCoupons = players.filter(p => p.couponCode && p.status === 'ACTIVE').length;
      const redeemedCoupons = players.filter(p => p.couponCode && p.status === 'CLAIMED').length;

      return NextResponse.json({
        success: true,
        stats: {
          totalPlays: players.length,
          totalCoupons,
          activeCoupons,
          redeemedCoupons
        },
        players
      });
    }

    if (action === 'admin-redeem-coupon') {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
      }
      const { playId, couponCode, storeLocation, staffName, invoiceNo } = body;
      const players = await getGamificationPlaysRegistry();
      const updated = players.map(p => {
        if (p.id === playId || (couponCode && p.couponCode === couponCode)) {
          return {
            ...p,
            status: 'CLAIMED',
            claimedAt: new Date().toISOString(),
            claimedChannel: 'STORE',
            claimedStore: storeLocation || 'Eyevengers Store',
            claimedStaff: staffName || 'Store Manager',
            invoiceNo: invoiceNo || `INV-${Date.now().toString().slice(-6)}`
          };
        }
        return p;
      });

      await saveGamificationPlaysRegistry(updated);

      // Also update in referral_vouchers
      if (playId || couponCode) {
        try {
          const filter = playId ? `id=eq.${encodeURIComponent(playId)}` : `code=eq.${encodeURIComponent(couponCode)}`;
          await fetch(`${SUPABASE_URL}/rest/v1/referral_vouchers?${filter}`, {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify({
              status: 'CLAIMED',
              claimed_at: new Date().toISOString(),
              claimed_channel: 'STORE',
              claimed_store: storeLocation || 'Eyevengers Store',
              claimed_by_staff: staffName || 'Store Manager',
              invoice_no: invoiceNo || `INV-${Date.now().toString().slice(-6)}`
            })
          });
        } catch (e) {}
      }

      return NextResponse.json({ success: true, message: 'Game coupon redeemed successfully' });
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

      if (config.forcedWinnerId) {
        const forced = config.rewards.find(r => r.id === config.forcedWinnerId);
        wonReward = forced || config.rewards[0];
      } else {
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

      // 4. RECORD PLAY HISTORY & GENERATE STORE-REDEEMABLE VOUCHER
      const playRecord = await recordUserPlay(cleanPhone, wonReward, {
        userName: userName || 'Valued Member',
        gender: userGender,
        gameType: gameType || 'wheel'
      });

      return NextResponse.json({
        success: true,
        eligible: true,
        sliceIndex: sliceIndex >= 0 ? sliceIndex : 0,
        wonReward: {
          id: playRecord?.id || wonReward.id,
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
