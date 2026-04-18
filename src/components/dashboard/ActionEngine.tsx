import React from "react";
import { Action3DCard } from "../ui/Action3DCard";
import { BsSun, BsExclamationTriangle, BsLightningCharge, BsLeaf, BsBatteryHalf, BsArrowRight } from "react-icons/bs";

const mockActions = [
  {
    id: 1,
    timeWindow: "3:00 - 3:30",
    status: "PENDING" as const,
    title: "Eco Wash Cycle",
    description: "Optimal time for washing machine usage has passed.",
    savingText: "Saved",
    savingValue: "₹12",
    savingColor: "text-slate-500",
    savingBgLine: "bg-slate-100",
    progress: 100,
    icon: <BsSun className="text-slate-400" size={18} />,
    iconBgColor: "bg-slate-50",
  },
  {
    id: 2,
    timeWindow: "4:00 - 4:30",
    status: "PENDING" as const,
    title: "Morning Preheat",
    description: "Preheat window for AC is now closing.",
    savingText: "Missed",
    savingValue: "₹18",
    savingColor: "text-red-500",
    savingBgLine: "bg-red-50",
    progress: 95,
    icon: <BsExclamationTriangle className="text-red-400" size={18} />,
    iconBgColor: "bg-red-50",
  },
  {
    id: 3,
    timeWindow: "6:00 - 6:30",
    status: "PENDING" as const,
    title: "Solar Peak Window",
    description: "Run heavy appliances now to maximize solar offset.",
    savingText: "Save",
    savingValue: "₹28",
    savingColor: "text-orange-500",
    savingBgLine: "bg-orange-100",
    progress: 35,
    icon: <BsSun className="text-orange-500" size={18} />,
    iconBgColor: "bg-orange-50",
  },
  {
    id: 4,
    timeWindow: "7:00 - 7:30",
    status: "APPLIED" as const,
    title: "Load Shift Opportunity",
    description: "Shift EV charging to this window for lower tariff.",
    savingText: "Save",
    savingValue: "₹19",
    savingColor: "text-[color:var(--color-azure)]",
    savingBgLine: "bg-blue-50",
    progress: 72,
    icon: <BsLightningCharge className="text-[color:var(--color-azure)]" size={18} />,
    iconBgColor: "bg-blue-50",
  },
  {
    id: 5,
    timeWindow: "8:00 - 8:30",
    status: "PENDING" as const,
    title: "Battery Charge Slot",
    description: "Charge home battery before morning price spike.",
    savingText: "Save",
    savingValue: "₹33",
    savingColor: "text-purple-500",
    savingBgLine: "bg-purple-50",
    progress: 0,
    icon: <BsBatteryHalf className="text-purple-500" size={18} />,
    iconBgColor: "bg-purple-50",
  },
];

export function ActionEngine() {
  return (
    <div className="mt-8 mb-10 w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[color:var(--color-azure)] rounded-sm"></div>
          <h2 className="text-xl font-bold font-display text-[color:var(--color-azure)]">Action Engine</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-200/60 text-[color:var(--color-azure)] text-xs font-bold">
            5 active
          </span>
        </div>
        <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[color:var(--color-azure)] transition-colors">
          Scroll to view all <BsArrowRight />
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 gap-5 hide-scrollbar">
        {mockActions.map((action) => (
          <Action3DCard key={action.id} {...action} />
        ))}
      </div>
    </div>
  );
}
