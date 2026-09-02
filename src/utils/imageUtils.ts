/**
 * getFallbackImage
 * Provides a branded fallback image when the source is missing or broken.
 * @param name - The name of the item (unused now, kept for signature compatibility)
 * @param category - The category of the item (unused now, kept for signature compatibility)
 * @param type - Whether it's a 'food' item or a 'restaurant'
 */
export const getFallbackImage = (_name: string, _category: string = '', type: 'food' | 'restaurant' = 'food'): string => {
    if (type === 'restaurant') {
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800';
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
};
