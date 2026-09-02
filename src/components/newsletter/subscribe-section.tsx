"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function SubscribeSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 600);
  };

  return (
    <section className="py-14 sm:py-18 bg-gradient-to-r from-[#0d3859] via-[#0c6291] to-[#0d3859] relative overflow-hidden text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Titles */}
          <div className="lg:col-span-6 space-y-2 text-center lg:text-left">
            <p className="text-xs sm:text-sm font-semibold text-[#49c2f5] tracking-wide">
              Receive the latest Loadlinkers resources.
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Subscribe to Updates
            </h2>
          </div>

          {/* Right: Email Form */}
          <div className="lg:col-span-6">
            {status === "success" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/20 text-white animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-[#00d084] flex-shrink-0" />
                <p className="text-sm font-medium">
                  Thank you! You have been successfully subscribed to Loadlinkers updates.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="Enter your business email"
                    className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/25 placeholder:text-white/50 text-white focus:outline-none focus:border-[#49c2f5] focus:bg-white/15 transition-all text-sm"
                    required
                  />
                  {status === "error" && (
                    <p className="text-xs text-red-300 mt-1.5 pl-4">{errorMsg}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-8 py-3.5 rounded-full bg-white text-[#18171d] font-bold text-xs uppercase tracking-wider hover:bg-[#49c2f5] hover:text-white transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {status === "loading" ? "Subscribing..." : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
