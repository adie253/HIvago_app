import { Restaurant } from '../../presentation/context/FilterContext';

export const mockRestaurants: any[] = [
    {
        id: "r1",
        name: "Atithi Pure Veg",
        cuisines: ["North Indian", "South Indian"],
        rating: 4.5,
        deliveryTime: "30-35 min",
        distance: "2.5 km",
        costForTwo: "₹300",
        imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&q=80&w=400",
        promoted: true,
        discount: "50% OFF up to ₹100"
    },
    {
        id: "r2",
        name: "Pizza Hut",
        cuisines: ["Pizzas", "Italian", "Desserts"],
        rating: 4.0,
        deliveryTime: "40-45 min",
        distance: "4.1 km",
        costForTwo: "₹500",
        imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "r3",
        name: "Burger King",
        cuisines: ["Burgers", "American"],
        rating: 4.2,
        deliveryTime: "25-30 min",
        distance: "1.2 km",
        costForTwo: "₹350",
        imageUrl: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&q=80&w=400",
        discount: "60% OFF"
    },
    {
        id: "r4",
        name: "Leon's Burgers & Wings",
        cuisines: ["American", "Snacks"],
        rating: 4.4,
        deliveryTime: "35-40 min",
        distance: "3.5 km",
        costForTwo: "₹400",
        imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "r5",
        name: "Sushi Daily",
        cuisines: ["Japanese", "Sushi", "Asian"],
        rating: 4.8,
        deliveryTime: "45-50 min",
        distance: "5.2 km",
        costForTwo: "₹800",
        imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400",
        promoted: true,
        discount: "15% OFF"
    },
    {
        id: "r6",
        name: "Taco Bell",
        cuisines: ["Mexican", "Fast Food"],
        rating: 4.1,
        deliveryTime: "20-25 min",
        distance: "1.8 km",
        costForTwo: "₹250",
        imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "r7",
        name: "Green Bowl Salads",
        cuisines: ["Healthy", "Salads"],
        rating: 4.6,
        deliveryTime: "30-40 min",
        distance: "3.0 km",
        costForTwo: "₹350",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400"
    },
    {
        id: "r8",
        name: "The Wok Chinese",
        cuisines: ["Chinese", "Asian", "Noodles"],
        rating: 4.3,
        deliveryTime: "40-50 min",
        distance: "4.5 km",
        costForTwo: "₹450",
        imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400",
        discount: "20% OFF on all items"
    }
];
