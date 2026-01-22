export interface ContractHashData {
  budget: number;
  currency: string;
  deadlineDays: number;
  reviewDays: number;
  requirements: string;
  deliverables: string;
  terms: { title: string; content: string }[];
}

export async function generateContractHash(data: ContractHashData): Promise<string> {
  const parts: (string | number)[] = [
    data.budget,
    data.currency,
    data.deadlineDays,
    data.reviewDays,
    data.requirements || "",
    data.deliverables || "",
  ];
  
  if (data.terms && data.terms.length > 0) {
    for (const term of data.terms) {
      parts.push(term.title || "");
      parts.push(term.content || "");
    }
  }
  
  const str = parts.join("|");
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
