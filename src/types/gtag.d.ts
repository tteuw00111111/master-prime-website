// src/types/gtag.d.ts
export {};

declare global {
  /**
   * Tipagem mínima e segura para conversão do Google Ads.
   * Evite declarar `gtag` em componentes. Declare aqui uma única vez.
   */
  interface Window {
    gtag?: (
      type: "event",
      eventName: "conversion",
      eventParams: {
        send_to: string;
        value?: number;
        currency?: string;
      }
    ) => void;
  }
}
