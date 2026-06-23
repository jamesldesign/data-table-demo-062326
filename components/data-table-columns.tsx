"use client"

import type { ColumnDef, RowData } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, ExternalLink, MoreHorizontal } from "lucide-react"

import type { Priority, Project } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Extend TanStack's table meta so cells can mutate the source data.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowId: string, columnId: string, value: unknown) => void
  }
}

const statusVariant: Record<Project["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  pending: "secondary",
  archived: "outline",
}

const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function SortButton({
  label,
  sorted,
  onToggle,
}: {
  label: string
  sorted: false | "asc" | "desc"
  onToggle: (desc: boolean) => void
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 data-[state=open]:bg-accent"
      onClick={() => onToggle(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp data-icon="inline-end" />
      ) : sorted === "desc" ? (
        <ArrowDown data-icon="inline-end" />
      ) : (
        <ChevronsUpDown data-icon="inline-end" className="text-muted-foreground" />
      )}
    </Button>
  )
}

export const columns: ColumnDef<Project>[] = [
  {
    id: "select",
    size: 48,
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "id",
    size: 96,
    header: ({ column }) => (
      <SortButton
        label="ID"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.getValue("id")}</span>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortButton
        label="Project"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row }) => (
      <a
        href={row.original.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
      >
        {row.getValue("name")}
        <ExternalLink className="size-3 text-muted-foreground" />
      </a>
    ),
  },
  {
    accessorKey: "owner",
    header: ({ column }) => (
      <SortButton
        label="Owner"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row }) => <span>{row.getValue("owner")}</span>,
  },
  {
    accessorKey: "status",
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    header: ({ column }) => (
      <SortButton
        label="Status"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Project["status"]
      return (
        <Badge variant={statusVariant[status]} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <SortButton
        label="Priority"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row, column, table }) => {
      const value = row.getValue("priority") as Priority
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="h-8 w-28 justify-between" />
            }
          >
            {priorityLabel[value]}
            <ChevronsUpDown className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-28">
            <DropdownMenuLabel>Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={value}
              onValueChange={(v) => table.options.meta?.updateData(row.original.id, column.id, v)}
            >
              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    accessorKey: "enabled",
    header: "Enabled",
    enableSorting: false,
    cell: ({ row, column, table }) => (
      <Switch
        checked={row.getValue("enabled")}
        onCheckedChange={(v) => table.options.meta?.updateData(row.original.id, column.id, v)}
        aria-label="Toggle enabled"
      />
    ),
  },
  {
    accessorKey: "progress",
    header: ({ column }) => (
      <SortButton
        label="Progress"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("progress") as number
      return (
        <div className="flex w-40 items-center gap-2">
          <span className="w-9 text-xs tabular-nums text-muted-foreground">{value}%</span>
          <Progress value={value} className="h-2" />
        </div>
      )
    },
  },
  {
    accessorKey: "budget",
    header: ({ column }) => (
      <SortButton
        label="Budget"
        sorted={column.getIsSorted()}
        onToggle={(desc) => column.toggleSorting(desc)}
      />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{currency.format(row.getValue("budget"))}</span>
    ),
  },
  {
    accessorKey: "notes",
    header: "Notes",
    enableSorting: false,
    cell: ({ row, column, table }) => (
      <Input
        defaultValue={row.getValue("notes")}
        onBlur={(e) => table.options.meta?.updateData(row.original.id, column.id, e.target.value)}
        className="h-8 w-48"
        aria-label="Notes"
      />
    ),
  },
  {
    id: "actions",
    size: 64,
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-8" />}
          aria-label="Open row actions"
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(row.original.id)}>
              Copy project ID
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(row.original.url, "_blank")}>
              Open project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
