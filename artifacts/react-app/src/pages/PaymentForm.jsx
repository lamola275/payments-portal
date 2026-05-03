import { useState } from "react";
import { supabase } from "@/lib/supabase";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "SEK", "NOK", "DKK"];

function validateIBAN(iban) {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleaned)) return false;
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

function formatIBAN(value) {
  return value
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export default function PaymentForm() {
  const [formData, setFormData] = useState({
    recipientName: "",
    iban: "",
    amount: "",
    currency: "EUR",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.recipientName.trim())
      newErrors.recipientName = "Recipient name is required.";

    const cleanIBAN = formData.iban.replace(/\s/g, "");
    if (!cleanIBAN) {
      newErrors.iban = "IBAN is required.";
    } else if (!validateIBAN(cleanIBAN)) {
      newErrors.iban = "Enter a valid IBAN.";
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount) {
      newErrors.amount = "Amount is required.";
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = "Enter a positive amount.";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "iban") value = formatIBAN(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setStatus(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("payments").insert({
      recipient_name: formData.recipientName,
      iban: formData.iban.replace(/\s/g, ""),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      user_id: user?.id ?? null,
    });

    setLoading(false);

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Payment saved successfully." });
      setFormData({ recipientName: "", iban: "", amount: "", currency: "EUR" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New payment</h1>
          <p className="text-sm text-gray-500 mt-1">Enter the transfer details below.</p>
        </div>

        {status && (
          <div
            className={`mb-5 rounded-lg px-4 py-3 text-sm ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient name
            </label>
            <input
              name="recipientName"
              type="text"
              autoComplete="off"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Jane Doe"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.recipientName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
            />
            {errors.recipientName && (
              <p className="mt-1 text-xs text-red-500">{errors.recipientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <input
              name="iban"
              type="text"
              autoComplete="off"
              value={formData.iban}
              onChange={handleChange}
              placeholder="DE89 3704 0044 0532 0130 00"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 font-mono outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.iban ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
            />
            {errors.iban && <p className="mt-1 text-xs text-red-500">{errors.iban}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.amount ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Data is stored securely in your Supabase project.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving payment…" : "Submit payment"}
          </button>
        </form>
      </div>
    </div>
  );
}
