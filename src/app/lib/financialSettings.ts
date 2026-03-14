export const FINANCIAL_SETTINGS_UPDATED_EVENT = "spentrack:financial-settings-updated";

export const FINANCIAL_SETTING_KEYS = {
  balanceThreshold: "spentrack:balance-threshold",
  weeklyBudget: "spentrack:weekly-budget",
  monthlyBudget: "spentrack:monthly-budget",
  hourlyWage: "spentrack:hourly-wage",
} as const;

export interface FinancialSettings {
  balanceThreshold: number;
  weeklyBudget: number;
  monthlyBudget: number;
  hourlyWage: number;
}

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
  balanceThreshold: 500,
  weeklyBudget: 600,
  monthlyBudget: 2500,
  hourlyWage: 20,
};

function readNumberSetting(key: string, fallback: number, allowZero = false): number {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  const isBelowMinimum = allowZero ? parsed < 0 : parsed <= 0;
  if (!Number.isFinite(parsed) || isBelowMinimum) {
    return fallback;
  }

  return parsed;
}

export function getFinancialSettings(): FinancialSettings {
  return {
    balanceThreshold: readNumberSetting(
      FINANCIAL_SETTING_KEYS.balanceThreshold,
      DEFAULT_FINANCIAL_SETTINGS.balanceThreshold,
      true
    ),
    weeklyBudget: readNumberSetting(
      FINANCIAL_SETTING_KEYS.weeklyBudget,
      DEFAULT_FINANCIAL_SETTINGS.weeklyBudget
    ),
    monthlyBudget: readNumberSetting(
      FINANCIAL_SETTING_KEYS.monthlyBudget,
      DEFAULT_FINANCIAL_SETTINGS.monthlyBudget
    ),
    hourlyWage: readNumberSetting(
      FINANCIAL_SETTING_KEYS.hourlyWage,
      DEFAULT_FINANCIAL_SETTINGS.hourlyWage
    ),
  };
}

export function saveFinancialSettings(settings: FinancialSettings) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(FINANCIAL_SETTING_KEYS.balanceThreshold, String(settings.balanceThreshold));
  localStorage.setItem(FINANCIAL_SETTING_KEYS.weeklyBudget, String(settings.weeklyBudget));
  localStorage.setItem(FINANCIAL_SETTING_KEYS.monthlyBudget, String(settings.monthlyBudget));
  localStorage.setItem(FINANCIAL_SETTING_KEYS.hourlyWage, String(settings.hourlyWage));
  window.dispatchEvent(new Event(FINANCIAL_SETTINGS_UPDATED_EVENT));
}
