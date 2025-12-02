import React from 'react'
import { AssetPickerTarget } from '../hooks/useAssetPicker'

type ImageBlockEditorProps = {
  formData: any
  handleFieldChange: (key: string, value: any) => void
  openAssetPickerWithValue: (target: AssetPickerTarget, currentValue?: string) => void
}

const ImageBlockEditor: React.FC<ImageBlockEditorProps> = ({
  formData,
  handleFieldChange,
  openAssetPickerWithValue
}) => {
  const handleOpenAssetPicker = () => {
    openAssetPickerWithValue({ fieldKey: 'src' }, formData.src)
  }

  return (
    <div className="space-y-4 bg-theme-surface p-4 rounded-lg border border-theme-divider">
      <div>
        <label className="block text-sm font-medium text-theme-textPrimary mb-1">图片</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={formData.src || ''}
            onChange={(e) => handleFieldChange('src', e.target.value)}
            className="flex-1 px-3 py-2 theme-input border border-theme-divider bg-theme-surfaceAlt focus:ring-2 focus:ring-tech-accent focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
          <button
            type="button"
            onClick={handleOpenAssetPicker}
            className="px-3 py-2 text-sm bg-theme-surfaceAlt text-theme-textSecondary hover:bg-theme-surface transition-colors border border-theme-divider rounded-md"
          >
            选择
          </button>
        </div>
        {formData.src && (
          <p className="mt-1 text-xs text-theme-textSecondary break-all">当前：{formData.src}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-theme-textPrimary mb-1">图片描述</label>
          <input
            type="text"
            value={formData.alt || ''}
            onChange={(e) => handleFieldChange('alt', e.target.value)}
            className="w-full px-3 py-2 theme-input border border-theme-divider bg-theme-surfaceAlt focus:ring-2 focus:ring-tech-accent focus:border-transparent"
            placeholder="用于 SEO 与无障碍"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-textPrimary mb-1">图片说明（可选）</label>
          <input
            type="text"
            value={formData.caption || ''}
            onChange={(e) => handleFieldChange('caption', e.target.value)}
            className="w-full px-3 py-2 theme-input border border-theme-divider bg-theme-surfaceAlt focus:ring-2 focus:ring-tech-accent focus:border-transparent"
            placeholder="展示在图片下方的说明文本"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-theme-textPrimary mb-1">链接地址（可选）</label>
          <input
            type="url"
            value={formData.linkUrl || ''}
            onChange={(e) => handleFieldChange('linkUrl', e.target.value)}
            className="w-full px-3 py-2 theme-input border border-theme-divider bg-theme-surfaceAlt focus:ring-2 focus:ring-tech-accent focus:border-transparent"
            placeholder="点击图片跳转的链接"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-theme-textPrimary mb-1">打开方式</label>
          <select
            value={formData.linkTarget || '_self'}
            onChange={(e) => handleFieldChange('linkTarget', e.target.value)}
            className="w-full px-3 py-2 theme-input border border-theme-divider bg-theme-surfaceAlt focus:ring-2 focus:ring-tech-accent focus:border-transparent"
          >
            <option value="_self">当前窗口</option>
            <option value="_blank">新窗口</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default ImageBlockEditor
