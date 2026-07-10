import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
  StatusBar,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

// ----------------------------------------------------
// Interfaces & Mock Data
// ----------------------------------------------------

interface GeoRequest {
  ip: string;
  threatLevel: 'Safe' | 'Suspicious' | 'High Risk';
  country: string;
  city: string;
  isp: string;
  latency: string;
  timeAgo: string;
  timeCategory: '1H' | '24H' | '7D';
  xPercent: number;
  yPercent: number;
  latitude: string;
  longitude: string;
}

const allRequests: GeoRequest[] = [
  { ip: '104.244.42.1', threatLevel: 'Safe', country: 'United States', city: 'San Francisco', isp: 'Twitter Inc.', latency: '35ms', timeAgo: '5m ago', timeCategory: '1H', xPercent: 0.20, yPercent: 0.35, latitude: '37.7749° N', longitude: '122.4194° W' },
  { ip: '185.190.140.12', threatLevel: 'High Risk', country: 'Netherlands', city: 'Amsterdam', isp: 'Creanova Hosting', latency: '180ms', timeAgo: '12m ago', timeCategory: '1H', xPercent: 0.48, yPercent: 0.28, latitude: '52.3676° N', longitude: '4.9041° E' },
  { ip: '13.107.4.50', threatLevel: 'Safe', country: 'Japan', city: 'Tokyo', isp: 'Microsoft Corp', latency: '85ms', timeAgo: '42m ago', timeCategory: '1H', xPercent: 0.82, yPercent: 0.38, latitude: '35.6762° N', longitude: '139.6503° E' },
  { ip: '43.205.12.89', threatLevel: 'Suspicious', country: 'India', city: 'Mumbai', isp: 'Amazon Data Services', latency: '120ms', timeAgo: '3h ago', timeCategory: '24H', xPercent: 0.70, yPercent: 0.52, latitude: '19.0760° N', longitude: '72.8777° E' },
  { ip: '185.220.101.5', threatLevel: 'High Risk', country: 'Germany', city: 'Frankfurt', isp: 'Tor Exit Node', latency: '210ms', timeAgo: '6h ago', timeCategory: '24H', xPercent: 0.50, yPercent: 0.32, latitude: '50.1109° N', longitude: '8.6821° E' },
  { ip: '210.140.10.3', threatLevel: 'Safe', country: 'Japan', city: 'Osaka', isp: 'NTT Communications', latency: '98ms', timeAgo: '18h ago', timeCategory: '24H', xPercent: 0.84, yPercent: 0.42, latitude: '34.6937° N', longitude: '135.5023° E' },
  { ip: '103.21.244.0', threatLevel: 'Safe', country: 'Singapore', city: 'Singapore', isp: 'Cloudflare Inc.', latency: '62ms', timeAgo: '2d ago', timeCategory: '7D', xPercent: 0.78, yPercent: 0.58, latitude: '1.3521° N', longitude: '103.8198° E' },
  { ip: '91.198.174.192', threatLevel: 'Safe', country: 'France', city: 'Paris', isp: 'Wikimedia Foundation', latency: '110ms', timeAgo: '4d ago', timeCategory: '7D', xPercent: 0.46, yPercent: 0.33, latitude: '48.8566° N', longitude: '2.3522° E' },
  { ip: '109.201.154.22', threatLevel: 'Suspicious', country: 'Russia', city: 'Moscow', isp: 'Rostelecom PJSC', latency: '195ms', timeAgo: '6d ago', timeCategory: '7D', xPercent: 0.56, yPercent: 0.26, latitude: '55.7558° N', longitude: '37.6173° E' }
];

interface SavedLocation {
  id: number;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string;
  country: string;
  address: string;
  timestamp: string;
}

interface NearbyPlace {
  id: number;
  place_name: string;
  place_type: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  address: string;
}

// ----------------------------------------------------
// UI Integration Constants
// ----------------------------------------------------
const BACKEND_IP = '192.168.39.211';
const API_BASE = `http://${BACKEND_IP}:8002/api/geolocation`;
const DEVICE_ID = 'abc123_device';

// Mock Locations for testing
const testLocations = [
  { id: 't1', name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { id: 't2', name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
  { id: 't3', name: 'New Delhi', latitude: 28.6139, longitude: 77.2090 },
];

export const GeoTrackingScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { colors } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<'Map' | 'CurrentLocation' | 'NearbyPlaces'>('Map');

  // ----------------------------------------------------
  // Tab 1: Map Tracking States
  // ----------------------------------------------------
  const [selectedFilter, setSelectedFilter] = useState<'All' | '1H' | '24H' | '7D'>('All');
  const [selectedRequest, setSelectedRequest] = useState<GeoRequest | null>(allRequests[1]); // Amsterdam default
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [1, 2],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0.8, 0],
  });

  const filteredRequests = allRequests.filter(req => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === '1H') return req.timeCategory === '1H';
    if (selectedFilter === '24H') return req.timeCategory === '1H' || req.timeCategory === '24H';
    if (selectedFilter === '7D') return true;
    return true;
  });

  const renderContinentDot = (cx: number, cy: number, seed: number) => {
    const dots = [];
    const random = (s: number) => {
      const x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };
    let s = seed;
    for (let i = 0; i < 15; i++) {
      const dx = (random(s++) - 0.5) * 35;
      const dy = (random(s++) - 0.5) * 25;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 25) {
        dots.push(
          <Circle
            key={i}
            cx={cx + dx}
            cy={cy + dy}
            r={random(s++) * 2 + 1}
            fill={colors.cyanAccent}
            opacity={0.12}
          />
        );
      }
    }
    return dots;
  };

  const mapWidth = 320;
  const mapHeight = 220;

  // ----------------------------------------------------
  // Tab 2 & 3: Shared Simulation States
  // ----------------------------------------------------
  const [selectedMockIndex, setSelectedMockIndex] = useState<number>(0);
  const currentMockLoc = testLocations[selectedMockIndex];

  // ----------------------------------------------------
  // Tab 2: Current Location (Save & Display) States
  // ----------------------------------------------------
  const [latestLocation, setLatestLocation] = useState<SavedLocation | null>(null);
  const [savedHistory, setSavedHistory] = useState<SavedLocation[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Fetch Location History & Current Location
  const fetchLocationData = async () => {
    setIsLoadingHistory(true);
    try {
      // 1. Fetch Latest Location
      const currentRes = await fetch(`${API_BASE}/current?device_id=${DEVICE_ID}`);
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setLatestLocation(currentData);
      } else {
        setLatestLocation(null);
      }

      // 2. Fetch Location History
      const historyRes = await fetch(`${API_BASE}/location-history?device_id=${DEVICE_ID}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setSavedHistory(historyData);
      }
    } catch (e) {
      console.warn("Unable to connect to database for location data fetching. Using local mock fallbacks.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CurrentLocation') {
      fetchLocationData();
    }
  }, [activeTab]);

  const handleSaveLocation = async () => {
    setIsSaving(true);
    const savePayload = {
      latitude: currentMockLoc.latitude,
      longitude: currentMockLoc.longitude,
      accuracy: 10.0,
    };

    try {
      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: {
          'X-Device-ID': DEVICE_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savePayload),
      });

      if (response.ok) {
        const savedData = await response.json();
        setLatestLocation(savedData);
        setSavedHistory(prev => [savedData, ...prev]);
        Alert.alert("Success", `Saved location: ${savedData.address}`);
      } else {
        throw new Error("Server returned non-200 status");
      }
    } catch (e) {
      // Local Mock Fallback when database is offline
      console.warn("Database save failed. Falling back to local frontend simulation.");
      
      let mockCity = currentMockLoc.name;
      let mockAddress = currentMockLoc.name === 'Chennai' 
        ? "T. Nagar, Chennai, Tamil Nadu 600017" 
        : currentMockLoc.name === 'Bengaluru' 
        ? "Indiranagar, Bengaluru, Karnataka 560038" 
        : "Connaught Place, New Delhi 110001";
      
      const mockSaved: SavedLocation = {
        id: Math.round(Math.random() * 1000),
        device_id: DEVICE_ID,
        latitude: currentMockLoc.latitude,
        longitude: currentMockLoc.longitude,
        accuracy: 10.0,
        city: mockCity,
        country: "India",
        address: mockAddress,
        timestamp: new Date().toISOString(),
      };

      setLatestLocation(mockSaved);
      setSavedHistory(prev => [mockSaved, ...prev]);
      Alert.alert("Offline Save", `Successfully logged location: ${mockAddress} (Local Mode)`);
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------
  // Tab 3: Nearby Places (Infrastructure Scan) States
  // ----------------------------------------------------
  const [radiusKm, setRadiusKm] = useState<string>('5.0');
  const [isScanningInfrastructure, setIsScanningInfrastructure] = useState<boolean>(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [hasScannedNearby, setHasScannedNearby] = useState<boolean>(false);

  const handleSearchNearby = async () => {
    setIsScanningInfrastructure(true);
    const selectedRadius = parseFloat(radiusKm) || 5.0;

    const nearbyPayload = {
      latitude: currentMockLoc.latitude,
      longitude: currentMockLoc.longitude,
      radius_km: selectedRadius,
    };

    try {
      const response = await fetch(`${API_BASE}/nearby`, {
        method: 'POST',
        headers: {
          'X-Device-ID': DEVICE_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nearbyPayload),
      });

      if (response.ok) {
        const data = await response.json();
        setNearbyPlaces(data.places || []);
        setHasScannedNearby(true);
      } else {
        throw new Error("Server returned non-200 status");
      }
    } catch (e) {
      console.warn("Nearby search API failed. Running local Haversine calculations in frontend.");
      
      // Frontend Local Haversine Calculation Fallback
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371.0;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
      };

      // Mock Places Database
      const localMockPlaces = [
        {"id": 101, "place_name": "Chennai Central Railway Station", "place_type": "transport", "latitude": 13.0827, "longitude": 80.2752, "address": "Park Town, Chennai"},
        {"id": 102, "place_name": "Marina Beach", "place_type": "commercial", "latitude": 13.0418, "longitude": 80.2824, "address": "Triplicane, Chennai"},
        {"id": 103, "place_name": "Apollo Hospital, Greams Road", "place_type": "hospital", "latitude": 13.0612, "longitude": 80.2529, "address": "Greams Road, Thousand Lights, Chennai"},
        {"id": 104, "place_name": "IIT Madras Campus", "place_type": "education", "latitude": 12.9915, "longitude": 80.2336, "address": "Adyar, Chennai"},
        {"id": 105, "place_name": "Chennai Police Commissionerate", "place_type": "police", "latitude": 13.0869, "longitude": 80.2785, "address": "Vepery, Chennai"},
        
        {"id": 201, "place_name": "Manipal Hospital Hal Road", "place_type": "hospital", "latitude": 12.9566, "longitude": 77.6482, "address": "HAL Old Airport Rd, Bengaluru"},
        {"id": 202, "place_name": "IISc Campus Bengaluru", "place_type": "education", "latitude": 13.0184, "longitude": 77.5678, "address": "Yeswanthpur, Bengaluru"},
        {"id": 203, "place_name": "Phoenix Marketcity Mall", "place_type": "commercial", "latitude": 12.9958, "longitude": 77.6963, "address": "Whitefield Rd, Mahadevapura, Bengaluru"},
        {"id": 204, "place_name": "Cubbon Park Metro Station", "place_type": "transport", "latitude": 12.9782, "longitude": 77.5985, "address": "Kasturba Rd, Bengaluru"},
        {"id": 205, "place_name": "Ulsoor Police Station", "place_type": "police", "latitude": 12.9754, "longitude": 77.6225, "address": "Halasuru, Bengaluru"},

        {"id": 301, "place_name": "AIIMS Hospital Delhi", "place_type": "hospital", "latitude": 28.5672, "longitude": 77.2100, "address": "Ansari Nagar, New Delhi"},
        {"id": 302, "place_name": "New Delhi Railway Station", "place_type": "transport", "latitude": 28.6418, "longitude": 77.2219, "address": "Bhavbhuti Marg, New Delhi"},
        {"id": 303, "place_name": "Jawaharlal Nehru University (JNU)", "place_type": "education", "latitude": 28.5398, "longitude": 77.1652, "address": "New Mehrauli Road, New Delhi"},
        {"id": 304, "place_name": "Parliament House", "place_type": "commercial", "latitude": 28.6172, "longitude": 77.2081, "address": "Sansad Marg, New Delhi"},
        {"id": 305, "place_name": "Connaught Place Police Station", "place_type": "police", "latitude": 28.6294, "longitude": 77.2173, "address": "Connaught Place, New Delhi"}
      ];

      const filtered = localMockPlaces
        .map(f => {
          const dist = calculateDistance(currentMockLoc.latitude, currentMockLoc.longitude, f.latitude, f.longitude);
          return { ...f, distance_km: dist };
        })
        .filter(f => f.distance_km <= selectedRadius)
        .sort((a, b) => a.distance_km - b.distance_km);

      setNearbyPlaces(filtered);
      setHasScannedNearby(true);
    } finally {
      setIsScanningInfrastructure(false);
    }
  };

  const getCategoryTag = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hospital':
        return { label: 'Hospital 🔴', color: colors.redDanger };
      case 'police':
        return { label: 'Police 🔵', color: colors.blueAccent };
      case 'transport':
        return { label: 'Transport 🟢', color: colors.greenSuccess };
      case 'education':
        return { label: 'Education 🟡', color: colors.orangeWarning };
      default:
        return { label: 'Commercial 🟣', color: colors.purpleAccent };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.contentWrapper}>

        {/* 1. TOP HEADER APP BAR */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-back" color={colors.text} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>API Geolocation Tracker</Text>
            <Text style={styles.headerSubtitle}>Live request mapping & infrastructure scan</Text>
          </View>
        </View>

        {/* SCREEN LEVEL TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Map' && styles.tabButtonActive]}
            onPress={() => setActiveTab('Map')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Map' && styles.tabButtonTextActive]}>Map Tracker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'CurrentLocation' && styles.tabButtonActive]}
            onPress={() => setActiveTab('CurrentLocation')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'CurrentLocation' && styles.tabButtonTextActive]}>Current Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'NearbyPlaces' && styles.tabButtonActive]}
            onPress={() => setActiveTab('NearbyPlaces')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'NearbyPlaces' && styles.tabButtonTextActive]}>Nearby Places</Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* TAB 1: RADAR MAP TRACKER */}
        {/* ======================================================== */}
        {activeTab === 'Map' && (
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {/* TIME RANGE FILTER BUTTONS */}
            <View style={styles.filterRow}>
              {(['1H', '24H', '7D', 'All'] as const).map(filter => {
                const isActive = selectedFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                    onPress={() => {
                      setSelectedFilter(filter);
                      const matching = allRequests.filter(req => {
                        if (filter === 'All') return true;
                        if (filter === '1H') return req.timeCategory === '1H';
                        if (filter === '24H') return req.timeCategory === '1H' || req.timeCategory === '24H';
                        if (filter === '7D') return true;
                        return true;
                      });
                      if (matching.length > 0) {
                        setSelectedRequest(matching[0]);
                      }
                    }}
                  >
                    <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* INTERACTIVE MAP BOX */}
            <View style={styles.mapContainer}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Line
                    key={`h-${i}`}
                    x1="0"
                    y1={(mapHeight / 6) * i}
                    x2="100%"
                    y2={(mapHeight / 6) * i}
                    stroke={colors.border}
                    strokeWidth="0.8"
                    opacity={0.3}
                  />
                ))}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                  <Line
                    key={`v-${i}`}
                    x1={(mapWidth / 10) * i}
                    y1="0"
                    x2={(mapWidth / 10) * i}
                    y2="100%"
                    stroke={colors.border}
                    strokeWidth="0.8"
                    opacity={0.3}
                  />
                ))}
                {renderContinentDot(mapWidth * 0.2, mapHeight * 0.35, 10)}
                {renderContinentDot(mapWidth * 0.3, mapHeight * 0.68, 20)}
                {renderContinentDot(mapWidth * 0.5, mapHeight * 0.38, 30)}
                {renderContinentDot(mapWidth * 0.52, mapHeight * 0.65, 40)}
                {renderContinentDot(mapWidth * 0.75, mapHeight * 0.38, 50)}
                {renderContinentDot(mapWidth * 0.85, mapHeight * 0.72, 60)}
              </Svg>

              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    transform: [{ rotate: spin }],
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
                pointerEvents="none"
              >
                <Svg width="100%" height="100%">
                  <Line
                    x1={mapWidth / 2}
                    y1={mapHeight / 2}
                    x2={mapWidth / 2}
                    y2={0}
                    stroke={colors.purpleAccent}
                    strokeWidth="2"
                    opacity={0.5}
                  />
                </Svg>
              </Animated.View>

              {filteredRequests.map((req) => {
                const isSelected = selectedRequest?.ip === req.ip;
                const markerColor =
                  req.threatLevel === 'High Risk'
                    ? colors.redDanger
                    : req.threatLevel === 'Suspicious'
                    ? colors.orangeWarning
                    : colors.greenSuccess;

                return (
                  <TouchableOpacity
                    key={req.ip}
                    style={[
                      styles.markerContainer,
                      {
                        left: req.xPercent * mapWidth - 15,
                        top: req.yPercent * mapHeight - 15,
                      },
                    ]}
                    onPress={() => setSelectedRequest(req)}
                  >
                    <View style={styles.markerAnchor}>
                      <Animated.View
                        style={[
                          styles.pulsingRing,
                          {
                            borderColor: markerColor,
                            transform: [{ scale: isSelected ? pulseScale : 1.2 }],
                            opacity: isSelected ? pulseOpacity : 0.3,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.markerDot,
                          { backgroundColor: markerColor },
                          isSelected && styles.markerDotSelected,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Text style={styles.liveTrackingText}>Live Tracking: ACTIVE</Text>
              <Text style={styles.gridCoordsText}>GRID: 104°W / 45°N</Text>
            </View>

            {/* IP DETAILS PANEL */}
            {selectedRequest && (
              <View style={[styles.detailsCard, selectedRequest.threatLevel === 'High Risk' && { borderColor: colors.redDanger + '55' }]}>
                <View style={styles.detailsHeader}>
                  <View style={styles.ipRow}>
                    <Icon name="dns" color={colors.cyanAccent} size={18} />
                    <Text style={styles.ipText}>{selectedRequest.ip}</Text>
                  </View>
                  <View style={[styles.badge, {
                    backgroundColor: selectedRequest.threatLevel === 'High Risk' ? colors.redDanger + '26' : selectedRequest.threatLevel === 'Suspicious' ? colors.orangeWarning + '26' : colors.greenSuccess + '26',
                    borderColor: selectedRequest.threatLevel === 'High Risk' ? colors.redDanger : selectedRequest.threatLevel === 'Suspicious' ? colors.orangeWarning : colors.greenSuccess
                  }]}>
                    <Text style={[styles.badgeText, { color: selectedRequest.threatLevel === 'High Risk' ? colors.redDanger : selectedRequest.threatLevel === 'Suspicious' ? colors.orangeWarning : colors.greenSuccess }]}>
                      {selectedRequest.threatLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.detailsGrid}>
                  <View style={styles.gridColumn}>
                    <Text style={styles.detailsLabel}>LOCATION</Text>
                    <View style={styles.locationRow}>
                      <Icon name="globe" color={colors.textMuted} size={13} />
                      <Text style={styles.detailsValue}>{selectedRequest.city}, {selectedRequest.country}</Text>
                    </View>
                  </View>
                  <View style={styles.gridColumn}>
                    <Text style={styles.detailsLabel}>ORGANIZATION</Text>
                    <Text style={styles.detailsValue} numberOfLines={1}>{selectedRequest.isp}</Text>
                  </View>
                </View>

                <View style={[styles.detailsGrid, { marginTop: 12 }]}>
                  <View style={styles.gridColumn}>
                    <Text style={styles.detailsLabel}>LATENCY</Text>
                    <View style={styles.latencyRow}>
                      <Icon name="speed" color={colors.greenSuccess} size={13} />
                      <Text style={styles.detailsValue}>{selectedRequest.latency}</Text>
                    </View>
                  </View>
                  <View style={styles.gridColumn}>
                    <Text style={styles.detailsLabel}>TIME DETECTED</Text>
                    <View style={styles.timeRow}>
                      <Icon name="clock" color={colors.textMuted} size={13} />
                      <Text style={styles.detailsValue}>{selectedRequest.timeAgo}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.listTitle}>Filtered API Logs ({filteredRequests.length})</Text>
            {filteredRequests.map(item => {
              const isSelected = selectedRequest?.ip === item.ip;
              const alertColor = item.threatLevel === 'High Risk' ? colors.redDanger : item.threatLevel === 'Suspicious' ? colors.orangeWarning : colors.greenSuccess;
              return (
                <TouchableOpacity
                  key={item.ip}
                  style={[styles.logItem, isSelected ? styles.logItemActive : styles.logItemInactive, { marginHorizontal: 16 }]}
                  onPress={() => setSelectedRequest(item)}
                >
                  <View style={[styles.logIndicator, { backgroundColor: alertColor }]} />
                  <View style={styles.logTexts}>
                    <Text style={styles.logIp}>{item.ip}</Text>
                    <Text style={styles.logSub}>{item.city}, {item.country}</Text>
                  </View>
                  <View style={styles.logRightCol}>
                    <Text style={styles.logTime}>{item.timeAgo}</Text>
                    <Text style={styles.logLatency}>{item.latency}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CURRENT LOCATION (SAVE & DISPLAY) */}
        {/* ======================================================== */}
        {activeTab === 'CurrentLocation' && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Mock Test Location Selector */}
            <View style={styles.panelCard}>
              <Text style={styles.panelHeaderTitle}>DEVICE GPS EMULATION</Text>
              <Text style={styles.panelHeaderSub}>Set simulated device GPS coordinates for testing</Text>
              <View style={styles.selectorRow}>
                {testLocations.map((loc, idx) => {
                  const isSelected = selectedMockIndex === idx;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.selectorCap, isSelected && styles.selectorCapActive]}
                      onPress={() => setSelectedMockIndex(idx)}
                    >
                      <Text style={[styles.selectorCapText, isSelected && styles.selectorCapTextActive]}>{loc.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.coordsDisplayBox}>
                <Text style={styles.coordsDisplayText}>Simulated Lat: {currentMockLoc.latitude.toFixed(4)}</Text>
                <Text style={styles.coordsDisplayText}>Simulated Lng: {currentMockLoc.longitude.toFixed(4)}</Text>
              </View>
            </View>

            {/* Save Current Location Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, isSaving && { opacity: 0.8 }]}
              onPress={handleSaveLocation}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="location-on" color="#fff" size={18} />
                  <Text style={styles.primaryActionBtnText}>Save Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Active Location Card */}
            <Text style={styles.sectionHeaderTitle}>LATEST SAVED POSITION</Text>
            {latestLocation ? (
              <View style={styles.activeLocationCard}>
                <View style={styles.locationHeaderRow}>
                  <Icon name="check" color={colors.greenSuccess} size={20} />
                  <Text style={styles.activeLocationTitle}>
                    {latestLocation.city}, {latestLocation.country}
                  </Text>
                </View>
                <Text style={styles.activeLocationAddress}>{latestLocation.address}</Text>
                <View style={styles.activeLocationFooter}>
                  <Text style={styles.activeLocationCoords}>
                    Coordinates: {latestLocation.latitude.toFixed(4)}°, {latestLocation.longitude.toFixed(4)}°
                  </Text>
                  <Text style={styles.activeLocationTime}>
                    Saved: {new Date(latestLocation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No location saved yet. Click Save to log your current location.
                </Text>
              </View>
            )}

            {/* Saved Locations History List */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>LOCATION LOG HISTORY</Text>
            {isLoadingHistory ? (
              <ActivityIndicator size="large" color={colors.purpleAccent} style={{ marginTop: 20 }} />
            ) : savedHistory.length > 0 ? (
              savedHistory.map((item, idx) => (
                <View key={item.id || idx} style={styles.historyItemCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyCityText}>{item.city}, {item.country}</Text>
                    <Text style={styles.historyTimeText}>
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </Text>
                  </View>
                  <Text style={styles.historyAddressText}>{item.address}</Text>
                  <Text style={styles.historyCoordsText}>
                    Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)} | Acc: {item.accuracy}m
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No location logs found in storage history.</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ======================================================== */}
        {/* TAB 3: NEARBY PLACES (INFRASTRUCTURE SCAN) */}
        {/* ======================================================== */}
        {activeTab === 'NearbyPlaces' && (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Search Range Card */}
            <View style={styles.panelCard}>
              <Text style={styles.panelHeaderTitle}>SEARCH RADIUS CONFIGURATION</Text>
              <Text style={styles.panelHeaderSub}>Adjust search range for scanning nearby facilities</Text>
              
              <View style={styles.rangeControlRow}>
                <TouchableOpacity
                  style={styles.rangeStepBtn}
                  onPress={() => {
                    const r = Math.max(1, (parseFloat(radiusKm) || 5) - 1);
                    setRadiusKm(r.toFixed(1));
                  }}
                >
                  <Text style={styles.rangeStepText}>-</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.rangeInput}
                  value={radiusKm}
                  onChangeText={setRadiusKm}
                  keyboardType="numeric"
                />
                <Text style={styles.rangeUnitText}>km</Text>

                <TouchableOpacity
                  style={styles.rangeStepBtn}
                  onPress={() => {
                    const r = Math.min(50, (parseFloat(radiusKm) || 5) + 1);
                    setRadiusKm(r.toFixed(1));
                  }}
                >
                  <Text style={styles.rangeStepText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Slider simulation labels */}
              <View style={styles.sliderLabelsRow}>
                <Text style={styles.sliderLabel}>Min: 1 km</Text>
                <Text style={styles.sliderLabel}>Max: 50 km</Text>
              </View>
            </View>

            {/* Search Nearby Infrastructure Button */}
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.blueAccent }, isScanningInfrastructure && { opacity: 0.8 }]}
              onPress={handleSearchNearby}
              disabled={isScanningInfrastructure}
            >
              {isScanningInfrastructure ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="search" color="#fff" size={18} />
                  <Text style={styles.primaryActionBtnText}>Search Nearby Infrastructure</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Infrastructure Results List */}
            <Text style={styles.sectionHeaderTitle}>SCAN RESULTS ({nearbyPlaces.length})</Text>
            {nearbyPlaces.length > 0 ? (
              nearbyPlaces.map(place => {
                const category = getCategoryTag(place.place_type);
                return (
                  <View key={place.id} style={styles.placeCard}>
                    <View style={styles.placeHeaderRow}>
                      <Text style={styles.placeNameText}>{place.place_name}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: category.color + '15', borderColor: category.color }]}>
                        <Text style={[styles.categoryBadgeText, { color: category.color }]}>
                          {category.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.placeAddressText}>{place.address}</Text>
                    <View style={styles.placeFooterRow}>
                      <Text style={styles.placeDistanceText}>Distance: {place.distance_km} km</Text>
                      <Text style={styles.placeCoordsText}>
                        ({place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°)
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  {hasScannedNearby
                    ? "No critical infrastructure found within the selected radius."
                    : "Configure radius and click Search to scan nearby infrastructure."}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

      </View>
    </View>
  );
};

// ----------------------------------------------------
// Stylesheet
// ----------------------------------------------------

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomColor: colors.purpleAccent,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.text,
    fontWeight: 'bold',
  },

  // Tab 1: Map Tracking styles
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  filterBtn: {
    flex: 0.23,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.purpleAccent,
    borderColor: 'transparent',
  },
  filterBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  mapContainer: {
    width: 320,
    height: 220,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  markerContainer: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerAnchor: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulsingRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  markerDotSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  liveTrackingText: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gridCoordsText: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  detailsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    flex: 0.48,
  },
  detailsLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  latencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  logItemActive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.purpleAccent + '33',
  },
  logItemInactive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
  },
  logIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  logTexts: {
    flex: 1,
  },
  logIp: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  logSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  logRightCol: {
    alignItems: 'flex-end',
  },
  logTime: {
    color: colors.textMuted,
    fontSize: 11,
  },
  logLatency: {
    color: colors.greenSuccess,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Tab 2 & 3: Emulation Card styles
  panelCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  panelHeaderTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  panelHeaderSub: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  selectorCap: {
    flex: 0.31,
    height: 34,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  selectorCapActive: {
    borderColor: colors.purpleAccent,
    backgroundColor: colors.purpleAccent + '15',
  },
  selectorCapText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectorCapTextActive: {
    color: colors.purpleAccent,
  },
  coordsDisplayBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  coordsDisplayText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },

  // Action Buttons
  primaryActionBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.purpleAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Active Location Card
  sectionHeaderTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  activeLocationCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.greenSuccess + '33',
    padding: 16,
    marginBottom: 16,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeLocationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  activeLocationAddress: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  activeLocationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activeLocationCoords: {
    color: colors.textMuted,
    fontSize: 10,
  },
  activeLocationTime: {
    color: colors.greenSuccess,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // History logs
  historyItemCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyCityText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  historyTimeText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  historyAddressText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  historyCoordsText: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  emptyCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Tab 3: Nearby Places Range Controls
  rangeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 4,
  },
  rangeStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeStepText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rangeInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    color: colors.text,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 10,
  },
  rangeUnitText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  sliderLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },

  // Place result card
  placeCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  placeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  placeNameText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    flex: 0.68,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  placeAddressText: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  placeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  placeDistanceText: {
    color: colors.blueAccent,
    fontSize: 10,
    fontWeight: 'bold',
  },
  placeCoordsText: {
    color: colors.textMuted,
    fontSize: 9,
  },
});
