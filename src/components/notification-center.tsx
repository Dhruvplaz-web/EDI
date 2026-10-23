"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

const initialNotifications = [
  { id: 1, title: "New Emergency Triage", time: "2m ago", read: false, type: "critical" },
  { id: 2, title: "Lab Results Ready - PT-105", time: "15m ago", read: false, type: "info" },
  { id: 3, title: "Payment Failed - INV-992", time: "1h ago", read: true, type: "warning" },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <Popover>
      <PopoverTrigger className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div key={n.id} className={`p-4 border-b border-slate-100 dark:border-slate-800/50 flex gap-4 ${n.read ? 'opacity-60' : 'bg-white dark:bg-slate-950'}`}>
                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.read ? 'bg-transparent' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              No new notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
