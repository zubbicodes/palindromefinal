import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  type NotificationRow,
} from '@/lib/notifications';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function getIconForType(type: NotificationRow['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'friend_request':
      return 'person-add';
    case 'challenge':
      return 'game-controller';
    case 'app_update':
      return 'megaphone';
    default:
      return 'notifications';
  }
}

export default function NotificationsScreen() {
  const { theme, colors } = useThemeContext();
  const isDark = theme === 'dark';
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const user = await authService.getSessionUser();
    if (!user) {
      router.replace('/main');
      return;
    }
    setUserId(user.id);
    try {
      const list = await getNotifications(user.id);
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleNotificationPress = useCallback(
    async (n: NotificationRow) => {
      const user = await authService.getSessionUser();
      if (!user) return;
      if (!n.read_at) {
        try {
          await markAsRead(n.id, user.id);
          setNotifications((prev) =>
            prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
          );
        } catch {
          // ignore
        }
      }
      if (n.type === 'friend_request' && n.data?.friend_request_id) {
        router.push('/friends');
      } else if (n.type === 'challenge' && n.data?.challenge_id) {
        router.push('/friends');
      }
    },
    []
  );

  const handleMarkAllRead = useCallback(async () => {
    const user = await authService.getSessionUser();
    if (!user) return;
    try {
      await markAllAsRead(user.id);
      setNotifications((prev) =>
        prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() }))
      );
    } catch {
      // ignore
    }
  }, []);

  const goBack = useCallback(() => router.back(), []);

  const hasUnread = notifications.some((n) => !n.read_at);
  const cardBg = isDark ? 'rgba(25,25,91,0.6)' : 'rgba(255,255,255,0.9)';
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.6)';

  return (
    <LinearGradient
      colors={isDark ? ['#0a0a1c', '#16162e'] : ['#f0f4ff', '#e8ecf8']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={text} />
          </Pressable>
          <Text style={[styles.title, { color: text }]}>Notifications</Text>
          {hasUnread ? (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all read</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : notifications.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={muted} />
              <Text style={[styles.emptyText, { color: muted }]}>
                No notifications yet. Friend requests and challenges will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => handleNotificationPress(n)}
                style={({ pressed }) => [
                  styles.notifRow,
                  {
                    backgroundColor: cardBg,
                    opacity: pressed ? 0.9 : 1,
                    borderLeftColor: n.read_at ? 'transparent' : colors.accent,
                  },
                ]}
              >
                <View style={[styles.notifIcon, { backgroundColor: colors.accent + '22' }]}>
                  <Ionicons name={getIconForType(n.type)} size={20} color={colors.accent} />
                </View>
                <View style={styles.notifBody}>
                  <Text
                    style={[
                      styles.notifTitle,
                      { color: text },
                      n.read_at && { fontFamily: 'Geist-Regular' },
                    ]}
                    numberOfLines={1}
                  >
                    {n.title}
                  </Text>
                  {n.body ? (
                    <Text style={[styles.notifBodyText, { color: muted }]} numberOfLines={2}>
                      {n.body}
                    </Text>
                  ) : null}
                  <Text style={[styles.notifTime, { color: muted }]}>{formatTime(n.created_at)}</Text>
                </View>
                {!n.read_at && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: 'Geist-Bold', fontSize: 20 },
  markAllBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  markAllText: { fontFamily: 'Geist-Bold', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'Geist-Regular',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifBody: { flex: 1, minWidth: 0 },
  notifTitle: { fontFamily: 'Geist-Bold', fontSize: 15, marginBottom: 4 },
  notifBodyText: { fontFamily: 'Geist-Regular', fontSize: 13, marginBottom: 4 },
  notifTime: { fontFamily: 'Geist-Regular', fontSize: 11 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 6,
  },
});
