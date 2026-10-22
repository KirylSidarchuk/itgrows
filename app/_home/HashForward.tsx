"use client"

import { useEffect } from "react"

// Links into the old LinkedIn/X landing (#pricing, #how-it-works …) from emails, the blog and the
// company page keep working: the landing moved to /personal, so those anchors are sent there.
const OLD = new Set(["#pricing", "#how-it-works", "#ghost-mode", "#ghost-form", "#results", "#faq"])

export default function HashForward() {
  useEffect(() => {
    if (OLD.has(window.location.hash)) window.location.replace("/personal" + window.location.search + window.location.hash)
  }, [])
  return null
}
