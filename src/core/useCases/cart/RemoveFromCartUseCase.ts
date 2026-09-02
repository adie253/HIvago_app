import { ICartRepository, CartData } from '../../repositories/ICartRepository';

export class RemoveFromCartUseCase {
    constructor(private repository: ICartRepository) { }

    execute(itemId: string): CartData {
        const cartData = this.repository.getCart();
        const existingItem = cartData.items.find(i => i.id === itemId);

        if (existingItem) {
            if (existingItem.quantity > 1) {
                existingItem.quantity -= 1;
            } else {
                cartData.items = cartData.items.filter(i => i.id !== itemId);
            }
        }

        // Optional: clear restaurant info if cart becomes empty
        if (cartData.items.length === 0) {
            cartData.restaurantId = undefined;
            cartData.restaurantName = undefined;
        }

        this.repository.saveCart(cartData);
        return cartData;
    }
}
