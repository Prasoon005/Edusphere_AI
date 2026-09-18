import { DeviceCategory } from "@prisma/client";
import { prisma } from "../../lib/prisma";

/**
 * Lightweight, privacy-conscious visitor tracking. No User row, no auth session —
 * just an anonymous client-generated id stored against a small allowlisted public
 * route surface. Never capable of hitting authenticated routes.
 */
export async function startSession(anonymousId: string, entryPage: string, deviceCategory: DeviceCategory) {
  return prisma.visitorSession.upsert({
    where: { anonymousId },
    create: { anonymousId, entryPage, deviceCategory },
    update: { lastSeenAt: new Date() },
  });
}

export async function recordPageView(anonymousId: string, path: string) {
  const session = await prisma.visitorSession.findUnique({ where: { anonymousId } });
  if (!session) return null;
  await prisma.visitorSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return prisma.visitorPageView.create({ data: { sessionId: session.id, path } });
}

export async function endSession(anonymousId: string, exitPage?: string) {
  const session = await prisma.visitorSession.findUnique({ where: { anonymousId } });
  if (!session) return null;
  return prisma.visitorSession.update({
    where: { id: session.id },
    data: { exitPage, endedAt: new Date() },
  });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getVisitorAnalytics() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);

  const [visitorsToday, visitorsThisWeek, visitorsThisMonth, allSessions] = await Promise.all([
    prisma.visitorSession.count({ where: { startedAt: { gte: todayStart } } }),
    prisma.visitorSession.count({ where: { startedAt: { gte: weekStart } } }),
    prisma.visitorSession.count({ where: { startedAt: { gte: monthStart } } }),
    prisma.visitorSession.findMany({
      where: { startedAt: { gte: monthStart } },
      include: { pageViews: true },
    }),
  ]);

  const durations = allSessions
    .filter((s) => s.endedAt)
    .map((s) => (s.endedAt!.getTime() - s.startedAt.getTime()) / 1000);
  const avgSessionDurationSeconds =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const pageCounts = new Map<string, number>();
  for (const s of allSessions) {
    for (const pv of s.pageViews) {
      pageCounts.set(pv.path, (pageCounts.get(pv.path) ?? 0) + 1);
    }
  }
  const mostVisitedPages = Array.from(pageCounts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const deviceCounts = new Map<string, number>();
  for (const s of allSessions) {
    deviceCounts.set(s.deviceCategory, (deviceCounts.get(s.deviceCategory) ?? 0) + 1);
  }

  // Simple daily trend for the last 14 days
  const trend: Array<{ date: string; visitors: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = allSessions.filter((s) => s.startedAt >= dayStart && s.startedAt < dayEnd).length;
    trend.push({ date: dayStart.toISOString().slice(0, 10), visitors: count });
  }

  return {
    visitorsToday,
    visitorsThisWeek,
    visitorsThisMonth,
    avgSessionDurationSeconds,
    mostVisitedPages,
    deviceBreakdown: Array.from(deviceCounts.entries()).map(([device, count]) => ({ device, count })),
    trend,
  };
}
