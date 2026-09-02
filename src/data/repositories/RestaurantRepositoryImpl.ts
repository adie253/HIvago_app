import { IRestaurantRepository } from '../../core/repositories/IRestaurantRepository';
import { Restaurant } from '../../presentation/context/FilterContext';
import { fetchRestaurants, fetchRestaurantById } from '../api';

export class RestaurantRepositoryImpl implements IRestaurantRepository {
    async getRestaurants(): Promise<Restaurant[]> {
        return fetchRestaurants();
    }

    async getRestaurantById(id: string): Promise<Restaurant | null> {
        return fetchRestaurantById(id);
    }
}
