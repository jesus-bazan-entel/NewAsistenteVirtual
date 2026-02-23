import { useState, useMemo, type ReactNode } from 'react'

// --- Types ---

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
}

type SortDirection = 'asc' | 'desc'

const PAGE_SIZES = [10, 25, 50, 100]

// --- Helpers ---

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

// --- Skeleton Row ---

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-white/5 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

// --- Component ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const lower = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = getNestedValue(row, col.key)
        if (val == null) return false
        return String(val).toLowerCase().includes(lower)
      }),
    )
  }, [data, search, columns])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => {
      const aVal = getNestedValue(a, sortKey)
      const bVal = getNestedValue(b, sortKey)
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, safePage, pageSize])

  // Handlers
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  // Render sort indicator
  const sortIndicator = (key: string) => {
    if (sortKey !== key) return <span className="ml-1 text-white/20">{'\u2195'}</span>
    return <span className="ml-1 text-entel-orange">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-white/[0.06]">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-entel-orange/50 focus:border-entel-orange/50 transition-all"
          />
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-entel-orange/50"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s} className="bg-[#1a1a24] text-white">
                {s}
              </option>
            ))}
          </select>
          <span>registros</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-left text-xs font-sans font-semibold text-white/50 uppercase tracking-wider
                    ${col.sortable !== false ? 'cursor-pointer hover:text-white/80 select-none' : ''}
                  `}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable !== false && sortIndicator(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-white/40 text-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-white/10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <span>No se encontraron registros</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, rowIdx) => (
                <tr
                  key={(row as Record<string, unknown>).id != null ? String((row as Record<string, unknown>).id) : rowIdx}
                  className={`
                    transition-colors duration-150
                    hover:bg-white/[0.02]
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-white/80 font-sans">
                      {col.render
                        ? col.render(row, (safePage - 1) * pageSize + rowIdx)
                        : String(getNestedValue(row, col.key) ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <span className="text-sm text-white/40">
            Mostrando {(safePage - 1) * pageSize + 1} a{' '}
            {Math.min(safePage * pageSize, sorted.length)} de {sorted.length} registros
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage <= 1}
              className="px-2 py-1 text-sm text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/5"
            >
              {'\u00AB'}
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2 py-1 text-sm text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/5"
            >
              {'\u2039'}
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && arr[idx - 1] !== p - 1) {
                  acc.push('ellipsis')
                }
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-2 py-1 text-sm text-white/30">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`
                      px-3 py-1 text-sm rounded transition-colors
                      ${
                        safePage === item
                          ? 'bg-entel-orange text-white'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {item}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2 py-1 text-sm text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/5"
            >
              {'\u203A'}
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages}
              className="px-2 py-1 text-sm text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded hover:bg-white/5"
            >
              {'\u00BB'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
