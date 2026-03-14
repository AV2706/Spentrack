import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Logo } from "../components/Logo";
import { motion } from "motion/react";
import { ArrowLeft, Phone, DollarSign, Check } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_FINANCIAL_SETTINGS, saveFinancialSettings } from "../lib/financialSettings";
import { initializeTransactionsForNewAccount } from "../hooks/useLiveTransactions";

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

export function SignUp() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [initialBalance, setInitialBalance] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedCurrencyMeta = currencies.find((currency) => currency.code === selectedCurrency) ?? currencies[0];

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedInitialBalance = Number(initialBalance);
    const parsedWeeklyBudget = Number(weeklyBudget);
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!initialBalance || Number.isNaN(parsedInitialBalance) || parsedInitialBalance < 0) {
      toast.error("Please enter a valid starting balance");
      return;
    }

    if (!weeklyBudget || Number.isNaN(parsedWeeklyBudget) || parsedWeeklyBudget <= 0) {
      toast.error("Please enter a valid weekly budget");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const derivedBalanceThreshold = Number(
        Math.min(
          DEFAULT_FINANCIAL_SETTINGS.balanceThreshold,
          parsedInitialBalance * 0.25
        ).toFixed(2)
      );

      saveFinancialSettings({
        balanceThreshold: derivedBalanceThreshold,
        weeklyBudget: Number(parsedWeeklyBudget.toFixed(2)),
        monthlyBudget: Number((parsedWeeklyBudget * 4).toFixed(2)),
        hourlyWage: DEFAULT_FINANCIAL_SETTINGS.hourlyWage,
      });

      localStorage.setItem("userCurrency", selectedCurrency);
      localStorage.setItem("userPhone", phoneNumber);
      localStorage.removeItem("spentrack:simulated-sms");
      initializeTransactionsForNewAccount(parsedInitialBalance);

      toast.success("Account created successfully!", {
        description: `Starting balance ${selectedCurrencyMeta.symbol}${parsedInitialBalance.toFixed(2)} and weekly budget ${selectedCurrencyMeta.symbol}${parsedWeeklyBudget.toFixed(2)} saved.`,
      });

      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/welcome">
          <button className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </Link>
        <Logo className="w-12 h-12" />
        <div className="w-10"></div>
      </div>

      {/* Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-auto"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
        <p className="text-slate-600 mb-8">Let's get you started with SpenTrack</p>

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Phone Number Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We'll use this to track your bank SMS notifications
            </p>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Preferred Currency
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors appearance-none bg-white cursor-pointer"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Starting Balance
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {selectedCurrencyMeta.symbol}
              </div>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="1250.45"
                min="0"
                step="0.01"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This becomes the balance shown when your dashboard opens for the first time.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Weekly Budget
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {selectedCurrencyMeta.symbol}
              </div>
              <input
                type="number"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(e.target.value)}
                placeholder="600.00"
                min="0.01"
                step="0.01"
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We'll use this to power your budget warnings and spending insights.
            </p>
          </div>

          {/* SMS Permission Notice */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="text-amber-600 mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-amber-900 text-sm">SMS Permissions Required</p>
                <p className="text-xs text-amber-700 mt-1">
                  SpenTrack needs access to read your bank SMS notifications to track transactions in real-time. We only read messages from known banks and never share your data.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-medium hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}