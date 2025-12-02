import { escapeHtml, renderHeading, renderParagraph, wrapSection } from '../utils'

export const renderHero = (component: any): string => {
  const { props = {} } = component
  const { title, subtitle, backgroundImage, buttonText, buttonLink } = props
  const button = buttonText
    ? `<a class="hero-button" href="${escapeHtml(buttonLink || '#')}">${escapeHtml(buttonText)}</a>`
    : ''
  const bg = backgroundImage ? ` style="background-image:url('${escapeHtml(backgroundImage)}')"` : ''
  return wrapSection(
    'hero-section',
    `<div class="hero-content"${bg}>
      ${renderHeading('h1', title)}
      ${renderParagraph(subtitle)}
      ${button}
    </div>`
  )
}

export const renderTextBlock = (component: any): string => {
  const { props = {} } = component
  const { title, content } = props
  return wrapSection(
    'text-block',
    `${renderHeading('h2', title)}${content ? `<div class="text-body">${content}</div>` : ''}`
  )
}

export const renderImageBlock = (component: any): string => {
  const { props = {} } = component
  const { src, alt, caption, linkUrl, linkTarget } = props
  const image = src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt || '')}" />` : ''
  const linkedImage =
    image && linkUrl
      ? `<a href="${escapeHtml(linkUrl)}"${linkTarget === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : ''}>${image}</a>`
      : image
  return wrapSection(
    'image-block',
    `<figure>
      ${linkedImage}
      ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}
    </figure>`
  )
}

export const renderImageText = (component: any): string => {
  const { props = {} } = component
  const { title, content, image, imageAlt, align } = props
  const imagePart = image
    ? `<div class="image-text__image"><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt || '')}" /></div>`
    : ''
  return wrapSection(
    `image-text ${align === 'right' ? 'image-right' : 'image-left'}`,
    `${renderHeading('h2', title)}${renderParagraph(content)}${imagePart}`
  )
}

export const renderImageTextHorizontal = (component: any): string => {
  const { props = {} } = component
  const { title, content, image, imageAlt } = props
  return wrapSection(
    'image-text-horizontal',
    `<div class="image-text-horizontal__media">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt || '')}" />` : ''}
    </div>
    <div class="image-text-horizontal__content">
      ${renderHeading('h2', title)}
      ${renderParagraph(content)}
    </div>`
  )
}

export const renderContentSection = (component: any): string => {
  const { props = {} } = component
  const { title, subtitle, content } = props
  return wrapSection(
    'content-section',
    `${renderHeading('h2', title)}${renderParagraph(subtitle)}${content ? `<div class="content-body">${content}</div>` : ''}`
  )
}

export const renderBannerCarousel = (component: any): string => {
  const { props = {} } = component
  const { banners = [], slides = [] } = props
  const list = Array.isArray(banners) && banners.length > 0 ? banners : slides
  const output = (list || []).map((banner: any) => {
    const image = banner.image || banner.src || ''
    return `<div class="banner-slide">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(banner.alt || '')}" />` : ''}
      ${banner.title ? `<h3>${escapeHtml(banner.title)}</h3>` : ''}
      ${banner.description ? `<p>${escapeHtml(banner.description)}</p>` : ''}
    </div>`
  }).join('')
  return wrapSection('banner-carousel', output || '<div class="banner-slide empty"></div>')
}
