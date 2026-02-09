export enum UserRole {
  GUEST = 'GUEST',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export enum SaleType {
  ESTABLISHMENT = 'Estabelecimento',
  DELIVERY = 'Encomenda'
}

export enum ClientStatus {
  ACTIVE = 'Ativo',
  OFFLINE = 'Offline'
}

export enum ProductCategory {
  HAMBURGUER = 'Hambúrguer',
  BEBIDAS = 'Bebidas',
  EXTRAS = 'Extras',
  OUTROS = 'Outros'
}

export interface ClientData {
  id: string;
  name: string;
  password?: string; // Optional for security in frontend lists, used in auth
  avatar?: string;
  lastLogin: number;
  status: ClientStatus;
  favorites: string[]; // Array of Product IDs
}

export interface AdminSettings {
  defaultOwnerName: string;
  defaultWhatsapp: string;
  defaultIban: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  ownerName: string;
  whatsapp: string;
  iban: string;
  saleType: SaleType;
  publishedBy: string;
  publishedAt: number;
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
}

export interface Order {
  id: string;
  clientId: string;
  items: CartItem[];
  total: number;
  date: number;
  status: 'Pendente' | 'Concluído' | 'Cancelado';
}

export interface Review {
  id: string;
  productId: string;
  clientId: string;
  clientName: string;
  rating: number; // 1-5
  comment: string;
  date: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: number;
  read: boolean;
  type: 'promo' | 'system' | 'order';
}

export interface UserSession {
  role: UserRole;
  name: string;
  avatar?: string;
}