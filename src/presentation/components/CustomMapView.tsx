import React from 'react';
import { View } from 'react-native';

interface CustomMapViewProps {
  style?: any;
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
}

export const CustomMapView: React.FC<CustomMapViewProps> = ({ style }) => {
  return <View style={style} />;
};
