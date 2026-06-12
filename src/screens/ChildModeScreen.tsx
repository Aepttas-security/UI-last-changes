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
} from 'react-native';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface ChildModeScreenProps {
  onUnlink: () => void;
}

export const ChildModeScreen: React.FC<ChildModeScreenProps> = ({ onUnlink }) => {
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Pulsing animation for SOS button
  const pulseScale = useRef(new Animated.Value(1.0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (sosActive) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.35,
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
            toValue: 1.15,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1.0,
            duration: 1800,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      );
    }

    animation.start();

    return () => animation.stop();
  }, [sosActive]);

  // SOS Countdown logic
  useEffect(() => {
    let timer: any;
    if (sosActive) {
      if (sosCountdown > 0) {
        timer = setTimeout(() => {
          setSosCountdown(sosCountdown - 1);
        }, 1000);
      }
    } else {
      setSosCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [sosActive, sosCountdown]);

  const handleVerifyUnlink = () => {
    Keyboard.dismiss();
    if (enteredPin === '1234') {
      setShowUnlinkModal(false);
      setEnteredPin('');
      setPinError('');
      onUnlink();
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Child Mode Top App Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrapper}>
              <Icon name="shield" color={colors.greenSuccess} size={18} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>Aepttas Shield Child Guard</Text>
              <Text style={styles.headerSubtitle}>Linked to Parent Control Suite</Text>
            </View>
          </View>

          {/* Protected / SOS Status Tag */}
          <View
            style={[
              styles.statusTag,
              {
                backgroundColor: sosActive ? colors.redDanger + '22' : colors.greenSuccess + '22',
                borderColor: sosActive ? colors.redDanger : colors.greenSuccess,
              },
            ]}
          >
            <Text style={[styles.statusTagText, { color: sosActive ? colors.redDanger : colors.greenSuccess }]}>
              {sosActive ? 'SOS ALARM' : 'PROTECTED'}
            </Text>
          </View>
        </View>

        {/* 1. Screen Time Indicator Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>YOUR SCREEN TIME TODAY</Text>
          <View style={styles.screenTimeRow}>
            <Text style={styles.timeLeftText}>1h 45m left</Text>
            <Text style={styles.limitText}>Limit: 4 hours</Text>
          </View>
          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '56%' }]} />
          </View>
        </View>

        {/* 2. GIANT SOS PANIC BUTTON */}
        <View style={styles.sosContainer}>
          {/* Pulse Layer */}
          <Animated.View
            style={[
              styles.sosPulse,
              {
                transform: [{ scale: pulseScale }],
                borderColor: sosActive ? colors.redDanger + '77' : colors.purpleAccent + '33',
                backgroundColor: sosActive ? colors.redDanger + '26' : colors.purpleAccent + '14',
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.sosButton, { backgroundColor: sosActive ? colors.redDanger : colors.purpleAccent }]}
            onPress={() => setSosActive(!sosActive)}
          >
            <Icon name={sosActive ? 'warning' : 'share'} color="#fff" size={36} />
            <Text style={styles.sosButtonText}>
              {sosActive ? 'SOS ACTIVE' : 'EMERGENCY\nSOS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SOS Countdown Status */}
        {sosActive ? (
          <Text style={[styles.sosStatusText, { color: sosCountdown > 0 ? colors.orangeWarning : colors.redDanger }]}>
            {sosCountdown > 0
              ? `Sending distress signal in ${sosCountdown}...`
              : 'SOS Alerts Broadcasted to Parent Dashboard!'}
          </Text>
        ) : (
          <Text style={styles.sosStatusText}>Tap to trigger instant Emergency Panic SOS</Text>
        )}

        {/* 3. Safety Rules Card */}
        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.cardHeaderActive}>SAFETY POLICIES ACTIVE</Text>
          <View style={styles.divider} />

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Icon name="search" color={colors.textMuted} size={16} />
              <Text style={styles.policyLabel}>Forced Google SafeSearch</Text>
            </View>
            <Text style={[styles.policyVal, { color: colors.greenSuccess }]}>ACTIVE</Text>
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Icon name="globe" color={colors.textMuted} size={16} />
              <Text style={styles.policyLabel}>Real-time Geolocation sharing</Text>
            </View>
            <Text style={[styles.policyVal, { color: colors.greenSuccess }]}>ACTIVE</Text>
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Icon name="cancel" color={colors.textMuted} size={16} />
              <Text style={styles.policyLabel}>Social Apps Blocklist policy</Text>
            </View>
            <Text style={[styles.policyVal, { color: colors.redDanger }]}>BLOCKED</Text>
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyLeft}>
              <Icon name="gamepad" color={colors.textMuted} size={16} />
              <Text style={styles.policyLabel}>Gaming Limit (Roblox/Minecraft)</Text>
            </View>
            <Text style={[styles.policyVal, { color: colors.orangeWarning }]}>1 HOUR LIMIT</Text>
          </View>
        </View>

        {/* Unlink Button */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenSuccess + '1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTexts: {
    marginLeft: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
  },
  statusTag: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardHeaderActive: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  screenTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  timeLeftText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  limitText: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.cyanAccent,
  },
  sosContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 12,
  },
  sosPulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
  },
  sosButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  sosStatusText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  policyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyLabel: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  policyVal: {
    fontSize: 11,
    fontWeight: 'bold',
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
    marginTop: 32,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
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
    color: '#fff',
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
