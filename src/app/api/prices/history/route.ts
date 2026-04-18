import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0;

// ── Local pricing data — mirrors price_data.py exactly ─────────────────────
// Used as fallback when the Python worker hasn't populated price_logs yet.
const PRICING_DATA = [
  { time: "12:00 AM", demand: 9.6, supply: 8.6, pbase: 5.12 },
  { time: "12:30 AM", demand: 9.4, supply: 9.0, pbase: 4.76 },
  { time: "1:00 AM", demand: 9.8, supply: 8.9, pbase: 5.00 },
  { time: "1:30 AM", demand: 10.1, supply: 8.9, pbase: 5.21 },
  { time: "2:00 AM", demand: 10.3, supply: 8.8, pbase: 5.37 },
  { time: "2:30 AM", demand: 10.4, supply: 8.6, pbase: 5.47 },
  { time: "3:00 AM", demand: 10.5, supply: 8.5, pbase: 5.50 },
  { time: "3:30 AM", demand: 10.4, supply: 8.4, pbase: 5.47 },
  { time: "4:00 AM", demand: 10.3, supply: 8.2, pbase: 5.37 },
  { time: "4:30 AM", demand: 10.1, supply: 8.1, pbase: 5.21 },
  { time: "5:00 AM", demand: 9.8, supply: 8.1, pbase: 5.00 },
  { time: "5:30 AM", demand: 9.4, supply: 8.0, pbase: 4.76 },
  { time: "6:00 AM", demand: 10.5, supply: 8.0, pbase: 5.50 },
  { time: "6:30 AM", demand: 11.0, supply: 10.5, pbase: 6.46 },
  { time: "7:00 AM", demand: 13.2, supply: 8.0, pbase: 8.04 },
  { time: "7:30 AM", demand: 12.0, supply: 15.5, pbase: 7.81 },
  { time: "8:00 AM", demand: 12.5, supply: 18.0, pbase: 8.00 },
  { time: "8:30 AM", demand: 13.0, supply: 20.5, pbase: 7.81 },
  { time: "9:00 AM", demand: 13.5, supply: 23.0, pbase: 7.27 },
  { time: "9:30 AM", demand: 14.0, supply: 25.5, pbase: 6.46 },
  { time: "10:00 AM", demand: 11.5, supply: 28.0, pbase: 2.50 },
  { time: "10:30 AM", demand: 12.1, supply: 29.3, pbase: 2.48 },
  { time: "11:00 AM", demand: 12.8, supply: 30.5, pbase: 2.43 },
  { time: "11:30 AM", demand: 13.3, supply: 31.5, pbase: 2.35 },
  { time: "12:00 PM", demand: 12.2, supply: 30.2, pbase: 2.38 },
  { time: "12:30 PM", demand: 13.9, supply: 32.8, pbase: 2.13 },
  { time: "1:00 PM", demand: 14.0, supply: 33.0, pbase: 2.00 },
  { time: "1:30 PM", demand: 13.9, supply: 32.8, pbase: 1.87 },
  { time: "2:00 PM", demand: 13.7, supply: 32.3, pbase: 1.75 },
  { time: "2:30 PM", demand: 13.3, supply: 31.5, pbase: 1.65 },
  { time: "3:00 PM", demand: 12.8, supply: 30.5, pbase: 1.57 },
  { time: "3:30 PM", demand: 12.1, supply: 29.3, pbase: 1.52 },
  { time: "4:00 PM", demand: 13.0, supply: 25.0, pbase: 2.50 },
  { time: "4:30 PM", demand: 13.6, supply: 22.5, pbase: 3.44 },
  { time: "5:00 PM", demand: 14.2, supply: 20.0, pbase: 4.38 },
  { time: "5:30 PM", demand: 14.9, supply: 17.5, pbase: 5.31 },
  { time: "6:00 PM", demand: 15.5, supply: 15.0, pbase: 6.25 },
  { time: "6:30 PM", demand: 16.1, supply: 12.5, pbase: 7.19 },
  { time: "7:00 PM", demand: 18.0, supply: 5.0, pbase: 10.00 },
  { time: "7:30 PM", demand: 17.4, supply: 7.5, pbase: 9.06 },
  { time: "8:00 PM", demand: 18.0, supply: 5.0, pbase: 10.00 },
  { time: "8:30 PM", demand: 16.9, supply: 5.5, pbase: 9.39 },
  { time: "9:00 PM", demand: 15.9, supply: 5.9, pbase: 8.78 },
  { time: "9:30 PM", demand: 14.8, supply: 6.3, pbase: 8.17 },
  { time: "10:00 PM", demand: 13.8, supply: 6.8, pbase: 7.56 },
  { time: "10:30 PM", demand: 12.8, supply: 7.2, pbase: 6.95 },
  { time: "11:00 PM", demand: 11.7, supply: 7.7, pbase: 6.34 },
  { time: "11:30 PM", demand: 10.6, supply: 8.2, pbase: 5.73 },
];

/**
 * Compute price from local data — mirrors price_data.py formula exactly:
 *   price = pbase + (demand / supply) + 0.5
 *   clamped to [0, 15]
 */
function computeLocalPrice(index: number): { price: number; demand: number; supply: number } {
  const row = PRICING_DATA[index];
  const d = row.demand;
  const s = row.supply;
  const pb = row.pbase;

  let price = pb;
  if (s !== 0) {
    price = pb + d / s + 0.5;
  }
  price = Math.min(Math.max(price, 0), 15);
  price = Math.round(price * 100) / 100;

  return { price, demand: d, supply: s };
}

/**
 * GET /api/prices/history
 *
 * Returns the FULL 48-slot daily timeline for "View Deep Insights".
 * - Past slots → actual price from `price_logs` (falls back to local computation)
 * - Future slots → `pending: true` (rendered as "Coming Soon" in UI)
 * - Always returns exactly 48 entries, regardless of how many DB rows exist.
 */
export async function GET() {
  try {
    // ── Compute today's date in IST ───────────────────────────────────────
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = istNow.getFullYear();
    const month = String(istNow.getMonth() + 1).padStart(2, '0');
    const day = String(istNow.getDate()).padStart(2, '0');
    const todayIST = `${year}-${month}-${day}`; // e.g. "2026-04-19"

    // Current slot index in IST
    const currentSlotIndex = istNow.getHours() * 2 + (istNow.getMinutes() >= 30 ? 1 : 0);

    // ── Fetch all rows for today from price_logs ──────────────────────────
    let slotMap = new Map<number, { price: number; demand: number; supply: number }>();

    try {
      const { data: rows, error } = await supabase
        .from('price_logs')
        .select('slot_index, price, demand, supply')
        .eq('slot_date', todayIST)
        .order('slot_index', { ascending: true });

      if (error) {
        console.error('Supabase history error:', error);
      }

      if (rows) {
        for (const row of rows) {
          slotMap.set(row.slot_index, {
            price: Number(row.price),
            demand: Number(row.demand),
            supply: Number(row.supply),
          });
        }
      }
    } catch (dbErr) {
      console.warn('Supabase unreachable for history, using full local fallback:', dbErr);
    }

    // ── Generate full 48-slot grid ────────────────────────────────────────
    const pad = (n: number) => String(n).padStart(2, '0');
    const slots = [];

    for (let i = 0; i < 48; i++) {
      const startH = Math.floor(i / 2);
      const startM = (i % 2) * 30;
      const endH = Math.floor((i + 1) / 2);
      const endM = ((i + 1) % 2) * 30;
      const label = `${pad(startH)}:${pad(startM)}–${pad(endH % 24)}:${pad(endM)}`;

      const isFuture = i > currentSlotIndex;

      if (isFuture) {
        // Future slot — Coming Soon
        slots.push({
          label,
          slotIndex: i,
          price: null,
          demand: null,
          supply: null,
          pending: true,
        });
      } else {
        // Past or current slot — use DB data if available, else compute locally
        const dbRow = slotMap.get(i);
        if (dbRow) {
          slots.push({
            label,
            slotIndex: i,
            price: dbRow.price,
            demand: dbRow.demand,
            supply: dbRow.supply,
            pending: false,
          });
        } else {
          // No DB data — compute from local formula (same as Python worker)
          const local = computeLocalPrice(i);
          slots.push({
            label,
            slotIndex: i,
            price: local.price,
            demand: local.demand,
            supply: local.supply,
            pending: false,
            fallback: true, // flag so UI can optionally note this is computed locally
          });
        }
      }
    }

    return NextResponse.json({
      date: todayIST,
      currentSlotIndex,
      totalSlots: 48,
      slots,
    });
  } catch (err: unknown) {
    console.error('History API error:', err);
    return NextResponse.json({ slots: [], date: null, currentSlotIndex: -1, totalSlots: 48 }, { status: 200 });
  }
}
