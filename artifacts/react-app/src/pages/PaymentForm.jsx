import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY", "CAD", "AUD", "SEK", "NOK", "DKK"];

const RULES = {
  recipientName: {
    regex: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-,\.]{2,100}$/,
    message: "Recipient name must be 2–100 characters and contain only letters, spaces, hyphens, apostrophes, commas or periods.",
  },
  iban: {
    // After stripping spaces: 2 uppercase letters, 2 digits, then 1–30 alphanumeric chars
    regex: /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/,
    message: "Enter a valid IBAN (e.g. DE89 3704 0044 0532 0130 00).",
  },
  amount: {
    // Positive number, up to 2 decimal places
    regex: /^\d+(\.\d{1,2})?$/,
    message: "Amount must be a positive number with up to 2 decimal places (e.g. 100 or 99.99).",
  },
};

function validateIBANChecksum(raw) {
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  if (!RULES.iban.regex.test(cleaned)) return false;
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  return remainder === 1;
}

function validateField(name, value) {
  if (!value || !value.toString().trim()) {
    return `${name === "recipientName" ? "Recipient name" : name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
  }
  const rule = RULES[name];
  if (!rule) return null;

  if (name === "iban") {
    const stripped = value.replace(/\s/g, "").toUpperCase();
    if (!rule.regex.test(stripped)) return rule.message;
    if (!validateIBANChecksum(value)) return "IBAN checksum is invalid. Please double-check the number.";
    return null;
  }

  if (!rule.regex.test(value.toString())) return rule.message;
  return null;
}

function formatIBAN(value) {
  return value.replace(/\s/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
}

export default function PaymentForm() {
  const [, navigate] = useLocation();
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
    for (const field of ["recipientName", "iban", "amount"]) {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    }
    return newErrors;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "iban") value = formatIBAN(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    const err = value ? validateField(name, value) : null;
    setErrors((prev) => ({ ...prev, [name]: err }));
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
      setErrors({});
    }
  };

  const fieldDefs = [
    {
      name: "recipientName",
      label: "Recipient name",
      type: "text",
      placeholder: "Jane Doe",
      hint: "2–100 chars · letters, spaces, hyphens and apostrophes only",
      mono: false,
      colSpan: "full",
    },
    {
      name: "iban",
      label: "IBAN",
      type: "text",
      placeholder: "DE89 3704 0044 0532 0130 00",
      hint: "Country code + 2 check digits + up to 30 alphanumeric chars · validated with mod-97",
      mono: true,
      colSpan: "full",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New payment</h1>
            <p className="text-sm text-gray-500 mt-1">Enter the transfer details below.</p>
          </div>
          <button
            type="button"
            onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}
            className="text-sm text-gray-500 hover:text-red-600 transition"
          >
            Log out
          </button>
        </div>

        {status && (
          <div className={`mb-5 rounded-lg px-4 py-3 text-sm border ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {fieldDefs.map(({ name, label, type, placeholder, hint, mono }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                autoComplete="off"
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  mono ? "font-mono" : ""
                } ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
              />
              {errors[name]
                ? <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
                : <p className="mt-1 text-xs text-gray-400">{hint}</p>
              }
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.amount ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.amount
                ? <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                : <p className="mt-1 text-xs text-gray-400">Digits only, up to 2 decimal places</p>
              }
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Select from list · no free text</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
