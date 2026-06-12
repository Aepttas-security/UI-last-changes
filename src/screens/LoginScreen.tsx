import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';

interface LoginScreenProps {
  onSignInSuccess: () => void;
  onSetUpChildDevice: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignInSuccess,
  onSetUpChildDevice,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {/* Background Glow */}
      <View style={styles.glowContainer}>
        <View style={styles.purpleGlow} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          {/* Custom 3D-like Shield Logo using SVG */}
          <Svg width={120} height={120} viewBox="0 0 100 100">
            <Defs>
              <SvgLinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#8b5cf6" />
                <Stop offset="100%" stopColor="#2563eb" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M50,10 L85,22 V48 C85,69.5 70,89 50,94 C30,89 15,69.5 15,48 V22 L50,10 Z"
              fill="url(#shieldGrad)"
            />
            {/* Inner shield contour */}
            <Path
              d="M50,16 L79,26 V48 C79,66.2 66.8,82.5 50,87.2 C33.2,82.5 21,66.2 21,48 V26 L50,16 Z"
              fill="#0b0f19"
              opacity={0.85}
            />
            {/* Tech line detail */}
            <Path
              d="M50,22 L73,30.5 V48 C73,62.8 63,76.5 50,80.5 C37,76.5 27,62.8 27,48 V30.5 L50,22 Z"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
            />
            {/* Core icon */}
            <Path
              d="M45,60 L35,50 L39,46 L45,52 L61,36 L65,40 Z"
              fill="#ffffff"
            />
          </Svg>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Aepttas Shield XDR</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>v2.0</Text>
          </View>
        </View>

        <Text style={styles.subtitleText}>AI-Powered Mobile Security Suite</Text>

        {/* Welcome message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome Back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to continue protecting your device</Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="email" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Email or Phone Number"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 16 }]}>
            <Icon name="lock" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Icon
                name={passwordVisible ? 'visibility' : 'visibility-off'}
                color={colors.textMuted}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Sign In Button */}
        <TouchableOpacity style={styles.signInBtn} onPress={onSignInSuccess}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.btnContent}>
              <Icon name="shield" color="#fff" size={20} />
              <Text style={styles.btnText}>Sign In</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialBtn}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <Path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <Path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <Path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </Svg>
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn}>
            <Svg width={18} height={18} viewBox="0 0 23 23">
              <Path d="M0 0h11v11H0z" fill="#F25022" />
              <Path d="M12 0h11v11H12z" fill="#7FBA00" />
              <Path d="M0 12h11v11H0z" fill="#00A4EF" />
              <Path d="M12 12h11v11H12z" fill="#FFB900" />
            </Svg>
            <Text style={styles.socialBtnText}>Microsoft</Text>
          </TouchableOpacity>
        </View>

        {/* Footer links */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.childSetupBtn} onPress={onSetUpChildDevice}>
          <Text style={styles.childSetupText}>Set up this device as a Child Device</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    alignItems: 'center',
    overflow: 'hidden',
  },
  purpleGlow: {
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: colors.darkPurpleGlow,
    opacity: 0.3,
    filter: 'blur(60px)', // Will be ignored in RN but we use opacity+background for soft glow
    marginTop: -150,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 40,
    height: 120,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.purpleAccent + 'CC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: colors.purpleAccent,
    fontSize: 11,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 44,
  },
  welcomeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
  },
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 60,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingLeft: 12,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  forgotText: {
    color: colors.purpleAccent,
    fontSize: 14,
    fontWeight: '500',
  },
  signInBtn: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  socialBtn: {
    flex: 0.47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  socialBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkText: {
    color: colors.purpleAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  childSetupBtn: {
    paddingVertical: 8,
  },
  childSetupText: {
    color: colors.cyanAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
