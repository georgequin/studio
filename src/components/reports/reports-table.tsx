'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpDown,
  ChevronDown,
  Download,
  Eye,
} from 'lucide-react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Report, Source } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/thematic-areas';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const convertToCSV = (data: Report[], sourceMap: Map<string, string>) => {
  const headers = ['ID', 'Publication Date', 'Title', 'Source', 'Category', 'Thematic Area', 'Summary'];
  const rows = data.map(d => [
    d.id,
    d.publicationDate,
    `"${(d.title || '').replace(/"/g, '""')}"`,
    sourceMap.get(d.sourceId) || d.sourceId,
    d.category,
    d.thematicArea,
    `"${(d.summary || '').replace(/"/g, '""')}"`
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
};

const downloadCSV = (data: Report[], sourceMap: Map<string, string>) => {
  const csvString = convertToCSV(data, sourceMap);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `nhrc_reports_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const getColumns = (sourceMap: Map<string, string>): ColumnDef<Report>[] => [
  {
    accessorKey: 'publicationDate',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{new Date(row.getValue('publicationDate')).toLocaleDateString()}</div>,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'sourceId',
    header: 'Source',
    cell: ({ row }) => <div>{sourceMap.get(row.getValue('sourceId')) || 'Unknown Source'}</div>,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
        const category = row.getValue('category') as string;
        const color = CATEGORY_COLORS[category] || 'hsl(var(--muted-foreground))';
        return (
            <Badge variant="outline" style={{ borderColor: color, color }}>
                {category}
            </Badge>
        );
    },
  },
  {
    accessorKey: 'thematicArea',
    header: 'Thematic Area',
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue('thematicArea')}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const report = row.original;

      return (
        <ReportDetailsDialog report={report} sourceName={sourceMap.get(report.sourceId) || 'Unknown Source'} />
      )
    }
  }
];

const ReportDetailsDialog = ({ report, sourceName }: { report: Report; sourceName: string }) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Details</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{report.title}</DialogTitle>
                    <DialogDescription>
                        {sourceName} &middot; {new Date(report.publicationDate).toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-6">
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1">
                            <h4 className="font-semibold">Summary</h4>
                            <p className="text-sm text-muted-foreground">{report.summary}</p>
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Full Extracted Article</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.content}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="font-semibold">Category</h4>
                                <p className="text-sm text-muted-foreground">{report.category}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold">Thematic Area</h4>
                                <p className="text-sm text-muted-foreground">{report.thematicArea}</p>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};


export function ReportsTable() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const reportsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'reports');
  }, [firestore]);
  const { data: reports, isLoading: reportsLoading } = useCollection<Report>(reportsCollection);

  const sourcesCollection = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'sources');
  }, [firestore]);
  const { data: sources, isLoading: sourcesLoading } = useCollection<Source>(sourcesCollection);

  const sourceMap = React.useMemo(() => {
    const map = new Map<string, string>();
    sources?.forEach(source => {
      map.set(source.id, source.name);
    });
    return map;
  }, [sources]);
  
  const isLoading = reportsLoading || sourcesLoading;
  const data = reports || [];
  const columns = React.useMemo(() => getColumns(sourceMap), [sourceMap]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    const reportIdToView = searchParams.get('view');
    if(reportIdToView && table.getCoreRowModel().rows.length > 0) {
        const row = table.getCoreRowModel().rows.find(r => r.original.id === reportIdToView);
        if(row){
            row.toggleSelected(true);
            const actionCell = row.getVisibleCells().find(cell => cell.column.id === 'actions');
            // This is a bit of a hack to trigger the dialog
            // In a real app, you might use a state management library to control the dialog
            (actionCell?.getContext()?.cell?.column?.id === 'actions') &&
            setTimeout(() => {
                 const trigger = document.querySelector(`[data-state="selected"] [aria-haspopup="dialog"]`) as HTMLButtonElement | null;
                 trigger?.click();
            }, 100);
        }
    }
  }, [searchParams, table]);


  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter by title..."
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === 'sourceId' ? 'Source' : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="default" onClick={() => downloadCSV(data, sourceMap)} disabled={isLoading || data.length === 0}>
          <Download className="mr-2"/>
          Export CSV
        </Button>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        Loading reports...
                    </TableCell>
                </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {data.length} row(s) displayed.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
