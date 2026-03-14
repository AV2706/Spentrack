import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { motion, useAnimation } from "motion/react";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertCircle, 
  Sparkles, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Coffee,
  Zap,
  Plus,
  Store
} from "lucide-react";
import { mockTransactions, encouragementMessages, warningMessages, highSpendApps } from "../lib/mockData";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { PurchaseNotification } from "../components/PurchaseNotification";
import { MiscSpendingModal } from "../components/MiscSpendingModal";
import { AdminDebugSMSInput } from "../components/AdminDebugSMSInput";
import { useCurrency } from "../hooks/useCurrency";
import { parseAndStoreSMS } from "../lib/smsParser";
import { generateSpendingFeedback, type SpendingContext } from "../lib/geminiService";
import { useRealtimeBalance } from "../hooks/useRealtimeBalance";

export function Dashboard() {
  const currency = useCurrency();
  const [currentBalance, setCurrentBalance] = useState(1250.45);
  const [balanceThreshold, setBalanceThreshold] = useState(500);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showPurchaseNotification, setShowPurchaseNotification] = useState(false);
  const [selectedApp, setSelectedApp] = useState<{ name: string; icon: string; avgSpend: number; amount?: number } | null>(null);
  const [showMiscModal, setShowMiscModal] = useState(false);
  const [miscSpendings, setMiscSpendings] = useState<Array<{ id: string; amount: number; description: string; date: Date }>>([]);
  const [isLowBalanceFlash, setIsLowBalanceFlash] = useState(false);
  const balanceCardControls = useAnimation();

  useEffect(() => {
    balanceCardControls.start({ opacity: 1, y: 0, transition: { duration: 0.5 } });
  }, [balanceCardControls]);

  const recentTransactions = mockTransactions.slice(0, 5);
  const weeklySpent = 464.63;
  const weeklyBudget = 600;
  const budgetProgress = (weeklySpent / weeklyBudget) * 100;

  useEffect(() => {
    // Simulate checking balance threshold
    if (currentBalance < balanceThreshold) {
      toast.error("Low Balance Alert", {
        description: `Your balance (${currency}${currentBalance.toFixed(2)}) is below your threshold of ${currency}${balanceThreshold}.`,
        duration: 5000,
      });
    }
  }, [currentBalance, balanceThreshold, currency]);

  const triggerLowBalanceAlert = async (newBalance: number) => {
    setIsLowBalanceFlash(true);
    await balanceCardControls.start({
      x: [0, -14, 14, -10, 10, -6, 6, 0],
      transition: { duration: 0.6, ease: "easeInOut" },
    });
    setIsLowBalanceFlash(false);
    toast.error("⚠️ Low Balance Alert", {
      description: `A new transaction dropped your balance to ${currency}${newBalance.toFixed(2)} — below your ${currency}${balanceThreshold} threshold!`,
      duration: 6000,
    });
  };

  useRealtimeBalance({
    onNewTransaction: (row) => {
      if (!row.amount) return;
      setCurrentBalance((prev) => {
        const next = Math.max(0, prev - row.amount!);
        if (next < balanceThreshold) {
          triggerLowBalanceAlert(next);
        } else {
          toast.info(`💳 New transaction: −${currency}${row.amount!.toFixed(2)}${
            row.merchant ? ` at ${row.merchant}` : ""
          }`, { duration: 4000 });
        }
        return next;
      });
    },
  });

  const handleGoodChoice = () => {
    setShowEncouragement(true);
    const message = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    toast.success(message, { duration: 3000 });
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => setShowEncouragement(false), 3000);
  };

  const handleAppWarning = (appName: string, avgSpend: number, amount?: number) => {
    const app = highSpendApps.find(a => a.name === appName);
    setSelectedApp({ name: appName, icon: app?.icon || '💰', avgSpend, amount });
    setShowPurchaseNotification(true);
  };

  const handleAddMiscSpending = (description: string) => {
    // Find the last misc spending and update its description
    const lastMiscSpending = miscSpendings[0];
    if (lastMiscSpending && !lastMiscSpending.description) {
      const updatedSpendings = [...miscSpendings];
      updatedSpendings[0] = { ...lastMiscSpending, description };
      setMiscSpendings(updatedSpendings);
      toast.success(`Updated: ${description} - ${currency}${lastMiscSpending.amount.toFixed(2)}`);
    }
  };

  const handleMiscSpending = () => {
    // First, add a random transaction
    const randomAmount = Math.random() * 50 + 5; // Random amount between $5-$55
    const newSpending = {
      id: Date.now().toString(),
      amount: randomAmount,
      description: 'Miscellaneous', // Temporary description
      date: new Date()
    };
    setMiscSpendings([newSpending, ...miscSpendings]);
    
    // Then show notification asking what it was
    setTimeout(() => {
      toast.info("Hey, you just made a miscellaneous transaction! Wanna tell us what that was about?", {
        duration: 5000,
        action: {
          label: "Add Details",
          onClick: () => setShowMiscModal(true)
        },
      });
    }, 500);
  };

  const handlePurchaseSave = async () => {
    setShowPurchaseNotification(false);
    handleGoodChoice();
    if (selectedApp) {
      const ctx: SpendingContext = {
        amount: selectedApp.amount ?? selectedApp.avgSpend,
        avgSpend: selectedApp.avgSpend,
        currentBalance,
        weeklySpent,
        weeklyBudget,
      };
      const msg = await generateSpendingFeedback(selectedApp.name, ctx, "toast");
      toast.success(`🥂 ${msg}`, { duration: 6000 });
    }
  };

  const handlePurchaseContinue = async () => {
    setShowPurchaseNotification(false);
    if (selectedApp) {
      const ctx: SpendingContext = {
        amount: selectedApp.amount ?? selectedApp.avgSpend,
        avgSpend: selectedApp.avgSpend,
        currentBalance,
        weeklySpent,
        weeklyBudget,
      };
      const msg = await generateSpendingFeedback(selectedApp.name, ctx, "roast");
      toast.warning(`🔥 ${msg}`, { duration: 10000 });
    } else {
      toast.info("Good luck with your purchase!");
    }
  };

  const handleSimulateSMS = async (text: string) => {
    const userId = localStorage.getItem("userPhone") || "demo-user";
    const result = await parseAndStoreSMS(text, userId);

    if (!result.success) {
      toast.error("SMS parse failed", {
        description: result.message || "Could not parse simulated SMS.",
      });
      return;
    }

    if (result.parsed?.appName && result.parsed.avgSpend) {
      handleAppWarning(result.parsed.appName, result.parsed.avgSpend, result.parsed.amount);
    }

    toast.success("SMS received and parsed", {
      description: result.message || "The dashboard has been refreshed with simulated SMS data.",
    });
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={balanceCardControls}
      >
        <Card className={`border-0 text-white shadow-xl transition-all duration-300 ${
          isLowBalanceFlash
            ? "bg-gradient-to-br from-red-500 to-rose-600 ring-4 ring-red-300"
            : "bg-gradient-to-br from-emerald-500 to-teal-600"
        }`}>
          <CardHeader>
            <CardDescription className="text-emerald-100">Current Balance</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {currency}{currentBalance.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentBalance < balanceThreshold ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm text-emerald-100">Below threshold</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                    <span className="text-sm text-emerald-100">Looking good!</span>
                  </>
                )}
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Threshold: {currency}{balanceThreshold}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Budget Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Budget</CardTitle>
                <CardDescription>Track your spending this week</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {currency}{weeklySpent.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">of {currency}{weeklyBudget}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={budgetProgress} className="h-3" />
            <div className="flex justify-between mt-2 text-sm">
              <span className={budgetProgress > 80 ? "text-red-600 font-medium" : "text-slate-600"}>
                {budgetProgress.toFixed(0)}% used
              </span>
              <span className="text-slate-600">
                {currency}{(weeklyBudget - weeklySpent).toFixed(2)} remaining
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <ArrowUpRight className="w-4 h-4" />
                <CardDescription>Spent Today</CardDescription>
              </div>
              <CardTitle className="text-2xl">{currency}89.99</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <ArrowDownRight className="w-4 h-4" />
                <CardDescription>Avg. Daily</CardDescription>
              </div>
              <CardTitle className="text-2xl">{currency}66.37</CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      {/* High-Spend Apps Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-900">Smart Spending Alerts</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Apps you frequently spend money on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {highSpendApps.map((app) => (
              <button
                key={app.name}
                onClick={() => handleAppWarning(app.name, app.avgSpend)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{app.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{app.name}</p>
                    <p className="text-sm text-slate-500">Avg. {currency}{app.avgSpend}</p>
                  </div>
                </div>
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Last 5 transactions</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {transaction.category === 'Shopping' && <ShoppingBag className="w-5 h-5 text-slate-600" />}
                      {transaction.category === 'Food & Dining' && <Coffee className="w-5 h-5 text-slate-600" />}
                      {transaction.category === 'Income' && <DollarSign className="w-5 h-5 text-emerald-600" />}
                      {!['Shopping', 'Food & Dining', 'Income'].includes(transaction.category) && (
                        <DollarSign className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{transaction.merchant}</p>
                      <p className="text-sm text-slate-500">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{currency}{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {transaction.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Miscellaneous Spendings */}
      {miscSpendings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
        >
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-purple-900">Miscellaneous Spendings</CardTitle>
                </div>
                <Badge className="bg-purple-200 text-purple-800 border-purple-300">
                  {miscSpendings.length} items
                </Badge>
              </div>
              <CardDescription className="text-purple-700">
                Small purchases and local store spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {miscSpendings.slice(0, 5).map((spending) => (
                  <div
                    key={spending.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Store className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{spending.description}</p>
                        <p className="text-sm text-slate-500">
                          {spending.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {currency}{spending.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              {miscSpendings.length > 5 && (
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  View All {miscSpendings.length} Items
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Misc Spending Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Button
          onClick={handleMiscSpending}
          variant="outline"
          className="w-full border-2 border-dashed border-purple-300 hover:bg-purple-50 hover:border-purple-400 py-6"
        >
          <Plus className="w-5 h-5 mr-2 text-purple-600" />
          <span className="text-purple-700 font-medium">Add Miscellaneous Spending</span>
        </Button>
      </motion.div>

      {/* Spending Decision Helper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle className="text-emerald-900">Making a Purchase?</CardTitle>
            <CardDescription className="text-emerald-700">
              Think twice before you buy! Choose wisely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleGoodChoice}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              I'll Save Instead!
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (highSpendApps[0]) {
                  handleAppWarning(highSpendApps[0].name, highSpendApps[0].avgSpend);
                }
              }}
            >
              I Really Need This
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Purchase Notification - rendered outside page flow so it always overlays */}
      <PurchaseNotification
        isOpen={showPurchaseNotification && !!selectedApp}
        appName={selectedApp?.name ?? ""}
        appIcon={selectedApp?.icon ?? "💰"}
        avgSpend={selectedApp?.avgSpend ?? 0}
        onClose={() => setShowPurchaseNotification(false)}
        onSave={handlePurchaseSave}
        onContinue={handlePurchaseContinue}
      />

      {/* Misc Spending Modal */}
      {showMiscModal && (
        <MiscSpendingModal
          isOpen={showMiscModal}
          onClose={() => setShowMiscModal(false)}
          onAddSpending={handleAddMiscSpending}
        />
      )}

      <AdminDebugSMSInput onSimulateSMS={handleSimulateSMS} />
    </div>
  );
}