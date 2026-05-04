
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../../services/authService";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!formData.password.trim()) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  };


  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    // Map formData to backend expected fields
    const payload = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phoneNumber,
    };
    try {
      await registerCustomer(payload);
      alert("Registration successful! Please login.");
      navigate("/user/login");
    } catch (error) {
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Registration failed. Please try again.");
      }
      setErrors((prev) => ({ ...prev, api: error?.response?.data?.message || "Registration failed." }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] bg-gradient-to-r from-blue-200 via-cyan-200 to-emerald-200 p-[2px] shadow-sm">
          <div className="rounded-[26px] border border-white/70 bg-white p-6 sm:p-8">
            <div className="mb-7 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                Q
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Queue Portal
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Create Account</h1>
              <p className="mt-2 text-sm text-slate-600">
                Register to book tokens faster and manage your queue visits.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    errors.fullName
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName ? <p className="mt-1.5 text-xs text-red-600">{errors.fullName}</p> : null}
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    errors.email
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email ? <p className="mt-1.5 text-xs text-red-600">{errors.email}</p> : null}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    errors.password
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-cyan-400 focus:ring-cyan-100"
                  }`}
                  placeholder="Create a password"
                />
                {errors.password ? <p className="mt-1.5 text-xs text-red-600">{errors.password}</p> : null}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone Number <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="e.g. +94 77 123 4567"
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/user/login"
                className="font-semibold text-cyan-700 transition hover:text-cyan-800"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
