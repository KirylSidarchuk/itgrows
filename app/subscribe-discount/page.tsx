"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

function SubscribeDiscountContent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    const email = searchParams.get("email") ?? undefined

    fetch("/api/stripe/checkout-discount", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
  }, [searchParams])

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          gap: "16px",
        }}
      >
        <p style={{ color: "#dc2626", fontSize: "18px" }}>Something went wrong.</p>
        <a href="/cabinet" style={{ color: "#059669", textDecoration: "underline" }}>
          Go back to your account
        </a>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #e5e7eb",
          borderTop: "4px solid #059669",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#6b7280" }}>Redirecting to checkout...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function SubscribeDiscountPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280", fontFamily: "sans-serif" }}>Loading...</p>
      </div>
    }>
      <SubscribeDiscountContent />
    </Suspense>
  )
}
