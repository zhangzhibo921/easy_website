import { ComponentDefinition } from '@/types/templates'
import { VideoPlayerPreview } from '@/components/PageBuilder/previews'

export const uncategorizedComponents: ComponentDefinition[] = [
  {
    type: 'video-player',
    name: '视频组件',
    description: '从素材库或外链播放视频，可切换全宽/标准宽度',
    icon: '🎬',
    category: '未分类组件',
    defaultProps: {
      title: '产品演示视频',
      description: '支持从素材库选择或粘贴外链，视频区域会占满组件宽度',
      videoUrl: '',
      poster: '',
      autoPlay: false,
      loop: false,
      muted: true,
      controls: true,
      widthOption: 'full',
      backgroundColorOption: 'default'
    },
    editableFields: [
      { key: 'title', label: '标题', type: 'text', value: '' },
      { key: 'description', label: '描述', type: 'textarea', value: '' },
      { key: 'videoUrl', label: '视频地址', type: 'text', value: '' },
      { key: 'poster', label: '封面图（可选）', type: 'image', value: '' },
      { key: 'autoPlay', label: '自动播放', type: 'text', value: false },
      { key: 'loop', label: '循环播放', type: 'text', value: false },
      { key: 'muted', label: '静音播放', type: 'text', value: true },
      { key: 'controls', label: '显示控制条', type: 'text', value: true },
      {
        key: 'widthOption',
        label: '宽度',
        type: 'text',
        value: 'full',
        options: [
          { label: '全宽', value: 'full' },
          { label: '标准宽度', value: 'standard' }
        ]
      },
      {
        key: 'backgroundColorOption',
        label: '背景',
        type: 'text',
        value: 'default',
        options: [
          { label: '默认背景', value: 'default' },
          { label: '透明背景', value: 'transparent' }
        ]
      }
    ],
    previewComponent: VideoPlayerPreview
  }
]
