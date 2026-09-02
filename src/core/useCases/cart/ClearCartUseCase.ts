import { ICartRepository } from '../../repositories/ICartRepository';

export class ClearCartUseCase {
    constructor(private repository: ICartRepository) { }

    execute(): void {
        this.repository.clearCart();
    }
}
