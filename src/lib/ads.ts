// src/lib/ads.ts

export type AdsConversionFn = (
  type: "event",
  eventName: "conversion",
  eventParams: { send_to: string; value?: number; currency?: string }
) => void;

/** Dispara conversão do Google Ads de forma segura (sem any). */
export function fireAdsConversion(
  sendTo: string,
  opts?: { value?: number; currency?: string }
): void {
  if (typeof window === "undefined") return;

  const w = window as unknown as {
    gtag?: AdsConversionFn | ((...args: unknown[]) => unknown);
  };

  if (typeof w.gtag === "function") {
    (w.gtag as AdsConversionFn)("event", "conversion", {
      send_to: sendTo,
      ...(opts?.value !== undefined
        ? { value: opts.value, currency: opts.currency ?? "BRL" }
        : {}),
    });
  }
}
