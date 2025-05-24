import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('位置情報へのアクセス許可が必要です');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const startLocationTracking = async () => {
    if (permissionStatus !== 'granted') {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('位置情報へのアクセス許可が必要です');
        return false;
      }
    }

    setIsTracking(true);
    
    // 位置情報の監視を開始
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // 10メートル移動ごとに更新
        timeInterval: 5000    // 5秒ごとに更新
      },
      (newLocation) => {
        setLocation(newLocation);
      }
    );
    
    return true;
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
    // 位置情報の監視を停止
    // 実際の実装ではwatchPositionAsyncの戻り値を保存して、そのremove()を呼び出す
  };

  const getCurrentLocation = async () => {
    if (permissionStatus !== 'granted') {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('位置情報へのアクセス許可が必要です');
        return null;
      }
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    return location;
  };

  return (
    <LocationContext.Provider value={{ 
      location, 
      errorMsg, 
      permissionStatus,
      isTracking,
      startLocationTracking,
      stopLocationTracking,
      getCurrentLocation
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
