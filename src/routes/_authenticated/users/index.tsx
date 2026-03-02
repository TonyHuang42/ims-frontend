import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useStore } from '@tanstack/react-form';
import { usersApi } from '@/api/users';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { rolesApi } from '@/api/roles';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Shield } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import * as z from 'zod';
import type { User, Role } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  department_id: z.string().optional().nullable(),
  team_id: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  role_ids: z.array(z.number()).default([]),
});

type UserFormValues = z.infer<typeof userSchema>;

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage,
});

function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [roleManagingUser, setRoleManagingUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, perPage, debouncedSearch],
    queryFn: () => usersApi.getUsers({ page, per_page: perPage, search: debouncedSearch }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 100 }),
  });

  const { data: teamsData } = useQuery({
    queryKey: ['teams-all'],
    queryFn: () => teamsApi.getTeams({ per_page: 100 }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => rolesApi.getRoles({ per_page: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => usersApi.createUser({
      ...values,
      department_id: values.department_id ? Number(values.department_id) : null,
      team_id: values.team_id ? Number(values.team_id) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormValues }) =>
      usersApi.updateUser(id, {
        ...data,
        department_id: data.department_id ? Number(data.department_id) : null,
        team_id: data.team_id ? Number(data.team_id) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const syncRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: number; roleIds: number[] }) =>
      usersApi.syncUserRoles(id, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Roles updated successfully');
      setIsRolesDialogOpen(false);
      setRoleManagingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update roles');
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      department_id: '',
      team_id: '',
      is_active: true,
      role_ids: [],
    } as UserFormValues,
    validators: {
      onSubmit: userSchema,
    },
    onSubmit: async ({ value }) => {
      if (editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: value });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  const departmentIdValue = useStore(form.store, (state) => state.values.department_id);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      password: '',
      department_id: user.department_id?.toString() || '',
      team_id: user.team_id?.toString() || '',
      is_active: !!user.is_active,
      role_ids: user.roles?.map(r => r.id) || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleManageRoles = (user: User) => {
    setRoleManagingUser(user);
    setIsRolesDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'department.name',
      header: 'Department',
      cell: ({ row }: any) => <div>{row.original.department?.name || '-'}</div>,
    },
    {
      accessorKey: 'team.name',
      header: 'Team',
      cell: ({ row }: any) => <div>{row.original.team?.name || '-'}</div>,
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles?.map((role: Role) => (
            <Badge key={role.id} variant="outline" className="text-[10px]">
              {role.name}
            </Badge>
          ))}
          {!row.original.roles?.length && <span className="text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: any) => <StatusBadge isActive={!!row.getValue('is_active')} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleManageRoles(row.original)}
            disabled={!isAdmin}
            title="Manage Roles"
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row.original)}
            disabled={!isAdmin}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
            disabled={!isAdmin}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => {
          setEditingUser(null);
          form.reset({ name: '', email: '', password: '', department_id: '', team_id: '', is_active: true, role_ids: [] });
          setIsDialogOpen(true);
        }} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
      />

      {data && (
        <DataTablePagination
          currentPage={page}
          lastPage={data.meta.last_page}
          onPageChange={setPage}
          perPage={perPage}
          onPerPageChange={(val) => {
            setPerPage(val);
            setPage(1);
          }}
          total={data.meta.total}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update the user details below.'
                : 'Fill in the details to create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="John Doe"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="john@example.com"
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
            </div>
            <form.Field
              name="password"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{editingUser ? 'New Password (optional)' : 'Password'}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="••••••••"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="department_id"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value || ''}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {departmentsData?.data.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
              <form.Field
                name="team_id"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Team</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value || ''}
                        onValueChange={field.handleChange}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {teamsData?.data
                            .filter(team => !departmentIdValue || departmentIdValue === 'none' || team.department_id.toString() === departmentIdValue)
                            .map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
            </div>
            <form.Field
              name="is_active"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field orientation="horizontal" data-invalid={isInvalid} className="items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Active Status</FieldLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this user account
                      </div>
                    </FieldContent>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                      aria-invalid={isInvalid}
                    />
                  </Field>
                );
              }}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles: {roleManagingUser?.name}</DialogTitle>
            <DialogDescription>
              Select the roles to assign to this user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {rolesData?.data.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={roleManagingUser?.roles?.some(r => r.id === role.id)}
                  onCheckedChange={(checked) => {
                    const currentRoles = roleManagingUser?.roles || [];
                    let newRoles;
                    if (checked) {
                      newRoles = [...currentRoles, role];
                    } else {
                      newRoles = currentRoles.filter(r => r.id !== role.id);
                    }
                    setRoleManagingUser(prev => prev ? { ...prev, roles: newRoles } : null);
                  }}
                />
                <label
                  htmlFor={`role-${role.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {role.name}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRolesDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (roleManagingUser) {
                  syncRolesMutation.mutate({
                    id: roleManagingUser.id,
                    roleIds: roleManagingUser.roles?.map(r => r.id) || []
                  });
                }
              }}
              disabled={syncRolesMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        title="Delete User"
        description={`Are you sure you want to delete the user "${deletingUser?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
