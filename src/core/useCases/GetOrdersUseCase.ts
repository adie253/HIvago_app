import { IOrderRepository } from '../repositories/IOrderRepository';
import { Order } from '../entities/Order';

export class GetOrdersUseCase {
    constructor(private orderRepository: IOrderRepository) { }

    async execute(): Promise<Order[]> {
        // We can add additional business logic or mapping here if needed.
        return this.orderRepository.getOrders();
    }
}
