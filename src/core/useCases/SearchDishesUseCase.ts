import { FoodItem } from '../../presentation/context/FilterContext';
import { searchDishes } from '../../data/api';

export class SearchDishesUseCase {
    async execute(query: string): Promise<FoodItem[]> {
        return searchDishes(query);
    }
}
