import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Easing,
  Keyboard,
  StatusBar,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface ChildModeScreenProps {
  onUnlink: () => void;
}

export const ChildModeScreen: React.FC<ChildModeScreenProps> = ({ onUnlink }) => {
  const { colors, mode } = useAppTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [sosActive, setSosActive] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // 3-second long-press SOS State
  const [isPressing, setIsPressing] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3.0);
  const pressTimer = useRef<any>(null);
  const startTime = useRef<number>(0);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1.0)).current;

  // Pulse animation when idle or active
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (sosActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.4,
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1.0,
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      );
    } else {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.12,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1.0,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      );
    }

    animation.start();
    return () => animation.stop();
  }, [sosActive, pulseScale]);

  // Press handlers for the SOS button
  const handlePressIn = () => {
    if (sosActive) return; // Prevent double trigger
    setIsPressing(true);
    setSosCountdown(3.0);
    startTime.current = Date.now();

    // Trigger soft haptic feedback on start
    Vibration.vibrate(50);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    pressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 3 - elapsed / 1000);
      setSosCountdown(parseFloat(remaining.toFixed(1)));

      // Trigger periodic ticks during press
      if (Math.floor(elapsed) % 500 < 50) {
        Vibration.vibrate(20);
      }

      if (elapsed >= 3000) {
        triggerSosAlert();
      }
    }, 50);
  };

  const handlePressOut = () => {
    if (sosActive) return;
    cleanupPress();
  };

  const cleanupPress = () => {
    if (pressTimer.current) {
      clearInterval(pressTimer.current);
      pressTimer.current = null;
    }
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    setIsPressing(false);
    setSosCountdown(3.0);
  };

  const triggerSosAlert = () => {
    cleanupPress();
    setSosActive(true);
    // Haptic pattern for alert successfully sent
    Vibration.vibrate([0, 200, 100, 200, 100, 400]);
  };

  const handleCancelSOS = () => {
    setSosActive(false);
    cleanupPress();
  };

  const handleVerifyUnlink = () => {
    Keyboard.dismiss();
    if (enteredPin === '1234') {
      setShowUnlinkModal(false);
      setEnteredPin('');
      setPinError('');
      onUnlink();
    } else {
      setPinError('Incorrect parent PIN. Please try again.');
    }
  };

  // Interpolating the progress ring fill
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.purpleAccent }]}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.profileTexts}>
            <Text style={styles.profileName}>Alex Anderson</Text>
            <View style={styles.managedRow}>
              <Icon name="lock" color={colors.textMuted} size={12} />
              <Text style={styles.managedText}>Managed securely by Parent Account</Text>
            </View>
          </View>
        </View>

        {/* 2. System Compliance Status Banner */}
        <View
          style={[
            styles.complianceBanner,
            {
              backgroundColor: sosActive
                ? colors.redDanger + '1E'
                : colors.greenSuccess + '1E',
              borderColor: sosActive ? colors.redDanger : colors.greenSuccess,
            },
          ]}
        >
          <View style={styles.complianceLeft}>
            <Icon
              name={sosActive ? 'warning' : 'security'}
              color={sosActive ? colors.redDanger : colors.greenSuccess}
              size={20}
            />
            <Text
              style={[
                styles.complianceText,
                { color: sosActive ? colors.redDanger : colors.greenSuccess },
              ]}
            >
              SYSTEM SECURITY: {sosActive ? 'CRITICAL (SOS ACTIVE)' : 'SECURE & COMPLIANT'}
            </Text>
          </View>
          <View
            style={[
              styles.dotIndicator,
              { backgroundColor: sosActive ? colors.redDanger : colors.greenSuccess },
            ]}
          />
        </View>

        {/* 3. Protection Status Cards Grid */}
        <Text style={styles.sectionHeader}>PROTECTION GUARDIANS</Text>
        <View style={styles.gridContainer}>
          {/* Card 1: Location Sync */}
          <View style={styles.gridCard}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.blueAccent + '15' }]}>
              <Icon name="place" color={colors.blueAccent} size={20} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Location Sync</Text>
              <Text style={[styles.cardValue, { color: colors.greenSuccess }]}>Tracking Active</Text>
              <Text style={styles.cardSub}>Sharing Live GPS</Text>
            </View>
          </View>

          {/* Card 2: Web Shield */}
          <View style={styles.gridCard}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.cyanAccent + '15' }]}>
              <Icon name="security" color={colors.cyanAccent} size={20} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Web Shield</Text>
              <Text style={[styles.cardValue, { color: colors.greenSuccess }]}>Shield Online</Text>
              <Text style={styles.cardSub}>SafeSearch Enforced</Text>
            </View>
          </View>

          {/* Card 3: App Limits */}
          <View style={styles.gridCard}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.pinkAccent + '15' }]}>
              <Icon name="schedule" color={colors.pinkAccent} size={20} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>App Limits</Text>
              <Text style={[styles.cardValue, { color: colors.orangeWarning }]}>Limits Active</Text>
              <Text style={styles.cardSub}>1h 45m remaining</Text>
            </View>
          </View>

          {/* Card 4: Battery Health */}
          <View style={styles.gridCard}>
            <View style={[styles.cardIconBg, { backgroundColor: colors.greenSuccess + '15' }]}>
              <Icon name="battery-charging-full" color={colors.greenSuccess} size={20} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Battery Status</Text>
              <Text style={styles.cardValue}>84%</Text>
              <Text style={styles.cardSub}>Charging</Text>
            </View>
          </View>
        </View>

        {/* 4. SOS Emergency Hold Button */}
        <View style={styles.sosContainer}>
          {/* Pulse circles */}
          <Animated.View
            style={[
              styles.sosPulse,
              {
                transform: [{ scale: pulseScale }],
                borderColor: sosActive ? colors.redDanger + '77' : colors.purpleAccent + '33',
                backgroundColor: sosActive ? colors.redDanger + '20' : colors.purpleAccent + '10',
              },
            ]}
          />

          <View
            style={styles.sosTouchArea}
            onTouchStart={handlePressIn}
            onTouchEnd={handlePressOut}
          >
            <View
              style={[
                styles.sosButton,
                { backgroundColor: sosActive ? colors.redDanger : colors.purpleAccent },
              ]}
            >
              {/* Dynamic Fill Progress bar inside the button */}
              {isPressing && (
                <Animated.View
                  style={[
                    styles.sosProgressFill,
                    {
                      width: progressWidth,
                      backgroundColor: colors.redDanger + '66',
                    },
                  ]}
                />
              )}

              <Icon name={sosActive ? 'warning' : 'notifications-active'} color="#fff" size={36} />
              
              <Text style={styles.sosButtonText}>
                {sosActive ? 'SOS ACTIVE' : isPressing ? `HOLDING\n${sosCountdown}s` : 'EMERGENCY\nSOS'}
              </Text>
            </View>
          </View>
        </View>

        {/* SOS Alert Status text */}
        {sosActive ? (
          <View style={styles.sosAlertBox}>
            <Text style={styles.sosAlertTitle}>DISTRESS ALARM BROADCASTING</Text>
            <Text style={styles.sosAlertText}>GPS coordinates and emergency alerts have been transmitted to your Parent's device.</Text>
            <TouchableOpacity style={styles.cancelSosBtn} onPress={handleCancelSOS}>
              <Text style={styles.cancelSosText}>Cancel SOS Alarm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.sosStatusText}>
            {isPressing
              ? 'Keep holding to broadcast emergency distress alarm'
              : 'Press and hold button for 3 seconds to trigger panic SOS'}
          </Text>
        )}

        {/* Unlink Device Button */}
        <TouchableOpacity style={styles.unlinkBtn} onPress={() => setShowUnlinkModal(true)}>
          <Text style={styles.unlinkBtnText}>Unlink and Disassociate Device</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PARENT PIN VERIFICATION MODAL */}
      <Modal transparent={true} visible={showUnlinkModal} animationType="fade" onRequestClose={() => setShowUnlinkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Parent Verification Required</Text>
              <TouchableOpacity onPress={() => setShowUnlinkModal(false)}>
                <Icon name="close" color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter the parent verification PIN to unlink this device. (Default pairing PIN is 1234)
            </Text>

            <TextInput
              style={styles.pinInput}
              placeholder="4-digit parent PIN"
              placeholderTextColor={colors.textMuted}
              value={enteredPin}
              onChangeText={setEnteredPin}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry={true}
            />

            {pinError.length > 0 && <Text style={styles.pinErrorText}>{pinError}</Text>}

            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyUnlink}>
              <Text style={styles.verifyBtnText}>Verify & Unlink</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileTexts: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  managedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  managedText: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  complianceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  complianceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complianceText: {
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.0,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: 10,
    flex: 1,
  },
  cardTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  cardValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  sosContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 16,
  },
  sosPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  sosTouchArea: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
    zIndex: 2,
  },
  sosButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sosProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    zIndex: 2,
  },
  sosStatusText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 24,
  },
  sosAlertBox: {
    backgroundColor: colors.redDanger + '10',
    borderColor: colors.redDanger + '30',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  sosAlertTitle: {
    color: colors.redDanger,
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sosAlertText: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  cancelSosBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.redDanger,
  },
  cancelSosText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  unlinkBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  unlinkBtnText: {
    color: colors.redDanger,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDesc: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 12,
  },
  pinInput: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinErrorText: {
    color: colors.redDanger,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  verifyBtn: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.redDanger,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

