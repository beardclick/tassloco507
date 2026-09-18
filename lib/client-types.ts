// Client-safe types (no Node.js imports). Shared between server and client.

export interface ProductSummary {
  slug: string;
  name: string;
  price: number;
  regularPrice?: number;
  onSale: boolean;
  inStock: boolean;
  image: string | null;
  categoryNames: string[];
  link: string;
  quoteOnly: boolean;
  hidePrice: boolean;
}

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  regularPrice?: number;
  onSale: boolean;
  image: string | null;
  link: string;
  qty: number;
}
