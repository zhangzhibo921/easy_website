import React from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface LinkBlockEditorProps {
  links: any[]
  onAdd: () => void
  onChange: (index: number, fieldKey: string, value: any) => void
  onRemove: (index: number) => void
}

const LinkBlockEditor: React.FC<LinkBlockEditorProps> = ({ links, onAdd, onChange, onRemove }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">链接列表</h4>
        <button
          onClick={onAdd}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-tech-accent text-white rounded-lg hover:bg-tech-secondary transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>新增链接</span>
        </button>
      </div>

      {links.map((link: any, index: number) => (
        <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              链接 {index + 1}
            </span>
            <button
              onClick={() => onRemove(index)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <input
            type="text"
            value={link.text || ''}
            onChange={(e) => onChange(index, 'text', e.target.value)}
            placeholder="链接文本"
            className="w-full px-2 py-1 text-sm rounded theme-input"
          />
          <input
            type="url"
            value={link.url || ''}
            onChange={(e) => onChange(index, 'url', e.target.value)}
            placeholder="链接地址"
            className="w-full px-2 py-1 text-sm rounded theme-input"
          />
        </div>
      ))}
    </div>
  )
}

export default LinkBlockEditor
