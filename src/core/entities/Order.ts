export class Order {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: string[],
    public readonly totalAmount: number,
    public readonly status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
  ) {}
}
