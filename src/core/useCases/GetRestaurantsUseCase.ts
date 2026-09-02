import { IRestaurantRepository } from '../repositories/IRestaurantRepository';
import { Restaurant } from '../../presentation/context/FilterContext';

export class GetRestaurantsUseCase {
    constructor(private repository: IRestaurantRepository) { }

    async execute(): Promise<Restaurant[]> {
        return this.repository.getRestaurants();
    }
}
