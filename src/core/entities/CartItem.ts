export interface SelectedAddon {
    id: string;
    name: string;
    price: number;
    groupId?: string;
    groupName?: string;
}

export interface CartItem {
    id: string; // Unique identifier for the cart entry (may include customization hash)
    menuItemId?: string; // The original backend menu item ID
    name: string;
    price: number;
    isVeg: boolean;
    quantity: number;
    isAddon?: boolean;
    description?: string;
    imageUrl?: string;
    customizations?: string;
    selectedAddons?: SelectedAddon[];
}
