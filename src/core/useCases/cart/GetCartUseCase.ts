import { ICartRepository, CartData } from '../../repositories/ICartRepository';

export class GetCartUseCase {
    constructor(private repository: ICartRepository) { }

    execute(): CartData {
        return this.repository.getCart();
    }
}
