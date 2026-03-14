import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

interface RealtimeSMSRow {
  amount?: number;
  merchant?: string;
  app_name?: string;
  user_id?: string;
}

interface UseRealtimeBalanceOptions {
  /** Called whenever a new SMS/transaction row is inserted. */
  onNewTransaction: (row: RealtimeSMSRow) => void;
}

/**
 * Subscribes to Supabase Realtime INSERT events on the simulated_sms table.
 * Calls `onNewTransaction` with the inserted row payload whenever a new row arrives.
 *
 * NOTE: Make sure Realtime is enabled for the `simulated_sms` table in your
 * Supabase project (Table Editor → simulated_sms → Realtime toggle ON).
 */
export function useRealtimeBalance({ onNewTransaction }: UseRealtimeBalanceOptions) {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const channel = supabase
      .channel("realtime:simulated_sms")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "simulated_sms" },
        (payload) => {
          onNewTransaction(payload.new as RealtimeSMSRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
