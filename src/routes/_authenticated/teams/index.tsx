import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { teamsApi } from '@/api/teams';
import { departmentsApi } from '@/api/departments';
import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
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
import * as z from 'zod';
import type { Team } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

const teamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department_id: z.string().min(1, 'Department is required'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export const Route = createFileRoute('/_authenticated/teams/')({
  component: TeamsPage,
});

function TeamsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, perPage, debouncedSearch],
    queryFn: () => teamsApi.getTeams({ page, per_page: perPage, search: debouncedSearch }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (values: TeamFormValues) => teamsApi.createTeam({
      ...values,
      department_id: Number(values.department_id)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create team');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeamFormValues }) =>
      teamsApi.updateTeam(id, {
        ...data,
        department_id: Number(data.department_id)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
      setIsDialogOpen(false);
      setEditingTeam(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update team');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: teamsApi.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
      setIsDialogOpen(false);
      setDeletingTeam(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete team');
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      department_id: '',
      description: '',
      is_active: true,
    } as TeamFormValues,
    validators: {
      onSubmit: teamSchema,
    },
    onSubmit: async ({ value }) => {
      if (editingTeam) {
        updateMutation.mutate({ id: editingTeam.id, data: value });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    form.reset({
      name: team.name,
      department_id: team.department_id.toString(),
      description: team.description || '',
      is_active: !!team.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (team: Team) => {
    setDeletingTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'department.name',
      header: 'Department',
      cell: ({ row }: any) => <div>{row.original.department?.name || '-'}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => (
        <div className="max-w-[250px] truncate text-muted-foreground">
          {row.getValue('description') || '-'}
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
          <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">Manage your organization's teams</p>
        </div>
        <Button onClick={() => {
          setEditingTeam(null);
          form.reset({ name: '', department_id: '', description: '', is_active: true });
          setIsDialogOpen(true);
        }} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add Team
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Add Team'}</DialogTitle>
            <DialogDescription>
              {editingTeam
                ? 'Update the team details below.'
                : 'Fill in the details to create a new team.'}
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
                      placeholder="Frontend Team"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <form.Field
              name="department_id"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
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
              name="description"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Team description..."
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <form.Field
              name="is_active"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field orientation="horizontal" data-invalid={isInvalid} className="items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Active Status</FieldLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable or disable this team
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
                {editingTeam ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deletingTeam && deleteMutation.mutate(deletingTeam.id)}
        title="Delete Team"
        description={`Are you sure you want to delete the team "${deletingTeam?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
