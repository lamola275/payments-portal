import { useState } from "react";

function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function formatCVV(value) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export default function PaymentForm() {
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    billingAddress: "",
    city: "",
    zip: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors = {};
    const rawCard = formData.cardNumber.replace(/\s/g, "");

    if (!formData.cardholderName.trim())
      newErrors.cardholderName = "Cardholder name is required.";

    if (!rawCard) {
      newErrors.cardNumber = "Card number is required.";
    } else if (rawCard.length < 13 || rawCard.length > 16) {
      newErrors.cardNumber = "Enter a valid card number.";
    }

    if (!formData.expiry) {
      newErrors.expiry = "Expiry date is required.";
    } else {
      const [mm, yy] = formData.expiry.split("/");
      const month = parseInt(mm, 10);
      const year = parseInt("20" + yy, 10);
      const now = new Date();
      if (
        !mm || !yy || month < 1 || month > 12 ||
        year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1)
      ) {
        newErrors.expiry = "Enter a valid expiry date (MM/YY).";
      }
    }

    if (!formData.cvv) {
      newErrors.cvv = "CVV is required.";
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = "CVV must be 3 or 4 digits.";
    }

    if (!formData.billingAddress.trim())
      newErrors.billingAddress = "Billing address is required.";
    if (!formData.city.trim()) newErrors.city = "City is required.";
    if (!formData.zip.trim()) newErrors.zip = "ZIP / postal code is required.";

    return newErrors;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "cardNumber") value = formatCardNumber(value);
    if (name === "expiry") value = formatExpiry(value);
    if (name === "cvv") value = formatCVV(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment successful!</h2>
          <p className="text-gray-500 text-sm">
            Your payment has been processed. A receipt will be sent to your email.
          </p>
          <button
            onClick={() => { setSubmitted(false); setFormData({ cardholderName: "", cardNumber: "", expiry: "", cvv: "", billingAddress: "", city: "", zip: "" }); }}
            className="mt-6 text-sm text-indigo-600 hover:underline"
          >
            Make another payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payment details</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your card information to complete your purchase.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder name</label>
            <input
              name="cardholderName"
              type="text"
              autoComplete="cc-name"
              value={formData.cardholderName}
              onChange={handleChange}
              placeholder="Jane Doe"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.cardholderName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
            />
            {errors.cardholderName && <p className="mt-1 text-xs text-red-500">{errors.cardholderName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
            <div className="relative">
              <input
                name="cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={formData.cardNumber}
                onChange={handleChange}
                placeholder="1234 5678 9012 3456"
                className={`w-full rounded-lg border px-4 py-2.5 pr-12 text-sm text-gray-900 placeholder-gray-400 font-mono outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.cardNumber ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-300"
                fill="none" viewBox="0 0 32 24" stroke="currentColor"
              >
                <rect x="1" y="1" width="30" height="22" rx="3" strokeWidth="1.5" />
                <path d="M1 8h30" strokeWidth="1.5" />
              </svg>
            </div>
            {errors.cardNumber && <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
              <input
                name="expiry"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={formData.expiry}
                onChange={handleChange}
                placeholder="MM/YY"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 font-mono outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.expiry ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.expiry && <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                name="cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="•••"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 font-mono outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.cvv ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors.cvv && <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium text-gray-700 mb-4">Billing address</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street address</label>
                <input
                  name="billingAddress"
                  type="text"
                  autoComplete="street-address"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  placeholder="123 Main St"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.billingAddress ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                  }`}
                />
                {errors.billingAddress && <p className="mt-1 text-xs text-red-500">{errors.billingAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.city ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal code</label>
                  <input
                    name="zip"
                    type="text"
                    autoComplete="postal-code"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="10001"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.zip ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                  />
                  {errors.zip && <p className="mt-1 text-xs text-red-500">{errors.zip}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Your payment information is encrypted and secure.</span>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition"
          >
            Pay now
          </button>
        </form>
      </div>
    </div>
  );
}
