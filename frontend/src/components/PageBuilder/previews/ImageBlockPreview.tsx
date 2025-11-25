import React, { useEffect, useState } from "react"
import { TemplateComponent } from "@/types/templates"

export const ImageBlockPreview: React.FC<{ component: TemplateComponent }> = ({ component }) => {
  const { src, alt, caption, widthOption = 'full', backgroundColorOption = 'default' } = component.props

  const containerClass = widthOption === 'standard' ? 'max-w-screen-2xl mx-auto' : 'w-full'
  const componentClass =
    backgroundColorOption === 'transparent'
      ? 'image-block-preview w-full h-full'
      : 'image-block-preview bg-color-surface w-full h-full'

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // 重置加载状态当 src 变化时
  useEffect(() => {
    if (src) {
      setImageLoaded(false)
      setImageError(false)
    }
  }, [src])

  // 预加载并处理缓存场景，避免重新打开编辑器时一直显示“加载中”
  useEffect(() => {
    if (!src) return
    const testImg = new Image()
    testImg.src = src
    if (testImg.complete) {
      setImageLoaded(true)
      setImageError(false)
      return
    }
    testImg.onload = () => {
      setImageLoaded(true)
      setImageError(false)
    }
    testImg.onerror = () => {
      setImageError(true)
      setImageLoaded(false)
    }
  }, [src])

  return (
    <div className={containerClass}>
      <div className={componentClass}>
        <div className="relative w-full h-full">
          {src ? (
            <div className="relative w-full h-full">
              {!imageLoaded && !imageError && (
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                  <div className="text-center">
                    <div className="text-4xl mb-2 opacity-40">🖼️</div>
                    <p className="text-text-tertiary">加载中...</p>
                  </div>
                </div>
              )}
              <img
                src={src}
                alt={alt || '图片'}
                className={`image-block-image w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
                onLoad={() => {
                  setImageLoaded(true)
                  setImageError(false)
                }}
                onError={() => {
                  console.error('Image block failed to load:', src)
                  setImageError(true)
                  setImageLoaded(false)
                }}
              />
              {imageError && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2 opacity-40">⚠️</div>
                    <p className="text-text-primary">图片加载失败</p>
                    <p className="text-sm text-text-secondary mt-1">请检查图片地址</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-40">🖼️</div>
                <p className="text-text-tertiary font-medium">点击添加图片</p>
                <p className="text-sm text-text-tertiary mt-2">支持 JPG, PNG, GIF 格式</p>
              </div>
            </div>
          )}
          {caption && imageLoaded && (
            <div className="mt-4 text-center">
              <p className="text-text-tertiary italic">{caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
