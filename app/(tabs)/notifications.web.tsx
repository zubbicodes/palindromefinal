import { authService } from '@/authService';
import { useThemeContext } from '@/context/ThemeContext';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  type NotificationRow,
} from '@/lib/notifications';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';

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

export default function NotificationsWeb() {
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
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: isDark ? 'linear-gradient(145deg, #0a0a1c 0%, #16162e 100%)' : 'linear-gradient(145deg, #f0f4ff 0%, #e8ecf8 100%)',
        fontFamily: 'Geist-Regular, system-ui',
        color: text,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <button
          onClick={goBack}
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: text,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={text} />
        </button>
        <h1 style={{ fontFamily: 'Geist-Bold, system-ui', fontSize: 20, margin: 0 }}>Notifications</h1>
        {hasUnread ? (
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.accent,
              fontFamily: 'Geist-Bold, system-ui',
              fontSize: 13,
              cursor: 'pointer',
              padding: '8px 12px',
            }}
          >
            Mark all read
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>

      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: 16,
          paddingBottom: 32,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${colors.accent}33`,
                borderTopColor: colors.accent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
              paddingHorizontal: 24,
            }}
          >
            <Ionicons name="notifications-off-outline" size={48} color={muted} />
            <p
              style={{
                fontFamily: 'Geist-Regular, system-ui',
                fontSize: 15,
                textAlign: 'center',
                marginTop: 16,
                color: muted,
              }}
            >
              No notifications yet. Friend requests and challenges will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotificationPress(n)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                width: '100%',
                padding: 16,
                borderRadius: 14,
                marginBottom: 12,
                background: cardBg,
                border: 'none',
                borderLeft: `4px solid ${n.read_at ? 'transparent' : colors.accent}`,
                cursor: 'pointer',
                textAlign: 'left',
                color: text,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  background: colors.accent + '22',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name={getIconForType(n.type)} size={20} color={colors.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: n.read_at ? 'Geist-Regular, system-ui' : 'Geist-Bold, system-ui',
                    fontSize: 15,
                    marginBottom: 4,
                  }}
                >
                  {n.title}
                </div>
                {n.body ? (
                  <div style={{ fontFamily: 'Geist-Regular, system-ui', fontSize: 13, color: muted, marginBottom: 4 }}>
                    {n.body}
                  </div>
                ) : null}
                <div style={{ fontFamily: 'Geist-Regular, system-ui', fontSize: 11, color: muted }}>
                  {formatTime(n.created_at)}
                </div>
              </div>
              {!n.read_at && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: colors.accent,
                    marginLeft: 8,
                    marginTop: 6,
                  }}
                />
              )}
            </button>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
