"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, Notification, NOTIFICATION_TYPE_CONFIG } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.getNotifications(),
        api.getUnreadNotificationCount(),
      ]);
      if (notifRes.status === "SUCCESS" && notifRes.data) {
        setNotifications(notifRes.data);
      }
      if (countRes.status === "SUCCESS") {
        setUnreadCount(countRes.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.referenceType === "JOB" && notification.referenceId) {
      return `/jobs/${notification.referenceId}`;
    }
    return "#";
  };

  // Notification list content (reusable)
  const renderNotificationContent = (onClose: () => void) => (
    <>
      {isLoading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-8 text-center">
          <Icon name="notifications_off" size={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Chưa có thông báo</p>
        </div>
      ) : (
        <div>
          {notifications.map((notification) => {
            const config = NOTIFICATION_TYPE_CONFIG[notification.type];
            const link = getNotificationLink(notification);
            
            return (
              <Link
                key={notification.id}
                href={link}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                  onClose();
                }}
                className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? "bg-blue-50/50" : ""
                }`}
              >
                {/* Icon */}
                <Icon name={config.icon} size={20} className={`shrink-0 ${config.color}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight ${!notification.isRead ? "font-medium" : ""}`}>
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );

  // Bell button with badge
  const bellButton = (
    <button className="relative p-2 outline-none">
      <Icon name="notifications" size={22} className="text-gray-600 hover:text-[#00b14f] transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Desktop: Dropdown */}
      <div className="hidden md:block">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            {bellButton}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#00b14f] hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              {renderNotificationContent(() => setIsOpen(false))}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t px-4 py-2">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-[#00b14f] hover:underline"
                >
                  Xem tất cả thông báo
                </Link>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Full-screen overlay */}
      <div className="md:hidden">
        <button onClick={() => setIsMobileOpen(true)} className="relative p-2 outline-none">
          <Icon name="notifications" size={22} className="text-gray-600 hover:text-[#00b14f] transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Mobile full-screen panel */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-[9999] bg-white">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Icon name="arrow_back" size={24} className="text-gray-700" />
                </button>
                <h3 className="font-semibold text-gray-900">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#00b14f] hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            {/* Mobile Content - scrollable */}
            <div className="overflow-y-auto h-[calc(100vh-57px)]">
              {renderNotificationContent(() => setIsMobileOpen(false))}
              
              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t px-4 py-3 bg-gray-50">
                  <Link
                    href="/notifications"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-sm text-[#00b14f] hover:underline font-medium"
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
