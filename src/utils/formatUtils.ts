/**
 * formatPrice
 * Formats a price value to show decimal points only if they are non-zero.
 * e.g., 500 -> "500", 500.50 -> "500.50"
 */
export const formatPrice = (price: number | string): string => {
    if (price === undefined || price === null) return '0';
    
    const num = typeof price === 'string' 
        ? parseFloat(price.replace(/[^0-9.]/g, '')) 
        : price;
        
    if (isNaN(num)) return '0';
    
    // Check if it's an integer
    if (Number.isInteger(num)) {
        return num.toString();
    }
    
    // Otherwise show up to 2 decimal places, but remove trailing zeros
    const fixed = num.toFixed(2);
    if (fixed.endsWith('.00')) {
        return num.toString();
    }
    if (fixed.endsWith('0') && fixed.includes('.')) {
        return num.toFixed(1);
    }
    
    return fixed;
};
