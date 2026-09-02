import { IRestaurantRepository } from '../repositories/IRestaurantRepository';
import { Restaurant } from '../../presentation/context/FilterContext';

export class GetRestaurantUseCase {
    constructor(private repository: IRestaurantRepository) { }

    async execute(id: string): Promise<Restaurant | null> {
        return this.repository.getRestaurantById(id);
    }
}
