import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, AlertCircle, Eye } from 'lucide-react';

export const CitizenNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = () => {
    api.request<any>('/notifications')
      .then((res) => setNotifications(res.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await api.request(`/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await api.request('/notifications/read-all', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">In-App Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status updates and departmental notices</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton count={3} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No notifications received yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                    n.is_read ? 'bg-white' : 'bg-sky-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{n.title}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {n.complaint_id && (
                      <Link to={`/citizen/complaints/${n.complaint_id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Case
                        </Button>
                      </Link>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-xs text-slate-400 hover:text-slate-700 p-1"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
