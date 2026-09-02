import { CartItem } from '../entities/CartItem';

export interface CartData {
    items: CartItem[];
    restaurantId?: string;
    restaurantName?: string;
}

export interface ICartRepository {
    getCart(): CartData;
    saveCart(data: CartData): void;
    clearCart(): void;
}
