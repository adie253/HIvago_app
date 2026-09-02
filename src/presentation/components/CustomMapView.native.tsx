import React from 'react';
import MapView, { Marker } from 'react-native-maps';

interface CustomMapViewProps {
  style?: any;
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export const CustomMapView: React.FC<CustomMapViewProps> = ({
  style,
  latitude,
  longitude,
  onLocationChange,
}) => {
  return (
    <MapView
      style={style}
      region={{
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      onRegionChangeComplete={(reg) => {
        onLocationChange(reg.latitude, reg.longitude);
      }}
    >
      <Marker
        coordinate={{ latitude, longitude }}
        draggable
        onDragEnd={(e) => {
          onLocationChange(
            e.nativeEvent.coordinate.latitude,
            e.nativeEvent.coordinate.longitude
          );
        }}
        pinColor="#FF4732"
      />
    </MapView>
  );
};
