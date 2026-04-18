"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Action3DCard } from "../ui/Action3DCard";
import {
  BsArrowRepeat,
  BsThermometerHalf,
  BsLightningCharge,
  BsDroplet,
  BsTv,
  BsSnow,
  BsArrowRight,
} from "react-icons/bs";
import { getISTTime } from "@/utils/time";

// ── Pricing constants ──────────────────────────────────────────────────────────
/** Standard peak baseline (₹/unit). Reference point for the savings formula. */
const STANDARD_PEAK = 10;

/**
 * Appliance energy assumptions (kWh) — fixed per spec.
 * Refrigerator value reflects compressor optimization impact, not full draw.
 */
const APPLIANCE_USAGE: Record<string, number> = {
  washing_machine: 2,    // kWh
  ac:              1.5,  // kWh (1 hr)
  ev_charging:     8,    // kWh
  dishwasher:      1.2,  // kWh
  tv:              0.2,  // kWh
  refrigerator:    0.8,  // kWh (optimization-based)
};

/** Human-readable appliance names used as card titles. */
const APPLIANCE_NAMES: Record<string, string> = {
  washing_machine: "Washing Machine",
  ac:              "Air Conditioner",
  ev_charging:     "EV Charging",
  dishwasher:      "Dishwasher",
  tv:              "Television",
  refrigerator:    "Refrigerator",
};

type PriceContext = "LOW_PRICE" | "MODERATE" | "HIGH_PRICE";

function getPriceContext(price: number): PriceContext {
  if (price <= 6) return "LOW_PRICE";
  if (price >= 8) return "HIGH_PRICE";
  return "MODERATE";
}

/**
 * Dynamic Impact Formula:
 *
 *   price < ₹10  →  savings  = (10 − price) × usage    →  "Save ₹X"
 *                   Run now: you pay less than the ₹10 peak baseline.
 *
 *   price > ₹10  →  avoidable = (price − 10) × usage   →  "Avoid ₹X extra"
 *                   When live price exceeds ₹10, it becomes the new reference.
 *                   Delaying saves you the ₹X premium above the standard cap.
 *
 *   price = ₹10  →  "At Baseline ₹0" (no advantage either way)
 *
 * Values are always rounded. No clamping — the two branches handle sign naturally.
 */
function buildImpactDisplay(price: number, usageKwh: number) {
  if (price < STANDARD_PEAK) {
    const savings = Math.round((STANDARD_PEAK - price) * usageKwh);
    return {
      savingText:   "Save",
      savingValue:  `₹${savings}`,
      savingColor:  "text-emerald-600",
      savingBgLine: "bg-emerald-50",
    };
  }
  if (price > STANDARD_PEAK) {
    // Live price becomes the elevated reference above the ₹10 cap
    const avoidable = Math.round((price - STANDARD_PEAK) * usageKwh);
    return {
      savingText:   "Avoid",
      savingValue:  `₹${avoidable} extra`,
      savingColor:  "text-red-500",
      savingBgLine: "bg-red-50",
    };
  }
  return {
    savingText:   "At Baseline",
    savingValue:  "₹0",
    savingColor:  "text-slate-400",
    savingBgLine: "bg-slate-100",
  };
}

// ── Per-appliance messaging ────────────────────────────────────────────────────
const MESSAGING: Record<
  string,
  Record<PriceContext, { contextLabel: string; action: string }>
> = {
  washing_machine: {
    LOW_PRICE:  { contextLabel: "Low Price Window", action: "Run washing machine now" },
    MODERATE:   { contextLabel: "Moderate Pricing",  action: "Start wash before prices rise tonight" },
    HIGH_PRICE: { contextLabel: "High Cost Period",  action: "Delay washing machine — tariff is elevated" },
  },
  ac: {
    LOW_PRICE:  { contextLabel: "Low Price Window", action: "Pre-cool your space at lowest tariff" },
    MODERATE:   { contextLabel: "Moderate Pricing",  action: "Set AC to 24°C for balanced savings" },
    HIGH_PRICE: { contextLabel: "High Cost Period",  action: "Raise AC temperature by 2°C to cut cost" },
  },
  ev_charging: {
    LOW_PRICE:  { contextLabel: "Low Price Window", action: "Start EV charging — best rate today" },
    MODERATE:   { contextLabel: "Moderate Pricing",  action: "Charge EV before the evening peak" },
    HIGH_PRICE: { contextLabel: "High Cost Period",  action: "Delay EV charging to off-peak window" },
  },
  dishwasher: {
    LOW_PRICE:  { contextLabel: "Low Price Window", action: "Run dishwasher now — cheap electricity" },
    MODERATE:   { contextLabel: "Moderate Pricing",  action: "Run dishwasher before peak tonight" },
    HIGH_PRICE: { contextLabel: "High Cost Period",  action: "Delay dishwasher until prices drop" },
  },
  tv: {
    LOW_PRICE:  { contextLabel: "Low Price Window", action: "Stream freely — rates at their lowest" },
    MODERATE:   { contextLabel: "Low Impact Usage",  action: "Minimal cost — no action needed" },
    HIGH_PRICE: { contextLabel: "High Cost Period",  action: "Lower screen brightness to save energy" },
  },
  refrigerator: {
    LOW_PRICE:  { contextLabel: "Low Price Window", action: "Pre-cool fridge to 2°C while rates are low" },
    MODERATE:   { contextLabel: "Balanced Cooling",  action: "Maintain 4°C for optimal efficiency" },
    HIGH_PRICE: { contextLabel: "High Cost Period",  action: "Set fridge to 5°C — reduce compressor load" },
  },
};

// ── Static card identity (structure + icons only) ──────────────────────────────
interface CardConfig {
  id: number;
  appliance: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    id: 1,
    appliance: "washing_machine",
    icon: <BsArrowRepeat className="text-blue-500" size={18} />,
    iconBgColor: "bg-blue-50",
  },
  {
    id: 2,
    appliance: "ac",
    icon: <BsThermometerHalf className="text-cyan-500" size={18} />,
    iconBgColor: "bg-cyan-50",
  },
  {
    id: 3,
    appliance: "ev_charging",
    icon: <BsLightningCharge className="text-[color:var(--color-azure)]" size={18} />,
    iconBgColor: "bg-blue-50",
  },
  {
    id: 4,
    appliance: "dishwasher",
    icon: <BsDroplet className="text-teal-500" size={18} />,
    iconBgColor: "bg-teal-50",
  },
  {
    id: 5,
    appliance: "tv",
    icon: <BsTv className="text-purple-500" size={18} />,
    iconBgColor: "bg-purple-50",
  },
  {
    id: 6,
    appliance: "refrigerator",
    icon: <BsSnow className="text-sky-400" size={18} />,
    iconBgColor: "bg-sky-50",
  },
];

/**
 * Returns the current IST 30-min block label, e.g. "18:00 – 18:30".
 * Uses en-dash so Action3DCard's isTimeExpired parser returns false safely.
 */
function getCurrentWindowLabel(): string {
  const now = getISTTime();
  const h = now.getHours();
  const m = now.getMinutes();
  const blockStart = m < 30 ? 0 : 30;
  const nextMin    = blockStart + 30;
  const endHour    = nextMin >= 60 ? h + 1 : h;
  const endMin     = nextMin >= 60 ? 0 : nextMin;
  const pad        = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(blockStart)} – ${pad(endHour)}:${pad(endMin)}`;
}

/**
 * Derives all dynamic card content from the live current_price.
 *   - Title    → appliance name (not a context label)
 *   - Subtitle → context label + live price insight + recommended action
 *   - Impact   → dynamic savings formula (see buildImpactDisplay)
 */
function buildCardContent(config: CardConfig, currentPrice: number, timeWindow: string) {
  const { appliance } = config;
  const usage    = APPLIANCE_USAGE[appliance];
  const context  = getPriceContext(currentPrice);
  const msg      = MESSAGING[appliance][context];

  // Title = appliance name (e.g. "Washing Machine", "Television")
  const title = APPLIANCE_NAMES[appliance];

  // Subtitle: context label + live price insight + action
  const pricePct = Math.round(Math.abs((STANDARD_PEAK - currentPrice) / STANDARD_PEAK) * 100);
  const priceNote =
    context === "LOW_PRICE"
      ? `(${pricePct}% below peak)`
      : context === "HIGH_PRICE"
      ? `(${pricePct}% above cap)`
      : "";

  const description = `${msg.contextLabel} · ₹${currentPrice.toFixed(1)}/unit ${priceNote}. ${msg.action}.`;

  const impact   = buildImpactDisplay(currentPrice, usage);
  // Progress = price pressure indicator (0–100 relative to a ceiling of ₹12)
  const progress = Math.min(100, Math.round((currentPrice / 12) * 100));

  return {
    timeWindow,
    status:      "PENDING" as const,
    title,
    description,
    ...impact,
    progress,
    cta:         "Take Action",
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
interface ActionEngineProps {
  /** Live electricity price (₹/unit) from the Python pricing engine. */
  currentPrice: number;
}

export function ActionEngine({ currentPrice }: ActionEngineProps) {
  const router     = useRouter();
  const timeWindow = getCurrentWindowLabel();

  return (
    <div className="mt-8 mb-10 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[color:var(--color-azure)] rounded-sm"></div>
          <h2 className="text-xl font-bold font-display text-[color:var(--color-azure)]">Action Engine</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200/60 text-[color:var(--color-azure)] text-xs font-bold">
            6 active
          </span>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[color:var(--color-azure)] transition-colors">
          Scroll to view all <BsArrowRight />
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 gap-5 hide-scrollbar">
        {CARD_CONFIGS.map((config) => {
          const content = buildCardContent(config, currentPrice, timeWindow);
          return (
            <Action3DCard
              key={config.id}
              icon={config.icon}
              iconBgColor={config.iconBgColor}
              onCtaClick={() => router.push("/devices")}
              {...content}
            />
          );
        })}
      </div>
    </div>
  );
}
