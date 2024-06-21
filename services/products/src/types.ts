export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface IStock {
  product_id: string;
  count: number;
}

export interface IAvailableProduct extends IProduct {
  count: number;
}
