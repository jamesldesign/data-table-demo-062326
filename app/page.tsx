import { DataTable } from "@/components/data-table"

export default function Page() {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            A data table built with shadcn/ui and TanStack Table. Search, filter, sort, toggle
            columns, expand to fullscreen, and export to CSV.
          </p>
        </header>
        <DataTable />
      </div>
    </main>
  )
}
