import React, { useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Settings,
  Upload
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { pagesApi } from '@/utils/api'
import toast from 'react-hot-toast'
import type { PageForm } from '@/types'

export default function CreateTraditionalPagePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PageForm>({
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      meta_title: '',
      meta_description: '',
      published: false,
      category: 'general',
      sort_order: 0
    }
  })

  const watchTitle = watch('title')

  // 自动生成slug
  React.useEffect(() => {
    if (watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }, [watchTitle, setValue])

  const onSubmit = async (data: PageForm) => {
    try {
      setIsLoading(true)
      const response = await pagesApi.create(data)
      
      if (response.success) {
        toast.success('页面创建成功')
        router.push('/admin/pages')
      } else {
        toast.error(response.message || '创建失败')
      }
    } catch (error) {
      console.error('创建页面失败:', error)
      toast.error('创建失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = () => {
    const formData = watch()
    if (!formData.slug) {
      toast.error('请先设置页面别名')
      return
    }
    
    // 在新标签页中打开预览
    window.open(`/pages/${formData.slug}?preview=true`, '_blank')
  }

  return (
    <AdminLayout title="创建页面" description="使用传统编辑器创建页面">
      <div className="max-w-5xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/pages')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                创建新页面
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                使用传统编辑器创建页面内容
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>预览</span>
            </button>
            
            <button
              form="page-form"
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-tech-accent text-white rounded-lg hover:bg-tech-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? '保存中...' : '保存页面'}</span>
            </button>
          </div>
        </div>

        <form id="page-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 主要内容区域 */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                {/* 标签页导航 */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { key: 'content', label: '内容', icon: FileText },
                      { key: 'settings', label: '设置', icon: Settings },
                      { key: 'seo', label: 'SEO', icon: Eye }
                    ].map(tab => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveTab(tab.key as any)}
                          className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.key
                              ? 'border-tech-accent text-tech-accent'
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                </div>

                {/* 标签页内容 */}
                <div className="p-6">
                  {/* 内容标签页 */}
                  {activeTab === 'content' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          页面标题 *
                        </label>
                        <input
                          type="text"
                          {...register('title', { required: '请输入页面标题' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent"
                          placeholder="输入页面标题"
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          页面别名 *
                        </label>
                        <input
                          type="text"
                          {...register('slug', { required: '请输入页面别名' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent"
                          placeholder="page-url"
                        />
                        {errors.slug && (
                          <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          页面URL中显示的名称，建议使用英文和连字符
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          页面摘要
                        </label>
                        <textarea
                          {...register('excerpt')}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent resize-none"
                          placeholder="简要描述页面内容，用于搜索结果和列表展示"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          页面内容 *
                        </label>
                        <textarea
                          {...register('content', { required: '请输入页面内容' })}
                          rows={15}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent resize-none font-mono text-sm"
                          placeholder="支持HTML格式，例如：
<h2>标题</h2>
<p>段落内容...</p>
<img src=&quot;/images/example.jpg&quot; alt=&quot;图片描述&quot; />
<a href=&quot;#&quot;>链接</a>"
                        />
                        {errors.content && (
                          <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          支持HTML标签，可以使用丰富的格式和样式
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* 设置标签页 */}
                  {activeTab === 'settings' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          页面分类
                        </label>
                        <select
                          {...register('category')}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent"
                        >
                          <option value="general">一般页面</option>
                          <option value="product">产品服务</option>
                          <option value="about">关于我们</option>
                          <option value="news">新闻动态</option>
                          <option value="help">帮助中心</option>
                          <option value="legal">法律条款</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          排序值
                        </label>
                        <input
                          type="number"
                          {...register('sort_order', { valueAsNumber: true })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent"
                          placeholder="0"
                          min="0"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          数字越小排序越靠前
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          特色图片
                        </label>
                        <input
                          type="text"
                          {...register('featured_image')}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent"
                          placeholder="图片URL或路径"
                        />
                        <div className="mt-2">
                          <button
                            type="button"
                            className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span>上传图片</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('published')}
                          className="w-4 h-4 text-tech-accent border-gray-300 rounded focus:ring-tech-accent"
                        />
                        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          立即发布页面
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {/* SEO标签页 */}
                  {activeTab === 'seo' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          SEO 标题
                        </label>
                        <input
                          type="text"
                          {...register('meta_title')}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent"
                          placeholder="搜索引擎显示的标题（留空则使用页面标题）"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          建议长度在50-60个字符之间
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          SEO 描述
                        </label>
                        <textarea
                          {...register('meta_description')}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tech-accent focus:border-transparent resize-none"
                          placeholder="搜索引擎显示的描述（留空则使用页面摘要）"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          建议长度在150-160个字符之间
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          SEO 优化建议
                        </h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• 使用关键词，但避免过度堆砌</li>
                          <li>• 标题要简洁明了，突出重点</li>
                          <li>• 描述要吸引用户点击，准确反映内容</li>
                          <li>• 保持页面内容与SEO信息一致</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* 页面状态 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    页面状态
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">发布状态</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {watch('published') ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">页面分类</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(() => {
                          const categoryMap: Record<string, string> = {
                            general: '一般页面',
                            product: '产品服务',
                            about: '关于我们',
                            news: '新闻动态',
                            help: '帮助中心',
                            legal: '法律条款'
                          }
                          return categoryMap[watch('category') || 'general']
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 快速提示 */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                    💡 编辑提示
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• 先填写页面标题，系统会自动生成别名</li>
                    <li>• 使用HTML标签可以创建丰富的内容</li>
                    <li>• 设置好的摘要有助于SEO优化</li>
                    <li>• 可以随时预览页面效果</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}