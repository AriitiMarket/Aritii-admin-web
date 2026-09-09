/** Platform settings surfaces. */
export interface PlatformSettings {
  currency: string;
  currencySymbol: string;
  deliveryRate: number;
  commissionRate: number;
  defaultSector: string;
}

export interface NotificationsSettings {
  orderCreated: boolean;
  orderDelivered: boolean;
  riderAssigned: boolean;
  disputeRaised: boolean;
  reviewSubmitted: boolean;
}

export interface SystemSettings {
  underMaintenance: boolean;
  forceUpdateEnabled: boolean;
  maxRetryAttempts: number;
  requestTimeoutMs: number;
}