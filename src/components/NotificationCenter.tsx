import { useState } from "react";
import { Bell, MessageSquare, UserPlus, Users, X } from "lucide-react";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationCenter() {
  const { unreadMessages, pendingFriendRequests, pendingPartnerRequests, total, loading } = useNotificationCounts();
  const [open, setOpen] = useState(false);

  const notifications = [
    {
      icon: MessageSquare,
      label: "Ungelesene Nachrichten",
      count: unreadMessages,
      path: "/friends",
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: UserPlus,
      label: "Freundschaftsanfragen",
      count: pendingFriendRequests,
      path: "/friends",
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      icon: Users,
      label: "Partner-Anfragen",
      count: pendingPartnerRequests,
      path: "/friends",
      color: "text-purple-500 bg-purple-500/10",
    },
  ].filter(n => n.count > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {total > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full px-1"
              >
                {total > 99 ? "99+" : total}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Benachrichtigungen</h3>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{total} neu</span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Laden...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Keine neuen Benachrichtigungen</p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification, i) => (
                <Link
                  key={i}
                  to={notification.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", notification.color)}>
                    <notification.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.count} {notification.count === 1 ? "neue" : "neue"}
                    </p>
                  </div>
                  <span className="flex items-center justify-center min-w-[24px] h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
                    {notification.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
