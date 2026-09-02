import { IOrderRepository } from '../../core/repositories/IOrderRepository';
import { Order } from '../../core/entities/Order';
import { mockOrders } from '../api/MockOrdersData';

export class OrderRepositoryImpl implements IOrderRepository {
    private orders: Order[] = [...mockOrders];

    async getOrders(): Promise<Order[]> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(this.orders), 500); // Simulate network delay
        });
    }

    async getOrderById(id: string): Promise<Order | null> {
        return new Promise((resolve) => {
            const order = this.orders.find(o => o.id === id);
            setTimeout(() => resolve(order || null), 500);
        });
    }

    async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
        return new Promise((resolve) => {
            const newOrder = new Order(
                Math.random().toString(36).substr(2, 9),
                order.customerId,
                order.items,
                order.totalAmount,
                order.status
            );
            this.orders.push(newOrder);
            setTimeout(() => resolve(newOrder), 500);
        });
    }

    async updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const index = this.orders.findIndex(o => o.id === id);
                if (index === -1) {
                    return reject(new Error('Order not found'));
                }

                const updatedOrder = new Order(
                    this.orders[index].id,
                    this.orders[index].customerId,
                    this.orders[index].items,
                    this.orders[index].totalAmount,
                    status
                );
                this.orders[index] = updatedOrder;
                resolve(updatedOrder);
            }, 500);
        });
    }
}
