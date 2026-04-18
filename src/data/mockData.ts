export interface Cluster {
  id: string;
  name: string;
  area: string;
  state: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  status: "ON" | "OFF";
  image?: string;
  optimizationTips: string[];
}

export const CLUSTERS: Cluster[] = [
  { id: "GRID-001", name: "Green Valley Cluster", area: "Sector 42", state: "Maharashtra" },
  { id: "GRID-002", name: "Azure Heights", area: "Kormangala", state: "Karnataka" },
  { id: "GRID-003", name: "Solar Wind Estate", area: "Cyber City", state: "Haryana" },
  { id: "DZ-WB-004", name: "DZ West Block", area: "Salt Lake", state: "West Bengal" },
];

export const INITIAL_DEVICES: Device[] = [
  {
    id: "dev-1",
    name: "Washing Machine",
    type: "Appliance",
    status: "ON",
    optimizationTips: [
      "Wash at 30°C to save up to 40% energy.",
      "Use Eco-mode for non-soiled clothes.",
      "Avoid peak hours (6 PM - 10 PM) for heavy loads."
    ]
  },
  {
    id: "dev-2",
    name: "Refrigerator",
    type: "Appliance",
    status: "ON",
    optimizationTips: [
      "Keep the condenser coils clean for 15% better efficiency.",
      "Maintain 3°C to 5°C in the fridge section.",
      "Ensure the door seal is airtight."
    ]
  },
  {
    id: "dev-3",
    name: "Television",
    type: "Entertainment",
    status: "OFF",
    optimizationTips: [
      "Reduce brightness to save energy.",
      "Enable 'Auto Standby' mode.",
      "Unplug when not in use for extended periods."
    ]
  },
  {
    id: "dev-4",
    name: "Air Conditioner",
    type: "Comfort",
    status: "ON",
    optimizationTips: [
      "Set temperature to 24°C for the best balance of comfort and savings.",
      "Clean filters every 2 weeks.",
      "Keep windows and doors tightly closed while operating."
    ]
  },
  {
    id: "dev-5",
    name: "Dishwasher",
    type: "Appliance",
    status: "OFF",
    optimizationTips: [
      "Only run with a full load.",
      "Use the air-dry setting instead of heated dry.",
      "Scrape food instead of pre-rinsing with hot water."
    ]
  }
];
