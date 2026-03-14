import { highSpendApps } from "./mockData";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

export interface ParsedSMS {
  rawText: string;
  userId: string;
  timestamp: string;
  amount?: number;
  merchant?: string;
  appName?: string;
  avgSpend?: number;
}

export interface ParseAndStoreSMSResult {
  success: boolean;
  message: string;
  parsed?: ParsedSMS;
}

const STORAGE_KEY = "spentrack:simulated-sms";

function parseAmount(text: string): number | undefined {
  const amountMatch = text.match(/(?:rs\.?|inr|usd|\$)\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if (!amountMatch?.[1]) {
    return undefined;
  }

  const normalized = amountMatch[1].replace(/,/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isNaN(amount) ? undefined : amount;
}

function parseMerchant(text: string): string | undefined {
  const merchantMatch = text.match(/(?:at|to)\s+([a-z0-9&.' -]{2,40})(?:\.|,| on|$)/i);
  if (!merchantMatch?.[1]) {
    return undefined;
  }
  return merchantMatch[1].trim();
}

function parseHighSpendApp(text: string): { appName: string; avgSpend: number } | undefined {
  const normalizedText = text.toLowerCase();
  const app = highSpendApps.find((item) => normalizedText.includes(item.name.toLowerCase()));
  if (!app) {
    return undefined;
  }

  return { appName: app.name, avgSpend: app.avgSpend };
}

function readExistingSMS(): ParsedSMS[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ParsedSMS[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSMS(record: ParsedSMS) {
  const existing = readExistingSMS();
  const next = [record, ...existing].slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

async function persistSMSToSupabase(record: ParsedSMS): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: "Supabase is not configured. Using local fallback storage." };
  }

  const { error } = await supabase.from("simulated_sms").insert({
    user_id: record.userId,
    raw_text: record.rawText,
    amount: record.amount,
    merchant: record.merchant,
    app_name: record.appName,
    avg_spend: record.avgSpend,
    received_at: record.timestamp,
  });

  if (error) {
    return { success: false, message: `Supabase insert failed: ${error.message}` };
  }

  return { success: true };
}

export async function parseAndStoreSMS(text: string, userId: string): Promise<ParseAndStoreSMSResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      success: false,
      message: "SMS text cannot be empty.",
    };
  }

  const appInfo = parseHighSpendApp(trimmed);

  const parsed: ParsedSMS = {
    rawText: trimmed,
    userId,
    timestamp: new Date().toISOString(),
    amount: parseAmount(trimmed),
    merchant: parseMerchant(trimmed),
    appName: appInfo?.appName,
    avgSpend: appInfo?.avgSpend,
  };

  const supabaseResult = await persistSMSToSupabase(parsed);
  if (!supabaseResult.success) {
    persistSMS(parsed);
  }

  return {
    success: true,
    message: supabaseResult.success
      ? "Simulated SMS stored in Supabase successfully."
      : `Simulated SMS stored locally. ${supabaseResult.message}`,
    parsed,
  };
}