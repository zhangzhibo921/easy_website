import React, { useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  FileText,
  Layout,
  FileImage,
  Sparkles
} from 'lucide-react'
import VisualPageEditor from '@/components/PageBuilder/VisualPageEditor'
import { pagesApi } from '@/utils/api'
import toast from 'react-hot-toast'

export default function CreatePageVisualPage() {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)
  const [editorMode, setEditorMode] = useState<'visual' | 'traditional'>('visual')

  const handleSaveVisual = async (pageData: any) => {
    try {
      // 将组件数据保存到 template_data 字段
      const formData = {
        ...pageData,
        template_data: JSON.stringify({
          components: pageData.components,
          template_id: pageData.template_id || null,
          theme_id: pageData.theme_id || 'tech-blue'
        })
      }
      
      delete formData.components // 移除临时字段
      delete formData.theme_id // 移除临时字段，已保存在template_data中

      const response = await pagesApi.create(formData)
      
      if (response.success) {
        toast.success('页面创建成功')
        router.push('/admin/pages')
      } else {
        toast.error(response.message || '创建失败')
      }
    } catch (error) {
      console.error('创建页面失败:', error)
      toast.error('创建失败，请稍后重试')
    }
  }

  const handleCancel = () => {
    if (showEditor) {
      setShowEditor(false)
    } else {
      router.push('/admin/pages')
    }
  }

  if (showEditor) {
    return (
      <VisualPageEditor
        editMode="create" // 设置为创建模式
        initialData={{ 
          title: '',
          slug: '',
          content: '',
          published: false,
          category: 'general',
          components: [],
          theme_id: 'tech-blue',
          template_id: null
        }}
        onSave={handleSaveVisual}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <AdminLayout title="创建页面" description="选择页面创建方式">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-6 py-12">
          {/* 返回按钮 */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/admin/pages')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回页面管理</span>
            </button>
          </div>

          {/* 页面标题 */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-2xl px-6 py-3 shadow-lg mb-6"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-tech-accent to-tech-secondary rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  创建新页面
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  选择最适合的方式开始创建
                </p>
              </div>
            </motion.div>
          </div>

          {/* 创建方式选择 */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 可视化编辑器 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="group"
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-tech-accent"
                     onClick={() => router.push('/admin/pages/create-visual')}>
                  {/* 推荐标签 */}
                  <div className="absolute -top-3 left-6">
                    <span className="bg-gradient-to-r from-tech-accent to-tech-secondary text-white px-4 py-1 rounded-full text-sm font-medium">
                      推荐
                    </span>
                  </div>
                  
                  <div className="text-center">
                    {/* 图标 */}
                    <div className="w-20 h-20 bg-gradient-to-r from-tech-accent to-tech-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <FileImage className="w-10 h-10 text-white" />
                    </div>
                    
                    {/* 标题和描述 */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      可视化编辑器
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      使用直观的拖拽界面创建页面，支持预设模板、实时预览和组件化编辑，让页面创建变得简单有趣。
                    </p>
                    
                    {/* 特性列表 */}
                    <div className="space-y-2 text-left mb-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-tech-accent rounded-full"></div>
                        <span>拖拽式编辑，所见即所得</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-tech-accent rounded-full"></div>
                        <span>丰富的预设模板和组件</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-tech-accent rounded-full"></div>
                        <span>实时预览和响应式设计</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-tech-accent rounded-full"></div>
                        <span>适合新手和快速创建</span>
                      </div>
                    </div>
                    
                    {/* 按钮 */}
                    <button className="w-full bg-gradient-to-r from-tech-accent to-tech-secondary text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                      开始创建
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* 传统编辑器 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group"
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                     onClick={() => router.push('/admin/pages/create-traditional')}>
                  
                  <div className="text-center">
                    {/* 图标 */}
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-10 h-10 text-white" />
                    </div>
                    
                    {/* 标题和描述 */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      传统编辑器
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      使用经典的表单编辑器创建页面，支持富文本编辑和HTML代码编写，适合有经验的用户。
                    </p>
                    
                    {/* 特性列表 */}
                    <div className="space-y-2 text-left mb-6">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                        <span>富文本编辑器和HTML支持</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                        <span>完整的页面设置选项</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                        <span>SEO和元数据配置</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                        <span>适合高级用户和自定义</span>
                      </div>
                    </div>
                    
                    {/* 按钮 */}
                    <button className="w-full bg-gray-600 text-white font-medium py-3 px-6 rounded-xl hover:bg-gray-700 hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                      传统方式创建
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 帮助提示 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-12"
            >
              <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg">
                <Layout className="w-4 h-4" />
                <span className="text-sm">
                  💡 新手建议使用可视化编辑器，体验更佳且功能强大
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
