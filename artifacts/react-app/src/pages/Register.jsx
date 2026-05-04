import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const RULES = {
  name: {
    regex: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-]{2,50}$/,
    message: "Name must be 2–50 characters and contain only letters, spaces, hyphens or apostrophes.",
  },
  email: {
    regex: /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
    message: "Enter a valid email address (e.g. jane@example.com).",
  },
  password: {
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    message: "Password must be 8+ characters and include uppercase, lowercase, a number, and a special character.",
  },
};

function validateField(name, value) {
  if (!value.trim()) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
  const rule = RULES[name];
  if (rule && !rule.regex.test(value)) return rule.message;
  return null;
}

export default function Register() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    for (const field of ["name", "email", "password"]) {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.name } },
    });

    setLoading(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else if (!data.user) {
      setStatus({ type: "error", message: "An account with this email already exists. Please sign in instead." });
    } else {
      // Redirect to payment immediately after successful registration
      navigate("/payment");
    }
  };

  const fields = [
    { name: "name",     label: "Full name",      type: "text",     autoComplete: "name",         placeholder: "Jane Doe",           hint: "Letters, spaces, hyphens and apostrophes only" },
    { name: "email",    label: "Email address",  type: "email",    autoComplete: "email",         placeholder: "jane@example.com",   hint: "Must be a valid email address" },
    { name: "password", label: "Password",       type: "password", autoComplete: "new-password",  placeholder: "Min. 8 characters",  hint: "Uppercase, lowercase, number and special character" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to get started.</p>
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
          {fields.map(({ name, label, type, autoComplete, placeholder, hint }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                autoComplete={autoComplete}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors[name] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                }`}
              />
              {errors[name]
                ? <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
                : <p className="mt-1 text-xs text-gray-400">{hint}</p>
              }
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
