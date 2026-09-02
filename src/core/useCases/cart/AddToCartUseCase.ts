import { CartItem } from '../../entities/CartItem';
import { ICartRepository, CartData } from '../../repositories/ICartRepository';

export class AddToCartUseCase {
    constructor(private repository: ICartRepository) { }

    execute(item: Omit<CartItem, 'quantity'>, restaurantId?: string, restaurantName?: string): CartData {
        const cartData = this.repository.getCart();

        // If restaurant changes, clear previous items
        if (restaurantId && cartData.restaurantId && cartData.restaurantId !== restaurantId) {
            cartData.items = [];
        }

        if (restaurantId) cartData.restaurantId = restaurantId;
        if (restaurantName) cartData.restaurantName = restaurantName;

        const existingItem = cartData.items.find(i => i.id === item.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartData.items.push({ ...item, quantity: 1 });
        }

        this.repository.saveCart(cartData);
        return cartData;
    }
}
