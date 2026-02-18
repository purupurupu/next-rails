import { Navigation } from "@/components/navigation";
import { DashboardPage } from
  "@/features/dashboard/components/DashboardPage";
import { fetchDashboardData } from
  "@/features/dashboard/lib/server-fetcher";

/**
 * Dashboard page - async Server Component
 *
 * Fetches initial dashboard stats on the server for SSR,
 * then hands off to the client component for SWR revalidation.
 * Authentication is handled by middleware.
 */
export default async function Dashboard() {
  const initialStats = await fetchDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <DashboardPage initialStats={initialStats} />
      </div>
    </div>
  );
}
