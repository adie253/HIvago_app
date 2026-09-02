import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context Providers
import { ToastProvider } from './src/presentation/context/ToastContext';
import { GoogleMapsProvider } from './src/presentation/context/GoogleMapsContext';
import { LocationProvider } from './src/presentation/context/LocationContext';
import { FilterProvider } from './src/presentation/context/FilterContext';
import { CartProvider } from './src/presentation/context/CartContext';
import { FavoritesProvider } from './src/presentation/context/FavoritesContext';
import { NotificationProvider } from './src/presentation/context/NotificationContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Screens
import { SignInScreen } from './src/presentation/screens/SignInScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { SearchScreen } from './src/presentation/screens/SearchScreen';
import { RestaurantMenuScreen } from './src/presentation/screens/RestaurantMenuScreen';
import { CartScreen } from './src/presentation/screens/CartScreen';
import { PaymentWebViewScreen } from './src/presentation/screens/PaymentWebViewScreen';
import { OrderTrackingScreen } from './src/presentation/screens/OrderTrackingScreen';
import { OrdersListScreen } from './src/presentation/screens/OrdersListScreen';
import { ProfileScreen } from './src/presentation/screens/ProfileScreen';

// Icons
import { Home, Search, ShoppingBag, User as UserIcon } from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF4732',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersListScreen} 
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

import { initStorage } from './src/utils/storage';
import { ActivityIndicator, View } from 'react-native';

const queryClient = new QueryClient();

export default function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    initStorage()
      .then(() => setStorageReady(true))
      .catch((err) => {
        console.error('Failed to initialize storage', err);
        setStorageReady(true);
      });
  }, []);

  if (!storageReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF4732" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <GoogleMapsProvider>
            <LocationProvider>
              <FilterProvider>
                <CartProvider>
                  <FavoritesProvider>
                    <NotificationProvider>
                      <NavigationContainer>
                        <StatusBar style="dark" />
                        <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                          <Stack.Screen name="SignIn" component={SignInScreen} />
                          <Stack.Screen name="RestaurantMenu" component={RestaurantMenuScreen} />
                          <Stack.Screen name="Cart" component={CartScreen} />
                          <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
                          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                        </Stack.Navigator>
                      </NavigationContainer>
                    </NotificationProvider>
                  </FavoritesProvider>
                </CartProvider>
              </FilterProvider>
            </LocationProvider>
          </GoogleMapsProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
