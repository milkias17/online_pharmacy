const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL;
const INV_BASE = process.env.NEXT_PUBLIC_INVENTORY_API_URL;
const ORD_BASE = process.env.NEXT_PUBLIC_ORDERS_API_URL;

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${AUTH_BASE}/auth/login/`,     
    REGISTER: `${AUTH_BASE}/auth/register/`,
  },
  INVENTORY: {
    GET_ALL: `${INV_BASE}/inventory/medicines`, 
  },
  ORDERS: {
    CREATE: `${ORD_BASE}/api/orders/`,
  }
};