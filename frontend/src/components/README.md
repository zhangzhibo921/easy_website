# ThemeAwareHeader 组件

## 介绍

ThemeAwareHeader 是一个高度可定制的、主题感知的导航栏组件，专为 Next.js 项目设计。它能够根据当前应用的主题自动调整背景色、文本颜色和边框颜色，确保在所有主题下都有良好的对比度和可读性。

## 特性

- ✨ **主题感知**：自动适应当前应用的主题，确保视觉一致性
- 🎨 **智能颜色计算**：根据主题特性（深色/浅色）自动计算合适的颜色组合
- 📱 **响应式设计**：完美支持桌面和移动设备
- 🎯 **良好的对比度**：确保在任何主题下文本与背景都有足够的对比度
- 🎬 **平滑动画**：使用 Framer Motion 实现流畅的过渡效果
- 📊 **动态数据**：支持从 API 获取导航数据
- ⚡ **性能优化**：懒加载和条件渲染确保高性能

## 安装

组件已包含在项目中，直接导入即可使用：

```tsx
import ThemeAwareHeader from '@/components/ThemeAwareHeader'
```

## 使用方法

### 基本用法

```tsx
import ThemeAwareHeader from '@/components/ThemeAwareHeader'

function MyPage() {
  return (
    <div>
      <ThemeAwareHeader 
        siteName="我的网站"
        logo="/path/to/logo.png"
      />
      {/* 页面内容 */}
    </div>
  )
}
```

### 自定义导航项

```tsx
import ThemeAwareHeader from '@/components/ThemeAwareHeader'

const customNavigation = [
  { label: '首页', href: '/' },
  { 
    label: '产品', 
    href: '/products',
    children: [
      { label: '产品A', href: '/products/a' },
      { label: '产品B', href: '/products/b' }
    ]
  },
  { label: '关于我们', href: '/about' },
  { label: '联系我们', href: '/contact', external: true }
]

function MyPage() {
  return (
    <div>
      <ThemeAwareHeader 
        siteName="我的网站"
        navigation={customNavigation}
      />
      {/* 页面内容 */}
    </div>
  )
}
```

## 属性

`ThemeAwareHeader` 组件支持以下属性：

| 属性名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| `logo` | string | Logo 图片的 URL | '/logo.png' |
| `siteName` | string | 网站名称 | '科技公司' |
| `navigation` | NavItem[] | 导航项数组 | 默认导航结构 |
| `config` | NavConfig | 高级配置选项 | 见下方 |
| `className` | string | 自定义类名 | '' |
| `onThemeChange` | function | 主题变更时的回调函数 | undefined |
| `onScroll` | function | 滚动时的回调函数 | undefined |

### NavConfig 配置选项

| 属性名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| `layout` | string | 导航布局类型 | 'horizontal' |
| `fixed` | boolean | 是否固定在顶部 | true |
| `scrollEffects` | boolean | 是否启用滚动效果 | true |
| `showLogo` | boolean | 是否显示 Logo | true |
| `showSiteName` | boolean | 是否显示网站名称 | true |
| `mobileBreakpoint` | number | 移动端菜单断点 | 768 |
| `animationDuration` | number | 动画持续时间(毫秒) | 300 |

## 主题适配机制

ThemeAwareHeader 组件通过以下机制实现主题适配：

1. **动态样式计算**：根据当前主题的颜色特性计算合适的导航栏样式
2. **透明度调整**：根据滚动状态动态调整背景透明度
3. **对比度优化**：确保文本与背景色之间有足够的对比度
4. **主题变化监听**：监听 `themeChanged` 事件以响应主题变更
5. **智能文本效果**：根据主题特性自动选择普通文本或渐变文本效果

## 主题支持

组件完全支持项目中定义的所有主题：

- **新科技未来 (neo-futuristic)**：深色主题，科技感十足
- **企业蓝 (corporate-blue)**：专业的蓝色主题
- **优雅暗色 (elegant-dark)**：高端大气的深色主题
- **翡翠森林 (emerald-forest)**：清新自然的绿色主题
- **皇家琥珀 (royal-amber)**：奢华典雅的琥珀色主题
- **神秘紫 (mystic-purple)**：高贵神秘的紫色主题
- **极简专业 (minimal-pro)**：简约现代的专业主题

## 测试组件

可以使用提供的演示页面和验证脚本来测试组件：

1. 运行演示页面：访问 `/ThemeDemo` 查看组件在不同主题下的表现
2. 运行验证脚本：
   ```bash
   cd frontend
   node verify-theme-header.js
   ```

## 注意事项

1. 确保项目中正确配置了主题系统
2. 在服务器端渲染环境中，组件会自动检测客户端环境并正确初始化
3. 如果导航栏样式在某些主题下仍需调整，可以通过 `className` 属性添加自定义样式
4. 组件默认使用 `settingsApi` 和 `navigationApi` 获取动态数据，请确保这些 API 可用

## 示例

完整的使用示例可在 `/pages/ThemeDemo.tsx` 文件中找到。
