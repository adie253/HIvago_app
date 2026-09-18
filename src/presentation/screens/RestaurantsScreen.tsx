import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useFilters, Restaurant } from '../context/FilterContext';
import { useFavorites } from '../context/FavoritesContext';
import { ArrowLeft, Search, Star, Clock, Heart, SlidersHorizontal } from 'lucide-react-native';

export const RestaurantsScreen = ({ navigation }: { navigation: any }) => {
    const { 
        searchQuery, setSearchQuery,
        activeCategory, setActiveCategory,
        isVegOnly, setIsVegOnly,
        filteredRestaurants, isLoading
    } = useFilters();

    const { toggleFavorite, isFavorite } = useFavorites();

    const CATEGORIES = ['All', 'Burgers', 'Pizza', 'Sushi', 'Tacos', 'North Indian', 'Chinese', 'Desserts'];

    const renderRestaurantCard = ({ item }: { item: Restaurant }) => {
        const isFav = isFavorite(item.id);

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('RestaurantMenu', { restaurantId: item.id, restaurantName: item.name })}
                activeOpacity={0.9}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    {item.discount && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.discount}</Text>
                        </View>
                    )}
                    <TouchableOpacity 
                        style={styles.favoriteBtn} 
                        onPress={() => toggleFavorite(item)}
                    >
                        <Heart size={16} color={isFav ? '#A81C1C' : '#6B7280'} fill={isFav ? '#A81C1C' : 'transparent'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                            <Star size={11} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                    </View>

                    <Text style={styles.cuisines} numberOfLines={1}>{item.cuisines.join(', ')}</Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerItem}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.footerText}>{item.deliveryTime}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.distance}</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.footerText}>{item.costForTwo}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Restaurants</Text>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search restaurants or cuisines..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {CATEGORIES.map((cat) => {
                        const isActive = (activeCategory === cat) || (cat === 'All' && !activeCategory);
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                                onPress={() => setActiveCategory(cat === 'All' ? '' : cat)}
                            >
                                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity 
                        style={[styles.vegChip, isVegOnly && styles.vegChipActive]}
                        onPress={() => setIsVegOnly(!isVegOnly)}
                    >
                        <View style={[styles.vegDot, isVegOnly && styles.vegDotActive]} />
                        <Text style={[styles.vegChipText, isVegOnly && styles.vegChipTextActive]}>Pure Veg</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={filteredRestaurants}
                keyExtractor={(item) => item.id}
                renderItem={renderRestaurantCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>No Restaurants Found</Text>
                        <Text style={styles.emptySubtitle}>Try changing your search or filter options</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1F2937',
    },
    filterSection: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categoryScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    categoryChipActive: {
        backgroundColor: '#FF4732',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    categoryTextActive: {
        color: '#FFFFFF',
    },
    vegChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    vegChipActive: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    vegDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#16A34A',
    },
    vegDotActive: {
        backgroundColor: '#FFFFFF',
    },
    vegChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#166534',
    },
    vegChipTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    imageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discountBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#FF4732',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },
    favoriteBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#16A34A',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ratingText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    cuisines: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    dot: {
        color: '#D1D5DB',
        fontSize: 12,
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
});
