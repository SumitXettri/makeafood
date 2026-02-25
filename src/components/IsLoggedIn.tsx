import { useState } from "react";
import React from "react";

// ── Icon components with proper TypeScript types ──────────────────────────────

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ChefHat = ({ size = 24, className = "", style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
    <line x1="6" y1="17" x2="18" y2="17" />
  </svg>
);

const Sparkles = ({ size = 24, className = "", style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const Flame = ({ size = 24, className = "", style }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

// ── Particle component ────────────────────────────────────────────────────────

interface ParticleProps {
  style: React.CSSProperties;
}

const Particle = ({ style }: ParticleProps) => (
  <div className="absolute rounded-full pointer-events-none" style={style} />
);

// ── Main component ────────────────────────────────────────────────────────────

interface LoginScreenProps {
  setShowAuthModal: (open: boolean) => void;
}

export default function LoginScreen({ setShowAuthModal }: LoginScreenProps) {
  const [hovered, setHovered] = useState(false);

  const particles: React.CSSProperties[] = [
    {
      width: 6,
      height: 6,
      top: "15%",
      left: "10%",
      background: "rgba(251,146,60,0.5)",
      animation: "float1 6s ease-in-out infinite",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 10,
      height: 10,
      top: "25%",
      right: "12%",
      background: "rgba(239,68,68,0.4)",
      animation: "float2 8s ease-in-out infinite",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 4,
      height: 4,
      top: "70%",
      left: "8%",
      background: "rgba(251,191,36,0.6)",
      animation: "float3 5s ease-in-out infinite",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 8,
      height: 8,
      bottom: "20%",
      right: "10%",
      background: "rgba(251,146,60,0.35)",
      animation: "float1 7s ease-in-out infinite reverse",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 5,
      height: 5,
      top: "45%",
      left: "5%",
      background: "rgba(239,68,68,0.3)",
      animation: "float2 9s ease-in-out infinite",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 7,
      height: 7,
      top: "60%",
      right: "7%",
      background: "rgba(251,191,36,0.5)",
      animation: "float3 6.5s ease-in-out infinite reverse",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 3,
      height: 3,
      top: "80%",
      left: "20%",
      background: "rgba(251,146,60,0.4)",
      animation: "float1 4s ease-in-out infinite",
      position: "absolute",
      borderRadius: "50%",
    },
    {
      width: 9,
      height: 9,
      top: "35%",
      right: "20%",
      background: "rgba(239,68,68,0.25)",
      animation: "float2 10s ease-in-out infinite",
      position: "absolute",
      borderRadius: "50%",
    },
  ];

  const features: { icon: React.ReactNode; label: string }[] = [
    { icon: <Sparkles size={14} />, label: "AI-Powered Recipes" },
    { icon: <Flame size={14} />, label: "Smart Ingredients" },
    { icon: <ChefHat size={14} />, label: "Chef-Grade Results" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33%       { transform: translateY(-15px) translateX(10px); }
          66%       { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes float3 {
          0%, 100% { transform: scale(1) translateY(0px); }
          50%       { transform: scale(1.5) translateY(-12px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(251,146,60,0.4); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 16px rgba(251,146,60,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(251,146,60,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .login-card  { animation: fadeSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .heading-anim{ animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.10s both; }
        .sub-anim    { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .btn-anim    { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
        .badge-item  { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .badge-item:nth-child(1) { animation-delay: 0.30s; }
        .badge-item:nth-child(2) { animation-delay: 0.45s; }
        .badge-item:nth-child(3) { animation-delay: 0.60s; }
        .icon-pulse  { animation: pulse-ring 2.5s ease-in-out infinite; }
        .ring-spin   { animation: spin-slow  20s  linear     infinite; }
        .bg-particles{ animation: fadeIn     1.2s ease        both; }

        .shimmer-btn {
          background: linear-gradient(90deg, #f97316, #ef4444, #fb923c, #ef4444, #f97316);
          background-size: 200% auto;
          transition: all 0.3s ease;
        }
        .shimmer-btn:hover {
          animation: shimmer 1.5s linear infinite;
          box-shadow: 0 20px 40px rgba(239,68,68,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
        .shimmer-btn:active { transform: translateY(0); }
      `}</style>

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #fff7ed 0%, #fef3c7 40%, #fff1f2 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        {[
          {
            top: "-10%",
            left: "-10%",
            width: 500,
            height: 500,
            color: "rgba(251,146,60,0.15)",
          },
          {
            bottom: "-10%",
            right: "-10%",
            width: 600,
            height: 600,
            color: "rgba(239,68,68,0.12)",
          },
          {
            top: "30%",
            right: "-5%",
            width: 300,
            height: 300,
            color: "rgba(251,191,36,0.15)",
          },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...b,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(251,146,60,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Particles */}
        <div
          className="bg-particles"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {particles.map((p, i) => (
            <Particle key={i} style={p} />
          ))}
        </div>

        {/* Card */}
        <div
          className="login-card"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 420,
            margin: "0 24px",
            padding: "48px 40px",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(24px)",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.9)",
            boxShadow:
              "0 32px 80px rgba(239,68,68,0.1), 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Corner accent */}
          <div
            style={{
              position: "absolute",
              top: -1,
              right: -1,
              width: 80,
              height: 80,
              background:
                "linear-gradient(135deg, transparent 50%, rgba(251,146,60,0.12) 50%)",
              borderRadius: "0 28px 0 0",
              pointerEvents: "none",
            }}
          />

          {/* Icon */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <div style={{ position: "relative" }}>
              <div
                className="ring-spin"
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px dashed rgba(251,146,60,0.3)",
                }}
              />
              <div
                className="icon-pulse"
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f97316, #ef4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 16px 48px rgba(239,68,68,0.35)",
                }}
              >
                <ChefHat size={44} style={{ color: "white" }} />
              </div>
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(251,191,36,0.5)",
                  border: "2px solid white",
                }}
              >
                <Sparkles size={12} style={{ color: "white" }} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div
            className="heading-anim"
            style={{ textAlign: "center", marginBottom: 12 }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#f97316",
                marginBottom: 8,
              }}
            >
              ✦ Welcome Back ✦
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36,
                fontWeight: 900,
                lineHeight: 1.1,
                background:
                  "linear-gradient(135deg, #1c1917 0%, #44403c 60%, #78716c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                margin: 0,
              }}
            >
              AI Chef
              <br />
              <span
                style={{
                  background: "linear-gradient(90deg, #f97316, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Assistant
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p
            className="sub-anim"
            style={{
              textAlign: "center",
              color: "#78716c",
              fontSize: 15,
              lineHeight: 1.6,
              margin: "0 0 28px",
              fontWeight: 400,
            }}
          >
            Sign in to unlock ingredient search, personalized recipes, and your
            AI culinary companion.
          </p>

          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="badge-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  background: "rgba(251,146,60,0.08)",
                  border: "1px solid rgba(251,146,60,0.2)",
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#c2410c",
                }}
              >
                <span style={{ color: "#f97316", display: "flex" }}>
                  {f.icon}
                </span>
                {f.label}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(251,146,60,0.2), transparent)",
              marginBottom: 28,
            }}
          />

          {/* CTA */}
          <div className="btn-anim">
            <button
              onClick={() => setShowAuthModal(true)}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="shimmer-btn"
              style={{
                width: "100%",
                padding: "16px 24px",
                border: "none",
                borderRadius: 14,
                color: "white",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                letterSpacing: "0.02em",
              }}
            >
              <span>Login or Sign Up</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  fontSize: 14,
                  transition: "transform 0.2s ease",
                  transform: hovered ? "translateX(3px)" : "translateX(0)",
                }}
              >
                →
              </span>
            </button>
          </div>

          {/* Footer */}
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#a8a29e",
              marginTop: 20,
              marginBottom: 0,
            }}
          >
            Free to use · No credit card required
          </p>
        </div>
      </div>
    </>
  );
}
