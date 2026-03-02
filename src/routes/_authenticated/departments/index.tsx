import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
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
import { Switch } from '@/components/ui/switch';
import * as z from 'zod';
import type { Department } from '@/types/api';
import { useAuth } from '@/hooks/use-auth';

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const Route = createFileRoute('/_authenticated/departments/')({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, perPage, debouncedSearch],
    queryFn: () => departmentsApi.getDepartments({ page, per_page: perPage, search: debouncedSearch }),
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create department');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DepartmentFormValues }) =>
      departmentsApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      setIsDialogOpen(false);
      setEditingDepartment(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update department');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    } as DepartmentFormValues,
    validators: {
      onSubmit: departmentSchema,
    },
    onSubmit: async ({ value }) => {
      if (editingDepartment) {
        updateMutation.mutate({ id: editingDepartment.id, data: value });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  const handleEdit = (dept: Department) => {
    setEditingDepartment(dept);
    form.reset({
      name: dept.name,
      description: dept.description || '',
      is_active: !!dept.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (dept: Department) => {
    setDeletingDepartment(dept);
    setIsDeleteDialogOpen(true);
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }: any) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }: any) => (
        <div className="max-w-[300px] truncate text-muted-foreground">
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
          <h2 className="text-2xl font-bold tracking-tight">Departments</h2>
          <p className="text-muted-foreground">Manage your organization's departments</p>
        </div>
        <Button onClick={() => {
          setEditingDepartment(null);
          form.reset({ name: '', description: '', is_active: true });
          setIsDialogOpen(true);
        }} disabled={!isAdmin}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
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
            <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? 'Update the department details below.'
                : 'Fill in the details to create a new department.'}
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
                      placeholder="Engineering"
                      aria-invalid={isInvalid}
                    />
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
                      placeholder="Department description..."
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
                        Enable or disable this department
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
                {editingDepartment ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deletingDepartment && deleteMutation.mutate(deletingDepartment.id)}
        title="Delete Department"
        description={`Are you sure you want to delete the department "${deletingDepartment?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
