import { Order } from '../entities/Order';

export interface IOrderRepository {
    getOrders(): Promise<Order[]>;
    getOrderById(id: string): Promise<Order | null>;
    createOrder(order: Omit<Order, 'id'>): Promise<Order>;
    updateOrderStatus(id: string, status: Order['status']): Promise<Order>;
}
