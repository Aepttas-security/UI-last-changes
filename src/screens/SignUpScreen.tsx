import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../styles/theme';
import { Icon } from '../components/Icon';
import { registerUser, AuthError } from '../data/authRepository';

interface SignUpScreenProps {
  onSignUpSuccess: () => void; // go back to Login after registration
  onGoToLogin: () => void;     // already have an account → Login
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onGoToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateAndRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setErrorMessage('Email must end with @gmail.com');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setErrorMessage('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Password must contain at least one uppercase letter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({ name: name.trim(), email, password });
      setSuccessMessage('Account created! Redirecting to Sign In...');
      setTimeout(() => {
        onSignUpSuccess();
      }, 1500);
    } catch (err) {
      const authErr = err as AuthError;
      setErrorMessage(authErr.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Background glow */}
      <View style={styles.glowContainer}>
        <View style={styles.cyanGlow} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Svg width={90} height={90} viewBox="0 0 100 100">
            <Defs>
              <SvgLinearGradient id="sgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#06b6d4" />
                <Stop offset="100%" stopColor="#8b5cf6" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M50,10 L85,22 V48 C85,69.5 70,89 50,94 C30,89 15,69.5 15,48 V22 L50,10 Z"
              fill="url(#sgGrad)"
            />
            <Path
              d="M50,16 L79,26 V48 C79,66.2 66.8,82.5 50,87.2 C33.2,82.5 21,66.2 21,48 V26 L50,16 Z"
              fill="#0b0f19"
              opacity={0.85}
            />
            <Path
              d="M50,22 L73,30.5 V48 C73,62.8 63,76.5 50,80.5 C37,76.5 27,62.8 27,48 V30.5 L50,22 Z"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
            />
            {/* Plus icon = create account */}
            <Path d="M47,36 L47,52 M39,44 L55,44" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          </Svg>
        </View>

        {/* Header */}
        <Text style={styles.titleText}>Aepttas Shield</Text>
        <Text style={styles.subtitleText}>AI-Powered Mobile Security Suite</Text>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Create Account</Text>
          <Text style={styles.welcomeSubtitle}>
            Set up your parent account to protect your family
          </Text>
        </View>

        {/* Error banner */}
        {errorMessage.length > 0 && (
          <View style={styles.errorContainer}>
            <Icon name="error" color={colors.redDanger} size={16} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Success banner */}
        {successMessage.length > 0 && (
          <View style={styles.successContainer}>
            <Icon name="shield" color="#10b981" size={16} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.inputContainer}>

          {/* Full Name */}
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Icon name="person" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Icon name="email" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="yourname@gmail.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Password</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Min 6 chars, upper & lowercase"
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

          {/* Confirm Password */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock" color={colors.textMuted} size={20} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!confirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              <Icon
                name={confirmPasswordVisible ? 'visibility' : 'visibility-off'}
                color={colors.textMuted}
                size={20}
              />
            </TouchableOpacity>
          </View>

          {/* Password rules hint */}
          <View style={styles.rulesContainer}>
            <RuleHint met={password.length >= 6} text="At least 6 characters" />
            <RuleHint met={/[a-z]/.test(password)} text="One lowercase letter" />
            <RuleHint met={/[A-Z]/.test(password)} text="One uppercase letter" />
            <RuleHint met={password === confirmPassword && password.length > 0} text="Passwords match" />
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.signUpBtn, isLoading && { opacity: 0.75 }]}
            onPress={validateAndRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#06b6d4', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <View style={styles.btnContent}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="shield" color="#fff" size={20} />
                    <Text style={styles.btnText}>Create Account</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Back to Login */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onGoToLogin}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Small rule hint component
const RuleHint: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <View style={ruleStyles.row}>
    <View style={[ruleStyles.dot, met ? ruleStyles.dotMet : ruleStyles.dotUnmet]} />
    <Text style={[ruleStyles.text, met ? ruleStyles.textMet : ruleStyles.textUnmet]}>
      {text}
    </Text>
  </View>
);

const ruleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  dotMet: { backgroundColor: '#10b981' },
  dotUnmet: { backgroundColor: '#6b7280' },
  text: { fontSize: 12 },
  textMet: { color: '#10b981' },
  textUnmet: { color: '#6b7280' },
});

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
  cyanGlow: {
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#06b6d4',
    opacity: 0.12,
    marginTop: -150,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    marginTop: 32,
    height: 90,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  subtitleText: {
    fontSize: 13,
    color: '#06b6d4',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 28,
  },
  welcomeContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redDanger + '1E',
    borderWidth: 1,
    borderColor: colors.redDanger + '88',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    color: colors.redDanger,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    borderWidth: 1,
    borderColor: '#10b98188',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    marginBottom: 16,
  },
  successText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputContainer: {
    width: '100%',
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingLeft: 12,
  },
  rulesContainer: {
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  signUpBtn: {
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
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
});
