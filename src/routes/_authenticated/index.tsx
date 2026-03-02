import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Users2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const { data: usersData } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => usersApi.getUsers({ per_page: 1 }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-count'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 1 }),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams-count'],
    queryFn: () => teamsApi.getTeams({ per_page: 1 }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-count'],
    queryFn: () => rolesApi.getRoles({ per_page: 1 }),
  });

  const stats = [
    {
      title: 'Total Users',
      value: usersData?.meta.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Departments',
      value: departmentsData?.meta.total || 0,
      icon: Building2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Teams',
      value: teamsData?.meta.total || 0,
      icon: Users2,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Roles',
      value: rolesData?.meta.total || 0,
      icon: ShieldCheck,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h2>
        <p className="text-muted-foreground">Here's an overview of your organization.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-md p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
