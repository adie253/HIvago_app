import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface CustomMapViewProps {
  style?: any;
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
}

export const CustomMapView: React.FC<CustomMapViewProps> = ({
  style,
  latitude,
  longitude,
}) => {
  return (
    <View style={[style, styles.webMapContainer]}>
      <MapPin size={32} color="#FF4732" />
      <Text style={styles.webMapText}>
        Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  webMapContainer: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  webMapText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
});
