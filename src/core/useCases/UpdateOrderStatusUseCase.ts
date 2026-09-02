import { IOrderRepository } from '../repositories/IOrderRepository';
import { Order } from '../entities/Order';

export class UpdateOrderStatusUseCase {
    constructor(private orderRepository: IOrderRepository) { }

    async execute(id: string, status: Order['status']): Promise<Order> {
        return this.orderRepository.updateOrderStatus(id, status);
    }
}
