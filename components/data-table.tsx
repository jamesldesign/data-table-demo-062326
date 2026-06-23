"use client"

import * as React from "react"
import {
  type Column,
  type ColumnFiltersState,
  type ColumnPinningState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  Pin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { columns } from "@/components/data-table-columns"
import { generateProjects, type Project, type Status } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STATUS_OPTIONS: Status[] = ["active", "pending", "archived"]

// Column id -> human label for the visibility menu.
const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  name: "Project",
  owner: "Owner",
  status: "Status",
  priority: "Priority",
  enabled: "Enabled",
  progress: "Progress",
  budget: "Budget",
  notes: "Notes",
}

function downloadCsv(rows: Project[]) {
  const headers: (keyof Project)[] = [
    "id",
    "name",
    "owner",
    "status",
    "priority",
    "enabled",
    "progress",
    "budget",
    "notes",
  ]
  const escape = (value: unknown) => {
    const str = String(value ?? "")
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `projects-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Sticky positioning + border/shadow styles for pinned columns.
// Borders and shadows are applied inline (not via Tailwind) so they are never
// overridden by base table styles or clipped by overflow containers.
function getPinningStyles(column: Column<Project>, isHeader = false): React.CSSProperties {
  const pinned = column.getIsPinned()
  if (!pinned) return {}
  const width = column.getSize()
  const isLeftEdge = pinned === "left" && column.getIsLastColumn("left")
  const isRightEdge = pinned === "right" && column.getIsFirstColumn("right")

  return {
    position: "sticky",
    left: pinned === "left" ? column.getStart("left") : undefined,
    right: pinned === "right" ? column.getAfter("right") : undefined,
    width,
    minWidth: width,
    maxWidth: width,
    // Border on the exposed edge of the pinned group.
    borderRight: isLeftEdge ? "1px solid var(--border)" : undefined,
    borderLeft: isRightEdge ? "1px solid var(--border)" : undefined,
    // Shadow cast onto the scrolling content — always visible while sticky.
    boxShadow: isLeftEdge
      ? "4px 0 8px -2px rgba(0,0,0,0.15)"
      : isRightEdge
        ? "-4px 0 8px -2px rgba(0,0,0,0.15)"
        : undefined,
    // Header cells sit above body cells; bump their z-index accordingly.
    zIndex: isHeader ? 31 : 11,
  }
}

export function DataTable() {
  const [data, setData] = React.useState<Project[]>(() => generateProjects(120))
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "id", desc: false }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expanded, setExpanded] = React.useState(false)
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [],
    right: [],
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnPinning,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: setColumnPinning,
    globalFilterFn: "includesString",
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      updateData: (rowId, columnId, value) => {
        setData((prev) =>
          prev.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)),
        )
      },
    },
  })

  const statusFilter = (table.getColumn("status")?.getFilterValue() as string[]) ?? []

  const toggleStatus = (status: Status, checked: boolean) => {
    const next = checked
      ? [...statusFilter, status]
      : statusFilter.filter((s) => s !== status)
    table.getColumn("status")?.setFilterValue(next.length ? next : undefined)
  }

  const filteredRows = table.getFilteredRowModel().rows
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  const visibleColumns = table.getVisibleLeafColumns()

  // Sticky edge columns: pin the first column to the left and last to the right.
  const stickyEdges = (columnPinning.left?.length ?? 0) > 0

  const toggleStickyEdges = (checked: boolean) => {
    if (checked) {
      const leaves = table.getAllLeafColumns()
      const left = leaves.slice(0, 2).map((c) => c.id)
      const last = leaves[leaves.length - 1]?.id
      setColumnPinning({
        left,
        right: last ? [last] : [],
      })
    } else {
      setColumnPinning({ left: [], right: [] })
    }
  }

  const tableUi = (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      {/* Sticky controls bar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-neutral-100 p-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search projects..."
            className="h-9 bg-white pl-8"
            aria-label="Search"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {(statusFilter.length > 0 || globalFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => {
                setGlobalFilter("")
                table.resetColumnFilters()
              }}
            >
              <X data-icon="inline-start" />
              Reset
            </Button>
          )}

          {/* Sticky edge columns toggle */}
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium">
            <Pin
              className={cn(
                "size-4",
                stickyEdges ? "text-foreground" : "text-muted-foreground",
              )}
            />
            <span className="hidden sm:inline">Sticky edges</span>
            <Switch checked={stickyEdges} onCheckedChange={toggleStickyEdges} />
          </label>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-9" />}>
              <Filter data-icon="inline-start" />
              Filter
              {statusFilter.length > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-sm px-1">
                  {statusFilter.length}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    className="capitalize"
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(checked) => toggleStatus(status, !!checked)}
                    closeOnClick={false}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-9" />}>
              <SlidersHorizontal data-icon="inline-start" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide() && COLUMN_LABELS[column.id])
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      closeOnClick={false}
                    >
                      {COLUMN_LABELS[column.id]}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => downloadCsv(filteredRows.map((r) => r.original))}
          >
            <Download data-icon="inline-start" />
            <span className="hidden sm:inline">Download CSV</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse table" : "Expand table"}
          >
            {expanded ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>

      {/* Single scroll container: scrolls both axes, header stays sticky,
          and the horizontal scrollbar stays pinned just above the footer */}
      <div className="relative min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[32rem] caption-bottom text-sm">
          <TableHeader className="sticky top-0 z-20 bg-neutral-50 shadow-[inset_0_-1px_0_var(--border)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const pinned = header.column.getIsPinned()
                  return (
                    <TableHead
                      key={header.id}
                      style={getPinningStyles(header.column, true)}
                      className={cn("bg-neutral-50", pinned && "z-30")}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group/row"
                >
                  {row.getVisibleCells().map((cell) => {
                    const pinned = cell.column.getIsPinned()
                    return (
                      <TableCell
                        key={cell.id}
                        style={getPinningStyles(cell.column)}
                        className={cn(
                          pinned &&
                            "z-10 bg-card group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      {/* Sticky footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-neutral-100 px-3 py-2.5">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount} of ` : ""}
          <span className="font-medium text-foreground">{filteredRows.length}</span>{" "}
          {filteredRows.length === 1 ? "result" : "results"}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">Rows per page</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm font-medium tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className={cn("flex min-h-[30rem] max-h-[50rem] flex-col", expanded && "invisible")}>
        {!expanded && tableUi}
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 h-screen max-h-screen w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-3 ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">Projects data table (expanded)</DialogTitle>
          {expanded && tableUi}
        </DialogContent>
      </Dialog>
    </>
  )
}
