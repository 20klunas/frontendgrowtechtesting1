"use client";

import { useState } from "react";
import Popup from "../Popup";

export default function HomePopupClient({ popup }) {
  const [open, setOpen] = useState(true);

  // Guard clause
  if (!popup || !popup?.is_active || !open) {
    return null;
  }

  return (
    <Popup
      title={popup?.title}
      content={popup?.content}
      image={popup?.image_url}
      ctaText={popup?.cta_text}
      ctaUrl={popup?.cta_url}
      onClose={() => setOpen(false)}
    />
  );
}