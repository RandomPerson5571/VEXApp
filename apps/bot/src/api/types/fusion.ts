export type FusionWebhookPayload = {
  hook?: {
    hookId?: string;
    event?: string;
    tenant?: string;
    callbackUrl?: string;
    createdBy?: string;
    createdDate?: string;
    system?: string;
    creatorType?: string;
    status?: string;
    scope?: {
      folder?: string;
    };
    urn?: string;
    __self__?: string;
  };
  payload?: Record<string, unknown>;
};

export function isFusionWebhookPayload(value: unknown): value is FusionWebhookPayload {
  return Boolean(value && typeof value === "object");
}
