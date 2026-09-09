import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { PyramidNode } from '../../shared/types'
import { EmptyState, LoadingSpinner, PageHeader } from '../../shared/ui'

function PyramidBubble({
  node,
  level,
  onSelect,
}: {
  node: PyramidNode
  level: number
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className="group flex flex-col items-center gap-2 transition hover:scale-105"
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-700 bg-white text-center text-xs font-semibold text-teal-900 shadow-md group-hover:border-sand-400 group-hover:shadow-lg"
          style={{ backgroundColor: node.color ? `${node.color}33` : undefined }}
        >
          {node.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
        </span>
        <span className="max-w-[100px] text-center text-sm font-medium text-teal-900">
          {node.name}
        </span>
      </button>
      {node.children.length > 0 && (
        <>
          <div className="my-3 h-6 w-px bg-teal-400" />
          <div className="flex flex-wrap justify-center gap-8">
            {node.children.map((child) => (
              <PyramidBubble key={child.id} node={child} level={level + 1} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function PyramidPage() {
  const navigate = useNavigate()

  const { data: root, isLoading } = useQuery({
    queryKey: ['pyramid'],
    queryFn: () => api.get<PyramidNode>('/pyramid'),
  })

  if (isLoading) return <LoadingSpinner />
  if (!root) return <EmptyState title="Pirâmide não disponível" />

  return (
    <div>
      <PageHeader
        title="Pirâmide de comando"
        subtitle="Clique em um funcionário para ver o resumo"
      />
      <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white/80 p-8">
        <PyramidBubble
          node={root}
          level={0}
          onSelect={(id) => {
            if (!id || id === '00000000-0000-0000-0000-000000000000') return
            navigate(`/prestadores/${id}`)
          }}
        />
      </div>
    </div>
  )
}
