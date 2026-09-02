import { IOrderRepository } from '../repositories/IOrderRepository';
import { Order } from '../entities/Order';

export class CreateOrderUseCase {
    constructor(private repository: IOrderRepository) { }

    async execute(order: Omit<Order, 'id'>): Promise<Order> {
        return this.repository.createOrder(order);
    }
}
