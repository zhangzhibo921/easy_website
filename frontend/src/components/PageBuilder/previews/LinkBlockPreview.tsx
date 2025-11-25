import React from 'react'
import { TemplateComponent } from '@/types/templates'

export const LinkBlockPreview: React.FC<{ component: TemplateComponent }> = ({ component }) => {
  const {title, links = [], widthOption = 'full', backgroundColorOption = 'default'} = component.props

  // 根据宽度选项设置容器类名
  const containerClass = `${widthOption === 'standard' ? 'max-w-screen-2xl mx-auto' : 'w-full'} ${backgroundColorOption === 'transparent' ? '' : 'bg-color-surface'}`;

  // 如果links为空，提供默认的演示数据
  const displayLinks = links.length > 0 ? links : [
    { text: '官方网站', url: 'https://example.com' },
    { text: '产品文档', url: 'https://docs.example.com' },
    { text: '技术支持', url: 'https://support.example.com' }
  ]

  return (
    <div className={containerClass}>
      <div className={`link-block-preview p-8 rounded-lg shadow-sm ${backgroundColorOption === 'transparent' ? '' : 'bg-color-surface'}`}>
      {title && (
        <h2 className="link-block-title text-3xl font-bold mb-6 text-text-primary text-center">
          {title}
        </h2>
      )}
      <div className="link-block-container flex flex-wrap justify-center gap-4">
        {displayLinks.map((link: any, index: number) => (
          <a
            key={index}
            href={link.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="link-block-item px-6 py-3 bg-transparent border-2 border-text-primary text-text-primary rounded-lg hover:bg-text-primary hover:text-color-surface transition-all duration-300 font-medium"
          >
            {link.text || '链接文本'}
          </a>
        ))}
      </div>
    </div>
  </div>
  )
}


// 功能网格-大图预览
