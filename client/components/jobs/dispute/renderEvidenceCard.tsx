"use client";

import { DisputeFileAttachment } from "@/lib/api";
import EvidenceCard from "./EvidenceCard";

export default function renderEvidenceCard(
  attachment?: DisputeFileAttachment,
  fallbackUrl?: string,
  label?: string
) {
  const url = attachment?.secureUrl || fallbackUrl;
  if (!url) return null;
  return (
    <EvidenceCard
      url={url}
      name={attachment?.originalFilename || label}
      size={attachment?.readableSize}
      label={label}
    />
  );
}
