import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { api } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (url: string) => void;
}

export const TunnelConfigModal: React.FC<Props> = ({ visible, onClose, onSaved }) => {
  const [url, setUrl] = useState(api.getBaseUrl());

  const handleSave = () => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please include http:// or https://');
      return;
    }
    api.setBaseUrl(cleanUrl);
    onSaved(cleanUrl);
    onClose();
  };

  const handleQuickPreset = (preset: string) => {
    setUrl(preset);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Cloudflare Tunnel / Host Setup</Text>
          <Text style={styles.subtitle}>
            Connect this phone to your office laptop's AGY pipeline
          </Text>

          <Text style={styles.label}>SERVER / TUNNEL URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://xyz.trycloudflare.com or http://192.168.1.50:5000"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: 14 }]}>QUICK PRESETS</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => handleQuickPreset('http://10.0.2.2:5000')}
            >
              <Text style={styles.presetText}>Android Emulator (10.0.2.2)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetPill}
              onPress={() => handleQuickPreset('http://192.168.1.100:5000')}
            >
              <Text style={styles.presetText}>Office Wi-Fi IP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Tip: Run `cloudflared tunnel --url http://127.0.0.1:5000` on your office laptop to get a 100% free HTTPS address that works anywhere in the world!
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save & Reconnect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#121824',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a2234',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 8,
    color: '#ffffff',
    padding: 12,
    fontSize: 14,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    backgroundColor: '#1a2234',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  presetText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  infoText: {
    color: '#93c5fd',
    fontSize: 11,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#00f2fe',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveText: {
    color: '#090d16',
    fontWeight: '800',
  },
});
