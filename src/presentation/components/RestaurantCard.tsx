import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Star, Clock, Heart, ChevronDown } from 'lucide-react-native';
import { Restaurant } from '../context/FilterContext';
import { useFavorites } from '../context/FavoritesContext';

interface RestaurantCardProps {
    restaurant: Restaurant;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress, style }) => {
    const { toggleFavorite, isFavorite } = useFavorites();
    const isFav = isFavorite(restaurant.id);

    // Format ratings count dynamically based on rating for display (e.g. 6.1K ratings)
    const ratingsCountDisplay = React.useMemo(() => {
        const base = Math.round((restaurant.rating || 4.2) * 1.4 * 10) / 10;
        return `${base}K ratings`;
    }, [restaurant.rating]);

    // Format cuisines text (e.g. "pizza" or "burgers, american")
    const cuisinesText = restaurant.cuisines.join(', ').toLowerCase();

    // Location / area line
    const locationText = restaurant.addressLine || 'gadital, hadapsar';

    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={0.92}
        >
            {/* Top Image Banner Box */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: restaurant.imageUrl }} style={styles.image} resizeMode="cover" />

                {/* Pickup Available or Discount Badge (Top Left) */}
                <View style={styles.pickupBadge}>
                    <Text style={styles.pickupBadgeText}>
                        {restaurant.discount ? restaurant.discount.toUpperCase() : 'PICKUP AVAILABLE'}
                    </Text>
                </View>

                {/* Favorite Heart Button (Top Right) */}
                <TouchableOpacity
                    style={styles.favoriteBtn}
                    onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(restaurant);
                    }}
                    activeOpacity={0.8}
                >
                    <Heart
                        size={16}
                        color={isFav ? '#A81C1C' : '#6B7280'}
                        fill={isFav ? '#A81C1C' : 'transparent'}
                    />
                </TouchableOpacity>
            </View>

            {/* Card Content Details */}
            <View style={styles.infoContainer}>
                {/* Title & Rating Row */}
                <View style={styles.headerRow}>
                    <View style={styles.titleColumn}>
                        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                        <Text style={styles.cuisines} numberOfLines={1}>{cuisinesText}</Text>
                    </View>

                    {/* Google Rating Block */}
                    <View style={styles.ratingColumn}>
                        <View style={styles.ratingBadge}>
                            <Text style={styles.ratingText}>{restaurant.rating}</Text>
                            <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                        </View>

                        <View style={styles.googleRow}>
                            <Text style={styles.googleG}>G </Text>
                            <Text style={styles.googleText}>Google</Text>
                        </View>

                        <Text style={styles.ratingsCountText}>{ratingsCountDisplay}</Text>
                    </View>
                </View>

                {/* Distance & Location Row */}
                <View style={styles.locationRow}>
                    <Text style={styles.locationText} numberOfLines={1}>
                        {restaurant.distance} · {locationText}
                    </Text>
                    <ChevronDown size={13} color="#D97706" style={styles.locationArrow} />
                </View>

                {/* Footer Controls Row */}
                <View style={styles.footerRow}>
                    {/* Delivery / Prep Time Chip */}
                    <View style={styles.timeChip}>
                        <Clock size={15} color="#059669" />
                        <Text style={styles.timeText}>{restaurant.deliveryTime}</Text>
                    </View>

                    {/* Directions Action Icon */}
                    <View style={styles.directionBtn}>
                        <Image source={require('../../assets/arrow.png')} style={styles.arrowImage} resizeMode="contain" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        width: '100%',
        height: 165,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#F3F4F6',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    pickupBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    pickupBadgeText: {
        color: '#A81C1C',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    favoriteBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    infoContainer: {
        paddingTop: 10,
        paddingHorizontal: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleColumn: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.2,
    },
    cuisines: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        textTransform: 'lowercase',
    },
    ratingColumn: {
        alignItems: 'flex-end',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#047857',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 7,
    },
    ratingText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    googleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    googleG: {
        fontSize: 9,
        fontWeight: '900',
        color: '#4285F4',
    },
    googleText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#4B5563',
    },
    ratingsCountText: {
        fontSize: 9,
        color: '#9CA3AF',
        marginTop: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    locationArrow: {
        marginLeft: 2,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    timeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 12,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
    },
    directionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowImage: {
        width: 15,
        height: 15,
    },
});
