"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, Eye } from "lucide-react";

interface StatsCardsProps {
  activeWatches: number;
  newToday: number;
  unread: number;
}

export function StatsCards({ activeWatches, newToday, unread }: StatsCardsProps) {
  const stats = [
    { label: "Aktívne sledovania", value: activeWatches, icon: Activity },
    { label: "Nové dnes", value: newToday, icon: Bell },
    { label: "Neprečítané", value: unread, icon: Eye },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
