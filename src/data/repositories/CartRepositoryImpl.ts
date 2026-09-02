import { ICartRepository, CartData } from '../../core/repositories/ICartRepository';

export class CartRepositoryImpl implements ICartRepository {
    private readonly STORAGE_KEY = 'hivago_cart_v2';

    getCart(): CartData {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { items: [] };
        } catch (error) {
            console.error('Failed to load cart from local storage', error);
            return { items: [] };
        }
    }

    saveCart(data: CartData): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save cart to local storage', error);
        }
    }

    clearCart(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
