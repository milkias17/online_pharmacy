const INV_BASE = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
const ORD_BASE = process.env.NEXT_PUBLIC_ORDERS_API_URL;

export const ENDPOINTS = {
  INVENTORY: {
    GET_ALL: `${INV_BASE}/medicines`,
    GET_BY_ID: (id: number) => `${INV_BASE}/medicines/${id}`,
    SEARCH: (name: string) => `${INV_BASE}/medicines?name=${name}`,
    UPDATE_STOCK: (id: number) => `${INV_BASE}/medicines/${id}/stock`,
  },
  ORDERS: {
    CREATE: `${ORD_BASE}/orders/`,
    LIST: `${ORD_BASE}/orders/list/`,
    DETAIL: (id: string) => `${ORD_BASE}/orders/${id}/`,
  }
};