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
} from 'react-native';
import Svg, { Line, Circle, G } from 'react-native-svg';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface GeoRequest {
  ip: string;
  threatLevel: 'Safe' | 'Suspicious' | 'High Risk';
  country: string;
  city: string;
  isp: string;
  latency: string;
  timeAgo: string;
  timeCategory: '1H' | '24H' | '7D';
  xPercent: number; // 0.0 to 1.0 (X coordinate on map)
  yPercent: number; // 0.0 to 1.0 (Y coordinate on map)
}

interface GeoTrackingScreenProps {
  onBack: () => void;
}

const allRequests: GeoRequest[] = [
  { ip: '104.244.42.1', threatLevel: 'Safe', country: 'United States', city: 'San Francisco', isp: 'Twitter Inc.', latency: '35ms', timeAgo: '5m ago', timeCategory: '1H', xPercent: 0.20, yPercent: 0.35 },
  { ip: '185.190.140.12', threatLevel: 'High Risk', country: 'Netherlands', city: 'Amsterdam', isp: 'Creanova Hosting', latency: '180ms', timeAgo: '12m ago', timeCategory: '1H', xPercent: 0.48, yPercent: 0.28 },
  { ip: '13.107.4.50', threatLevel: 'Safe', country: 'Japan', city: 'Tokyo', isp: 'Microsoft Corp', latency: '85ms', timeAgo: '42m ago', timeCategory: '1H', xPercent: 0.82, yPercent: 0.38 },
  { ip: '43.205.12.89', threatLevel: 'Suspicious', country: 'India', city: 'Mumbai', isp: 'Amazon Data Services', latency: '120ms', timeAgo: '3h ago', timeCategory: '24H', xPercent: 0.70, yPercent: 0.52 },
  { ip: '185.220.101.5', threatLevel: 'High Risk', country: 'Germany', city: 'Frankfurt', isp: 'Tor Exit Node', latency: '210ms', timeAgo: '6h ago', timeCategory: '24H', xPercent: 0.50, yPercent: 0.32 },
  { ip: '210.140.10.3', threatLevel: 'Safe', country: 'Japan', city: 'Osaka', isp: 'NTT Communications', latency: '98ms', timeAgo: '18h ago', timeCategory: '24H', xPercent: 0.84, yPercent: 0.42 },
  { ip: '103.21.244.0', threatLevel: 'Safe', country: 'Singapore', city: 'Singapore', isp: 'Cloudflare Inc.', latency: '62ms', timeAgo: '2d ago', timeCategory: '7D', xPercent: 0.78, yPercent: 0.58 },
  { ip: '91.198.174.192', threatLevel: 'Safe', country: 'France', city: 'Paris', isp: 'Wikimedia Foundation', latency: '110ms', timeAgo: '4d ago', timeCategory: '7D', xPercent: 0.46, yPercent: 0.33 },
  { ip: '109.201.154.22', threatLevel: 'Suspicious', country: 'Russia', city: 'Moscow', isp: 'Rostelecom PJSC', latency: '195ms', timeAgo: '6d ago', timeCategory: '7D', xPercent: 0.56, yPercent: 0.26 }
];

export const GeoTrackingScreen: React.FC<GeoTrackingScreenProps> = ({ onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | '1H' | '24H' | '7D'>('All');
  const [selectedRequest, setSelectedRequest] = useState<GeoRequest | null>(allRequests[1]); // Default to Amsterdam

  // Radar rotation animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for markers
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Start radar rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Start marker pulse
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
  }, []);

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
    // Renders a cluster of small dots to resemble a continent
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* 1. TOP HEADER APP BAR WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" color="#fff" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>API Geolocation Tracker</Text>
          <Text style={styles.headerSubtitle}>Live threat request map overview</Text>
        </View>
      </View>

      {/* 2. TIME RANGE FILTER BUTTONS */}
      <View style={styles.filterRow}>
        {(['1H', '24H', '7D', 'All'] as const).map(filter => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => {
                setSelectedFilter(filter);
                // Select first matching request if current is not in the filtered list
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

      {/* 3. INTERACTIVE MAP BOX */}
      <View style={styles.mapContainer}>
        {/* Latitude/Longitude Grid Lines */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {/* Horizonal Lines */}
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
          {/* Vertical Lines */}
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

          {/* Continents Silhouettes */}
          {renderContinentDot(mapWidth * 0.2, mapHeight * 0.35, 10)}
          {renderContinentDot(mapWidth * 0.3, mapHeight * 0.68, 20)}
          {renderContinentDot(mapWidth * 0.5, mapHeight * 0.38, 30)}
          {renderContinentDot(mapWidth * 0.52, mapHeight * 0.65, 40)}
          {renderContinentDot(mapWidth * 0.75, mapHeight * 0.38, 50)}
          {renderContinentDot(mapWidth * 0.85, mapHeight * 0.72, 60)}
        </Svg>

        {/* Rotating Radar Sweep */}
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

        {/* Request Markers */}
        {filteredRequests.map((req, idx) => {
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
                {/* Pulsing Outer Ring */}
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
                {/* Core Center Dot */}
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

      {/* 4. IP DETAILS PANEL */}
      {selectedRequest && (
        <View
          style={[
            styles.detailsCard,
            selectedRequest.threatLevel === 'High Risk' && { borderColor: colors.redDanger + '55' },
          ]}
        >
          <View style={styles.detailsHeader}>
            <View style={styles.ipRow}>
              <Icon name="dns" color={colors.cyanAccent} size={18} />
              <Text style={styles.ipText}>{selectedRequest.ip}</Text>
            </View>

            {/* Threat Level Badge */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    selectedRequest.threatLevel === 'High Risk'
                      ? colors.redDanger + '26'
                      : selectedRequest.threatLevel === 'Suspicious'
                      ? colors.orangeWarning + '26'
                      : colors.greenSuccess + '26',
                  borderColor:
                    selectedRequest.threatLevel === 'High Risk'
                      ? colors.redDanger
                      : selectedRequest.threatLevel === 'Suspicious'
                      ? colors.orangeWarning
                      : colors.greenSuccess,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      selectedRequest.threatLevel === 'High Risk'
                        ? colors.redDanger
                        : selectedRequest.threatLevel === 'Suspicious'
                        ? colors.orangeWarning
                        : colors.greenSuccess,
                  },
                ]}
              >
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
                <Text style={styles.detailsValue}>
                  {selectedRequest.city}, {selectedRequest.country}
                </Text>
              </View>
            </View>
            <View style={styles.gridColumn}>
              <Text style={styles.detailsLabel}>ORGANIZATION</Text>
              <Text style={styles.detailsValue} numberOfLines={1}>
                {selectedRequest.isp}
              </Text>
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

      {/* 5. API REQUESTS SCROLLING LIST */}
      <Text style={styles.listTitle}>Filtered API Logs ({filteredRequests.length})</Text>

      <FlatList
        data={filteredRequests}
        keyExtractor={item => item.ip}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedRequest?.ip === item.ip;
          const alertColor =
            item.threatLevel === 'High Risk'
              ? colors.redDanger
              : item.threatLevel === 'Suspicious'
              ? colors.orangeWarning
              : colors.greenSuccess;

          return (
            <TouchableOpacity
              style={[
                styles.logItem,
                isSelected ? styles.logItemActive : styles.logItemInactive,
              ]}
              onPress={() => setSelectedRequest(item)}
            >
              <View style={[styles.logIndicator, { backgroundColor: alertColor }]} />
              <View style={styles.logTexts}>
                <Text style={styles.logIp}>{item.ip}</Text>
                <Text style={styles.logSub}>
                  {item.city}, {item.country}
                </Text>
              </View>
              <View style={styles.logRightCol}>
                <Text style={styles.logTime}>{item.timeAgo}</Text>
                <Text style={styles.logLatency}>{item.latency}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'space-between',
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
    height: 220,
    marginHorizontal: 24,
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
  },
  pulsingRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  markerDotSelected: {
    borderWidth: 1.5,
    borderColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  liveTrackingText: {
    position: 'absolute',
    top: 12,
    left: 12,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.greenSuccess,
    opacity: 0.8,
  },
  gridCoordsText: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    fontSize: 9,
    color: colors.textMuted,
    opacity: 0.6,
  },
  detailsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 24,
    marginVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridColumn: {
    flex: 1,
  },
  detailsLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  latencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  listTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 24,
    marginTop: 18,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  logItemActive: {
    backgroundColor: colors.cardBackground + '80',
    borderColor: colors.purpleAccent,
  },
  logItemInactive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
  },
  logIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logTexts: {
    flex: 1,
    marginLeft: 12,
  },
  logIp: {
    color: '#fff',
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
    fontSize: 10,
  },
  logLatency: {
    color: colors.greenSuccess,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
