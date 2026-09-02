import { Order } from '../../core/entities/Order';

export const mockOrders: Order[] = [
    new Order('1', 'CUST-001', ['Pizza', 'Coke'], 25.50, 'pending'),
    new Order('2', 'CUST-002', ['Burger', 'Fries'], 15.00, 'shipped'),
    new Order('3', 'CUST-003', ['Pasta'], 12.00, 'delivered'),
];
