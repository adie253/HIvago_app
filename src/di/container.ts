import { OrderRepositoryImpl } from '../data/repositories/OrderRepositoryImpl';
import { GetOrdersUseCase } from '../core/useCases/GetOrdersUseCase';
import { UpdateOrderStatusUseCase } from '../core/useCases/UpdateOrderStatusUseCase';

import { CartRepositoryImpl } from '../data/repositories/CartRepositoryImpl';
import { AddToCartUseCase } from '../core/useCases/cart/AddToCartUseCase';
import { RemoveFromCartUseCase } from '../core/useCases/cart/RemoveFromCartUseCase';
import { GetCartUseCase } from '../core/useCases/cart/GetCartUseCase';
import { ClearCartUseCase } from '../core/useCases/cart/ClearCartUseCase';

import { RestaurantRepositoryImpl } from '../data/repositories/RestaurantRepositoryImpl';
import { GetRestaurantsUseCase } from '../core/useCases/GetRestaurantsUseCase';
import { SearchDishesUseCase } from '../core/useCases/SearchDishesUseCase';
import { CreateOrderUseCase } from '../core/useCases/CreateOrderUseCase';
import { GetRestaurantUseCase } from '../core/useCases/GetRestaurantUseCase';

class DIContainer {
    private static _orderRepository = new OrderRepositoryImpl();
    private static _cartRepository = new CartRepositoryImpl();
    private static _restaurantRepository = new RestaurantRepositoryImpl();

    static getOrdersUseCase() {
        return new GetOrdersUseCase(this._orderRepository);
    }

    static getCreateOrderUseCase() {
        return new CreateOrderUseCase(this._orderRepository);
    }

    static getUpdateOrderStatusUseCase() {
        return new UpdateOrderStatusUseCase(this._orderRepository);
    }

    static getAddToCartUseCase() {
        return new AddToCartUseCase(this._cartRepository);
    }

    static getRemoveFromCartUseCase() {
        return new RemoveFromCartUseCase(this._cartRepository);
    }

    static getGetCartUseCase() {
        return new GetCartUseCase(this._cartRepository);
    }

    static getClearCartUseCase() {
        return new ClearCartUseCase(this._cartRepository);
    }

    static getGetRestaurantsUseCase() {
        return new GetRestaurantsUseCase(this._restaurantRepository);
    }

    static getSearchDishesUseCase() {
        return new SearchDishesUseCase();
    }

    static getGetRestaurantUseCase() {
        return new GetRestaurantUseCase(this._restaurantRepository);
    }

    static getCartRepository() {
        return this._cartRepository;
    }
}

export default DIContainer;
