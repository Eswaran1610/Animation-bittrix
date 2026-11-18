import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../services/api';
import { VideoRecord } from '../types';
import { COLORS, SHADOWS } from '../theme';

interface Props {
  onBack: () => void;
}

export const VideoLibraryScreen: React.FC<Props> = ({ onBack }) => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);

  const fetchVideos = async () => {
    try {
      const data = await api.listVideos();
      setVideos(data);
    } catch (err: any) {
      console.warn('Failed to fetch videos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDownload = async (video: VideoRecord) => {
    const downloadUrl = `${api.getBaseUrl()}/api/mobile/videos/${video.id}/download`;
    try {
      await Linking.openURL(downloadUrl);
    } catch {
      const mediaUrl = api.getMediaUrl(video.storageUrl);
      Linking.openURL(mediaUrl).catch((e) => Alert.alert('Download Error', e.message));
    }
  };

  const renderVideoItem = ({ item }: { item: VideoRecord }) => {
    const duration = Math.round(item.durationSec || 33);
    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>1080×1920 · 60 FPS</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>⏱️ {duration}s (+3s outro)</Text>
          </View>
        </View>

        <Text style={styles.videoTitle}>{item.title || 'Bittrix Motion Master'}</Text>
        <Text style={styles.dateStamp}>
          Delivered: {new Date(item.createdAt).toLocaleDateString()} · Audio-Visual QA Passed
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setSelectedVideo(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.playBtnText}>▶ Stream 1080p</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => handleDownload(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.downloadBtnText}>⬇ Download MP4</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>◀ Pool</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>PRODUCTION VAULT</Text>
          </View>
          <Text style={styles.title}>1080p Master Videos</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchVideos}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#00f2fe" size="large" />
          <Text style={styles.loadingText}>Loading 1080p Masters from Vault...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🏆</Text>
              <Text style={styles.emptyTitle}>Vault Is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Once a Stage 1 Preview is approved by a member, the final 1080p MP4 appears here automatically for instant download.
              </Text>
            </View>
          }
        />
      )}

      {/* Fullscreen Video Modal */}
      <Modal visible={!!selectedVideo} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.playerWrapper}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedVideo?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedVideo && (
              <Video
                style={styles.fullVideo}
                source={{ uri: api.getMediaUrl(selectedVideo.storageUrl) }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    backgroundColor: '#161f33',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  backBtnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  headerBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  headerBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  refreshBtn: {
    backgroundColor: '#161f33',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  refreshBtnText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800',
  },
  centerBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qualityBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#00f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qualityText: {
    color: '#00f2fe',
    fontSize: 10,
    fontWeight: '800',
  },
  durationBadge: {
    backgroundColor: '#161f33',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  dateStamp: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  playBtn: {
    flex: 1,
    backgroundColor: '#00f2fe',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    ...SHADOWS.glowCyan,
  },
  playBtnText: {
    color: '#070a12',
    fontWeight: '800',
    fontSize: 13,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: '#161f33',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  playerWrapper: {
    backgroundColor: '#0f1523',
    borderRadius: 20,
    overflow: 'hidden',
    height: '80%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  fullVideo: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
