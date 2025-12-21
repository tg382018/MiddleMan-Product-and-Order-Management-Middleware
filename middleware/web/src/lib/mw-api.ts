export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type MwProduct = {
  id: string;
  erpId: string;
  sku: string;
  name: string;
  description?: string | null;
  stock: number;
  price: number;
  imageKey?: string | null;
  erpUpdatedAt: string;
  erpDeletedAt?: string | null;
};

export type ShippingAddress = {
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

export type MwOrderItem = {
  id: string;
  erpProductId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type MwOrder = {
  id: string;
  erpId: string;
  status: string;
  totalAmount: number;
  stage?: 'ERP' | 'LOGISTICS';
  logisticsStatus?: string | null;
  sentToLogisticsAt?: string | null;
  shippingAddress?: ShippingAddress | null;
  items: MwOrderItem[];
  user?: MwUser | null;
  erpUpdatedAt: string;
  erpDeletedAt?: string | null;
  updatedAt: string;
};

export type MwUser = {
  id: string;
  erpId: string;
  name: string;
  email: string;
  address: ShippingAddress;
  createdAt: string;
  updatedAt: string;
};

export type MwUserStats = {
  userId: string;
  userName: string;
  orderCount: string;
  totalSpent: string;
};

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      qs.set(k, String(v));
    }
  }
  const res = await fetch(`/backend${path}${qs.toString() ? `?${qs.toString()}` : ''}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string): Promise<T> {
  const res = await fetch(`/backend${path}`, { method: 'POST' });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
