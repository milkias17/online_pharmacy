const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE}${process.env.NEXT_PUBLIC_AUTH_PREFIX}/api/auth/login/`,
    REGISTER: `${BASE}${process.env.NEXT_PUBLIC_AUTH_PREFIX}/api/auth/register/`,
  },

  INVENTORY: {
    GET_ALL: `${BASE}${process.env.NEXT_PUBLIC_INV_PREFIX}/inventory/medicines`,
    GET_BY_ID: (id: number) =>
      `${BASE}${process.env.NEXT_PUBLIC_INV_PREFIX}/inventory/medicines/${id}`,
  },

  ORDERS: {
    CREATE: `${BASE}${process.env.NEXT_PUBLIC_ORDER_PREFIX}/api/orders/`,
  },

  PAYMENT: {
    CHECKOUT: `${BASE}${process.env.NEXT_PUBLIC_PAY_PREFIX}/api/v1/checkout/`,
  },

  NOTIFICATIONS: {
    LIST: `${BASE}${process.env.NEXT_PUBLIC_NOTIF_PREFIX}/v1/notifications`,
  },
};