import { Restaurant } from '../../presentation/context/FilterContext';

export interface IRestaurantRepository {
    getRestaurants(): Promise<Restaurant[]>;
    getRestaurantById(id: string): Promise<Restaurant | null>;
}
