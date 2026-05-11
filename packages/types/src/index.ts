export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'manager' | 'client' | 'rider';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  restaurantId: string;
  clientId: string;
  riderId?: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
