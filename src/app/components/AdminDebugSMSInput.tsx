import { FormEvent, useState } from "react";
import { Input } from "./ui/input";

interface AdminDebugSMSInputProps {
  onSimulateSMS: (smsText: string) => Promise<void> | void;
}

export function AdminDebugSMSInput({ onSimulateSMS }: AdminDebugSMSInputProps) {
  const [smsText, setSmsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = smsText.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSimulateSMS(trimmed);
      setSmsText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="opacity-5 hover:opacity-100 focus-within:opacity-100 transition-opacity"
      aria-label="Admin debug SMS simulator"
    >
      <Input
        type="text"
        value={smsText}
        onChange={(event) => setSmsText(event.target.value)}
        placeholder="Admin Debug: paste mock SMS and press Enter"
        className="h-8 text-xs bg-slate-100"
        autoComplete="off"
        spellCheck={false}
        disabled={isSubmitting}
      />
    </form>
  );
}