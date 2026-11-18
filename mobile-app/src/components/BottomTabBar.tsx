import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export type TabKey = 'pool' | 'radar' | 'preview' | 'library' | 'profile';

interface Props {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
  pendingCount?: number;
  isRadarActive?: boolean;
  hasPreview?: boolean;
}

export const BottomTabBar: React.FC<Props> = ({
  activeTab,
  onTabPress,
  pendingCount = 0,
  isRadarActive = false,
  hasPreview = false,
}) => {
  const tabs = [
    { key: 'pool' as TabKey, label: 'Pool', icon: '💡', badge: pendingCount > 0 ? pendingCount : undefined },
    { key: 'radar' as TabKey, label: 'Radar', icon: '⚡', pulse: isRadarActive },
    { key: 'preview' as TabKey, label: 'Preview', icon: '🎬', glow: hasPreview },
    { key: 'library' as TabKey, label: 'Vault', icon: '🏆' },
    { key: 'profile' as TabKey, label: 'Engine', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, isActive && styles.iconTextActive]}>{tab.icon}</Text>
              {tab.badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
              {tab.pulse && (
                <View style={styles.pulseDot} />
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeBar} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0c101a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    minWidth: 70,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  iconContainer: {
    position: 'relative',
  },
  iconText: {
    fontSize: 20,
    opacity: 0.7,
  },
  iconTextActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#00f2fe',
    fontWeight: '800',
  },
  activeBar: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 3,
    backgroundColor: '#00f2fe',
    borderRadius: 2,
    shadowColor: '#00f2fe',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#f59e0b',
    borderRadius: 9,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#090d16',
    fontSize: 9,
    fontWeight: '800',
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f2fe',
  },
});
