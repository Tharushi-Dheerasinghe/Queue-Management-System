import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader"; // Loader එකක් තියෙනවා නම්
import { notificationTypeConfig } from "../../data/dummyData";
import { resolveHospitalModule } from "../../utils/hospitalModuleHelpers";
import { filterNotificationsByTenantAndModule } from "../../utils/notificationHelpers";

import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "../../services/notificationService";

const notificationColorClasses = {
  blue: { wrapper: "bg-blue-50 text-blue-700 ring-blue-100", chip: "bg-blue-50 text-blue-700 border-blue-200" },
  amber: { wrapper: "bg-amber-50 text-amber-700 ring-amber-100", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  indigo: { wrapper: "bg-indigo-50 text-indigo-700 ring-indigo-100", chip: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  green: { wrapper: "bg-emerald-50 text-emerald-700 ring-emerald-100", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  orange: { wrapper: "bg-orange-50 text-orange-700 ring-orange-100", chip: "bg-orange-50 text-orange-700 border-orange-200" },
  red: { wrapper: "bg-red-50 text-red-700 ring-red-100", chip: "bg-red-50 text-red-700 border-red-200" },
};

const getNotificationStyle = (type) => {
  const normalizedType = String(type || "").trim().toLowerCase();
  const config = notificationTypeConfig[normalizedType] || notificationTypeConfig.queue || notificationTypeConfig.token;
  return {
    icon: config.emoji,
    ...(notificationColorClasses[config.color] || notificationColorClasses.blue),
  };
};

export default function Notifications() {
  const { tenant, tenantType } = useOutletContext();
  const theme = tenant?.theme;
  const hospitalModule = resolveHospitalModule(sessionStorage);
  
  // සජීවී දත්ත සඳහා states
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);


  // 1. Backend එකෙන් notifications load කිරීම
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getNotifications();
        if (isMounted) {
          setNotifications(data);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [tenantType]);

  // දැනට තියෙන filtering logic එක පාවිච්චි කිරීම
  const filteredNotifications = filterNotificationsByTenantAndModule({
    notifications,
    tenantType,
    hospitalModule,
  });

  // 2. සියල්ල කියවූ බව සලකුණු කිරීම
  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications([]);
    }
  };

  // 3. එකක් පමණක් කියවූ බව සලකුණු කිරීම
  const handleMarkAsRead = async (id) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      // UI එකෙන් අදාළ notification එක ඉවත් කිරීම
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader /></div>;
  }

  if (filteredNotifications.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="All Caught Up"
          description="You have no unread notifications right now. New queue updates will appear here."
          theme={theme}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-2 text-slate-500">View the latest updates related to your booking and queue.</p>
        </div>

        <Button theme={theme} variant="secondary" onClick={handleMarkAllAsRead} className="w-full sm:w-auto">
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((item) => {
          const style = getNotificationStyle(item.type);
          // කාලය පෙන්වීමට පොඩි format එකක් (createdAt පාවිච්චි කරන්නේ නම්)
          const timeLabel = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : item.time;

          return (
            <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ring-1 ${style.wrapper}`}>
                  <span className="text-lg leading-none">{style.icon}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.message}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${style.chip}`}>
                      {timeLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      theme={theme}
                      variant="ghost"
                      onClick={() => handleMarkAsRead(item._id)}
                      className="px-4 py-2 text-xs"
                    >
                      Mark as Read
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}