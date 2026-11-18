import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { MobileMember } from '../types';
import { COLORS, SHADOWS } from '../theme';

interface Props {
  onLoginSuccess: (member: MobileMember) => void;
  onOpenTunnelConfig: () => void;
}

const MEMBERS = [
  { id: 'eswar', name: 'Eswar', role: 'Lead / Director', color: '#a855f7', tag: 'DIRECTOR' },
  { id: 'yoges', name: 'Yoges', role: 'Technical Lead', color: '#00f2fe', tag: 'TECH LEAD' },
  { id: 'member3', name: 'Vikram Patel', role: 'Motion Lead', color: '#3b82f6', tag: 'FX 60FPS' },
  { id: 'member4', name: 'Elena Rostova', role: 'Scriptwriter', color: '#ec4899', tag: 'WORDS' },
  { id: 'member5', name: 'Marcus Vance', role: 'Audio & SFX', color: '#f59e0b', tag: 'AUDIO' },
  { id: 'member6', name: 'Priya Sharma', role: 'QA Reviewer', color: '#10b981', tag: 'QUALITY' },
  { id: 'member7', name: 'David Kim', role: 'Creative Dir', color: '#8b5cf6', tag: 'VISION' },
];

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess, onOpenTunnelConfig }) => {
  const [selectedUser, setSelectedUser] = useState('eswar');
  const [password, setPassword] = useState('bittrix-123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMemberData = MEMBERS.find((m) => m.id === selectedUser) || MEMBERS[0];

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(selectedUser, password);
      onLoginSuccess(res.member);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check server connection.');
      Alert.alert(
        'Connection Notice',
        `${err.message}\nMake sure your Cloudflare Tunnel is running or tap Server Host below to configure.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Studio HUD status bar */}
      <View style={styles.hudBar}>
        <View style={styles.hudPill}>
          <View style={styles.hudDotLive} />
          <Text style={styles.hudText}>TUNNEL ONLINE</Text>
        </View>
        <View style={styles.hudPill}>
          <Text style={styles.hudTextEngine}>⚡ AGY ENGINE · 60 FPS</Text>
        </View>
      </View>

      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>BITTRIX AI STUDIO</Text>
        </View>
        <Text style={styles.heroTitle}>Motion Production Console</Text>
        <Text style={styles.heroSubtitle}>Collaborative Mobile Node for 7 Studio Members</Text>
      </View>

      {/* Member Selection Carousel / Grid */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.sectionTitle}>SELECT TEAM PROFILE</Text>
          <Text style={styles.sectionCounter}>7 MEMBERS ACTIVE</Text>
        </View>

        <View style={styles.memberGrid}>
          {MEMBERS.map((m) => {
            const isSelected = selectedUser === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.memberCard,
                  isSelected && { borderColor: m.color, backgroundColor: 'rgba(15, 23, 42, 0.9)' },
                ]}
                onPress={() => setSelectedUser(m.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.avatarCircle, { backgroundColor: m.color + '25', borderColor: m.color }]}>
                  <Text style={[styles.avatarInitial, { color: m.color }]}>
                    {m.name.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, isSelected && { color: m.color, fontWeight: '800' }]} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.memberRole}>{m.role}</Text>
                </View>
                <View style={[styles.tagBadge, { backgroundColor: m.color + '15' }]}>
                  <Text style={[styles.tagText, { color: m.color }]}>{m.tag}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security Password Input */}
        <View style={styles.authBox}>
          <View style={styles.authHeaderRow}>
            <Text style={styles.authLabel}>MEMBER CREDENTIALS</Text>
            <Text style={styles.activeLabel}>
              Authenticating: <Text style={{ color: selectedMemberData.color, fontWeight: '700' }}>{selectedMemberData.name}</Text>
            </Text>
          </View>

          <TextInput
            style={styles.passwordInput}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter security key"
            placeholderTextColor="#64748b"
          />

          {error && <Text style={styles.errorText}>⚠️ {error}</Text>}

          <TouchableOpacity
            style={[
              styles.enterButton,
              { backgroundColor: selectedMemberData.color },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#070a12" />
            ) : (
              <Text style={styles.enterButtonText}>Unlock Studio Console ➔</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Cloudflare Tunnel Status Card */}
      <TouchableOpacity style={styles.tunnelCard} onPress={onOpenTunnelConfig} activeOpacity={0.7}>
        <View style={styles.tunnelRow}>
          <Text style={styles.tunnelIcon}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tunnelTitle}>Cloudflare Secure Tunnel</Text>
            <Text style={styles.tunnelUrl} numberOfLines={1}>{api.getBaseUrl()}</Text>
          </View>
          <Text style={styles.tunnelAction}>Change ⚙️</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flexGrow: 1,
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 35,
  },
  hudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  hudDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  hudText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hudTextEngine: {
    color: '#00f2fe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 10,
  },
  logoBadgeText: {
    color: '#00f2fe',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    ...SHADOWS.card,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionCounter: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  memberGrid: {
    gap: 8,
    marginBottom: 18,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2c',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '800',
  },
  memberName: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  memberRole: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  authBox: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 16,
  },
  authHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  passwordInput: {
    backgroundColor: '#0a0f1d',
    borderWidth: 1,
    borderColor: '#26344d',
    borderRadius: 10,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 8,
  },
  enterButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#00f2fe',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  enterButtonText: {
    color: '#070a12',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  tunnelCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
  },
  tunnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tunnelIcon: {
    fontSize: 20,
  },
  tunnelTitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  tunnelUrl: {
    color: '#38bdf8',
    fontSize: 11,
    marginTop: 2,
  },
  tunnelAction: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});
