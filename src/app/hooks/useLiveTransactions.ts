import { useCallback, useEffect, useState } from "react";
import { mockTransactions, type Transaction } from "../lib/mockData";

export const TRANSACTIONS_STORAGE_KEY = "spentrack:transactions";
export const TRANSACTIONS_UPDATED_EVENT = "spentrack:transactions-updated";
const DUPLICATE_WINDOW_MS = 15 * 1000;

interface StoredTransaction extends Omit<Transaction, "date"> {
  date: string;
}

export interface LiveTransactionInput {
  amount: number;
  merchant?: string;
  appName?: string;
  timestamp?: string;
  category?: string;
  type?: Transaction["type"];
}

export interface LiveTransactionMutationResult {
  transaction: Transaction;
  isDuplicate: boolean;
}

function toSortedTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function saveTransactions(transactions: Transaction[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
}

function dispatchTransactionsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(TRANSACTIONS_UPDATED_EVENT));
}

function readStoredTransactions(raw: string | null): Transaction[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredTransaction[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    const restored = parsed
      .map((item) => {
        const date = new Date(item.date);
        if (!item.id || Number.isNaN(date.getTime())) {
          return null;
        }

        const amount = Number(item.amount);
        const balance = Number(item.balance);
        if (!Number.isFinite(amount) || !Number.isFinite(balance)) {
          return null;
        }

        return {
          ...item,
          amount,
          balance,
          date,
        } satisfies Transaction;
      })
      .filter((item): item is Transaction => item !== null);

    return toSortedTransactions(restored);
  } catch {
    return [];
  }
}

function readTransactionsFromStorage(): Transaction[] {
  if (typeof window === "undefined") {
    return toSortedTransactions(mockTransactions);
  }

  const stored = readStoredTransactions(localStorage.getItem(TRANSACTIONS_STORAGE_KEY));
  if (stored.length > 0) {
    return stored;
  }

  const seeded = toSortedTransactions(mockTransactions);
  saveTransactions(seeded);
  return seeded;
}

function inferCategory(merchant: string, type: Transaction["type"]): string {
  if (type === "credit") {
    return "Income";
  }

  const normalized = merchant.toLowerCase();

  if (/(uber|lyft|shell|gas|fuel|taxi|metro|bus)/.test(normalized)) {
    return "Transportation";
  }

  if (/(starbucks|coffee|doordash|ubereats|restaurant|food|cafe|kitchen)/.test(normalized)) {
    return "Food & Dining";
  }

  if (/(amazon|target|walmart|store|shop|mall)/.test(normalized)) {
    return "Shopping";
  }

  if (/(netflix|spotify|prime|youtube|hulu|movie|entertainment)/.test(normalized)) {
    return "Entertainment";
  }

  if (/(whole foods|market|grocery)/.test(normalized)) {
    return "Groceries";
  }

  return "Miscellaneous";
}

function findDuplicateTransaction(
  transactions: Transaction[],
  candidate: {
    amount: number;
    merchant: string;
    type: Transaction["type"];
    date: Date;
  }
): Transaction | undefined {
  const merchant = candidate.merchant.trim().toLowerCase();

  return transactions.find((transaction) => {
    return (
      transaction.type === candidate.type &&
      Math.abs(transaction.amount - candidate.amount) < 0.001 &&
      transaction.merchant.trim().toLowerCase() === merchant &&
      Math.abs(transaction.date.getTime() - candidate.date.getTime()) <= DUPLICATE_WINDOW_MS
    );
  });
}

function appendLiveTransaction(input: LiveTransactionInput): LiveTransactionMutationResult | null {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const transactions = readTransactionsFromStorage();
  const type = input.type ?? "debit";
  const merchant =
    input.merchant?.trim() || input.appName?.trim() || (type === "credit" ? "Deposit" : "Card Payment");

  const maybeDate = input.timestamp ? new Date(input.timestamp) : new Date();
  const date = Number.isNaN(maybeDate.getTime()) ? new Date() : maybeDate;

  const duplicate = findDuplicateTransaction(transactions, {
    amount,
    merchant,
    type,
    date,
  });

  if (duplicate) {
    return {
      transaction: duplicate,
      isDuplicate: true,
    };
  }

  const currentBalance = transactions[0]?.balance ?? 0;
  const nextBalance = type === "credit" ? currentBalance + amount : Math.max(0, currentBalance - amount);

  const transaction: Transaction = {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    merchant,
    amount,
    category: input.category ?? inferCategory(merchant, type),
    balance: nextBalance,
    type,
  };

  const nextTransactions = toSortedTransactions([transaction, ...transactions]);
  saveTransactions(nextTransactions);
  dispatchTransactionsUpdated();

  return {
    transaction,
    isDuplicate: false,
  };
}

export function initializeTransactionsForNewAccount(initialBalance: number) {
  const normalizedBalance = Number(initialBalance);
  if (!Number.isFinite(normalizedBalance) || normalizedBalance < 0) {
    return;
  }

  const openingTransaction: Transaction = {
    id: `opening-${Date.now()}`,
    date: new Date(),
    merchant: "Opening Balance",
    amount: Number(normalizedBalance.toFixed(2)),
    category: "Income",
    balance: Number(normalizedBalance.toFixed(2)),
    type: "credit",
  };

  saveTransactions([openingTransaction]);
  dispatchTransactionsUpdated();
}

export function useLiveTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => readTransactionsFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromStorage = () => {
      setTransactions(readTransactionsFromStorage());
    };

    const onTransactionsUpdated = () => {
      syncFromStorage();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== TRANSACTIONS_STORAGE_KEY) {
        return;
      }
      syncFromStorage();
    };

    window.addEventListener(TRANSACTIONS_UPDATED_EVENT, onTransactionsUpdated);
    window.addEventListener("storage", onStorage);
    syncFromStorage();

    return () => {
      window.removeEventListener(TRANSACTIONS_UPDATED_EVENT, onTransactionsUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const addTransaction = useCallback((input: LiveTransactionInput) => {
    const result = appendLiveTransaction(input);
    if (result && !result.isDuplicate) {
      setTransactions(readTransactionsFromStorage());
    }
    return result;
  }, []);

  return {
    transactions,
    addTransaction,
  };
}
