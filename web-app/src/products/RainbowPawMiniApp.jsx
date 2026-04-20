import React, { useEffect, useRef, useState } from 'react'
import {
  Home,
  ShoppingBag,
  Heart,
  User,
  Search,
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  Star,
  Camera,
  Clock,
  Store,
  BarChart3,
  CheckCircle2,
  Package,
  Plus,
  Settings,
  FlameKindling,
  CreditCard,
  MessageSquare,
  Filter,
  MapPin,
  Share2,
  Pencil,
  Trash2,
  PawPrint,
} from 'lucide-react'
import {
  RP_MINIAPP_LANGS,
  rpMiniAppGetLangLabel,
  rpMiniAppLangToLocale,
  rpMiniAppLocaleToLang,
  rpMiniAppT,
} from '../i18n/rpMiniApp.js'
import { apiFetch } from '../api/client.js'
import SafeImage from '../components/SafeImage.jsx'

const CATEGORIES = [
  { id: 'services', nameKey: 'cat.services', icon: '🕯️', subKeys: ['catSub.services.0', 'catSub.services.1', 'catSub.services.2'] },
  { id: 'urns', nameKey: 'cat.urns', icon: '⚱️', subKeys: ['catSub.urns.0', 'catSub.urns.1', 'catSub.urns.2', 'catSub.urns.3'] },
  { id: 'jewelry', nameKey: 'cat.jewelry', icon: '💍', subKeys: ['catSub.jewelry.0', 'catSub.jewelry.1', 'catSub.jewelry.2', 'catSub.jewelry.3'] },
  { id: 'art', nameKey: 'cat.art', icon: '🎨', subKeys: ['catSub.art.0', 'catSub.art.1', 'catSub.art.2', 'catSub.art.3'] },
  { id: 'keepsakes', nameKey: 'cat.keepsakes', icon: '🐾', subKeys: ['catSub.keepsakes.0', 'catSub.keepsakes.1', 'catSub.keepsakes.2'] },
]

const MERCHANTS_RAW = [
  {
    id: 'm1',
    name_i18n: { ZH: '天国工坊', EN: 'Heaven Atelier', KM: 'Heaven Atelier' },
    logo: 'https://images.unsplash.com/photo-1541888941255-2200007635a1?q=80&w=100',
    cover: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600',
    rating: 4.9,
    location_i18n: { ZH: '上海·静安', EN: "Shanghai · Jing'an", KM: "Shanghai · Jing'an" },
    desc_i18n: {
      ZH: '专注宠物善终工艺15年，用艺术留住温度。',
      EN: '15 years of pet aftercare craftsmanship — preserving warmth through art.',
      KM: '15 years of pet aftercare craftsmanship — preserving warmth through art.',
    },
  },
  {
    id: 'm2',
    name_i18n: { ZH: '拾光首饰定制', EN: 'Shiguang Jewelry Studio', KM: 'Shiguang Jewelry Studio' },
    logo: 'https://images.unsplash.com/photo-1573462937748-25920b399120?q=80&w=100',
    cover: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?q=80&w=600',
    rating: 5.0,
    location_i18n: { ZH: '杭州·西湖', EN: 'Hangzhou · West Lake', KM: 'Hangzhou · West Lake' },
    desc_i18n: {
      ZH: '每一件首饰都是一段独一无二的故事。',
      EN: 'Every piece is a one-of-a-kind story.',
      KM: 'Every piece is a one-of-a-kind story.',
    },
  },
]

const PRODUCTS_RAW = [
  {
    id: 1,
    category: 'urns',
    subCategory_i18n: { ZH: '陶瓷款', EN: 'Ceramic', KM: 'Ceramic' },
    name_i18n: { ZH: '永恒星辰 - 陶瓷骨灰瓮', EN: 'Eternal Stardust — Ceramic Urn', KM: 'Eternal Stardust — Ceramic Urn' },
    price: 89.0,
    rating: 4.9,
    sales: 128,
    image: 'https://images.unsplash.com/photo-1579450841234-49351e3a312b?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    time_i18n: { ZH: '3-5天制作', EN: 'Made in 3–5 days', KM: 'Made in 3–5 days' },
    description_i18n: {
      ZH: '采用景德镇手工陶瓷，哑光质感，寓意宠物化作星辰守护。',
      EN: 'Handcrafted ceramic with a matte finish — a symbol of your pet becoming stardust that guards you.',
      KM: 'Handcrafted ceramic with a matte finish — a symbol of your pet becoming stardust that guards you.',
    },
  },
  {
    id: 2,
    category: 'jewelry',
    subCategory_i18n: { ZH: '吊坠', EN: 'Pendant', KM: 'Pendant' },
    name_i18n: { ZH: '足迹纯银吊坠 (可定制刻字)', EN: 'Pawprint Sterling Silver Pendant (Engraving Available)', KM: 'Pawprint Sterling Silver Pendant (Engraving Available)' },
    price: 45.0,
    rating: 5.0,
    sales: 342,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm2',
    time_i18n: { ZH: '1-2天制作', EN: 'Made in 1–2 days', KM: 'Made in 1–2 days' },
    description_i18n: {
      ZH: '925纯银打造，可刻下宠物名字与日期，贴心陪伴。',
      EN: 'Crafted in 925 sterling silver. Engrave your pet’s name and date — a gentle companion.',
      KM: 'Crafted in 925 sterling silver. Engrave your pet’s name and date — a gentle companion.',
    },
  },
  {
    id: 3,
    category: 'art',
    subCategory_i18n: { ZH: '油画', EN: 'Oil painting', KM: 'Oil painting' },
    name_i18n: { ZH: '治愈系手绘油画肖像', EN: 'Healing Hand-Painted Oil Portrait', KM: 'Healing Hand-Painted Oil Portrait' },
    price: 120.0,
    rating: 4.8,
    sales: 56,
    image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    time_i18n: { ZH: '7-10天制作', EN: 'Made in 7–10 days', KM: 'Made in 7–10 days' },
    description_i18n: {
      ZH: '专业画师根据照片进行艺术化处理，永久保存那份美好。',
      EN: 'Painted by professional artists based on your photos — preserving the beauty forever.',
      KM: 'Painted by professional artists based on your photos — preserving the beauty forever.',
    },
  },
  {
    id: 4,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '善终纪念仪式服务',
    name_i18n: { ZH: '善终纪念仪式服务', EN: 'Aftercare Memorial Ceremony Service', KM: 'Aftercare Memorial Ceremony Service' },
    price: 260.0,
    rating: 4.9,
    sales: 89,
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm2',
    merchant: '拾光首饰定制',
    time: '预约制',
    time_i18n: { ZH: '预约制', EN: 'By appointment', KM: 'By appointment' },
    description: '提供专业的告别仪式布置，含鲜花、纪念册及全程影像记录。',
    description_i18n: {
      ZH: '提供专业的告别仪式布置，含鲜花、纪念册及全程影像记录。',
      EN: 'Professional farewell ceremony setup including flowers, memorial booklet, and full photo/video coverage.',
      KM: 'Professional farewell ceremony setup including flowers, memorial booklet, and full photo/video coverage.',
    },
  },
  {
    id: 401,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '告别仪式策划·基础版',
    name_i18n: { ZH: '告别仪式策划·基础版', EN: 'Farewell Ceremony — Basic', KM: 'Farewell Ceremony — Basic' },
    price: 149.0,
    rating: 4.8,
    sales: 214,
    image: 'https://images.unsplash.com/photo-1515165562835-c3b8b5e2a8b8?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm2',
    merchant: '拾光首饰定制',
    time: '预约制',
    time_i18n: { ZH: '预约制', EN: 'By appointment', KM: 'By appointment' },
    description: '基础仪式布置与流程建议，适合温柔而克制的告别。',
    description_i18n: {
      ZH: '基础仪式布置与流程建议，适合温柔而克制的告别。',
      EN: 'Basic setup and process guidance — a gentle, simple goodbye.',
      KM: 'Basic setup and process guidance — a gentle, simple goodbye.',
    },
  },
  {
    id: 402,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '告别仪式策划·尊享版',
    name_i18n: { ZH: '告别仪式策划·尊享版', EN: 'Farewell Ceremony — Premium', KM: 'Farewell Ceremony — Premium' },
    price: 399.0,
    rating: 4.9,
    sales: 96,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: '天国工坊',
    time: '预约制',
    time_i18n: { ZH: '预约制', EN: 'By appointment', KM: 'By appointment' },
    description: '含专属主题布置、纪念相册与全程影像记录，让告别更体面。',
    description_i18n: {
      ZH: '含专属主题布置、纪念相册与全程影像记录，让告别更体面。',
      EN: 'Includes themed setup, memorial album, and full coverage — a more dignified farewell.',
      KM: 'Includes themed setup, memorial album, and full coverage — a more dignified farewell.',
    },
  },
  {
    id: 451,
    category: 'services',
    subCategory: '心理疏导',
    subCategory_i18n: { ZH: '心理疏导', EN: 'Grief support', KM: 'Grief support' },
    serviceSubId: 'grief',
    name: '心理疏导·单次倾听',
    name_i18n: { ZH: '心理疏导·单次倾听', EN: 'Grief Support — One Session', KM: 'Grief Support — One Session' },
    price: 39.0,
    rating: 4.8,
    sales: 310,
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm2',
    merchant: '拾光首饰定制',
    time: '45分钟',
    time_i18n: { ZH: '45分钟', EN: '45 minutes', KM: '45 minutes' },
    description: '由咨询师提供一次倾听与陪伴，帮助你度过最难的时刻。',
    description_i18n: {
      ZH: '由咨询师提供一次倾听与陪伴，帮助你度过最难的时刻。',
      EN: 'One session of listening and companionship with a counselor to help through the hardest moments.',
      KM: 'One session of listening and companionship with a counselor to help through the hardest moments.',
    },
  },
  {
    id: 452,
    category: 'services',
    subCategory: '心理疏导',
    subCategory_i18n: { ZH: '心理疏导', EN: 'Grief support', KM: 'Grief support' },
    serviceSubId: 'grief',
    name: '心理疏导·3次支持',
    name_i18n: { ZH: '心理疏导·3次支持', EN: 'Grief Support — 3 Sessions', KM: 'Grief Support — 3 Sessions' },
    price: 99.0,
    rating: 4.9,
    sales: 142,
    image: 'https://images.unsplash.com/photo-1520975871151-246b37c6c45a?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: '天国工坊',
    time: '3x 45分钟',
    time_i18n: { ZH: '3x 45分钟', EN: '3 × 45 minutes', KM: '3 × 45 minutes' },
    description: '围绕失落、愧疚与适应期的持续支持，帮助情绪逐步稳定。',
    description_i18n: {
      ZH: '围绕失落、愧疚与适应期的持续支持，帮助情绪逐步稳定。',
      EN: 'Ongoing support through loss, guilt, and adjustment — helping emotions stabilize over time.',
      KM: 'Ongoing support through loss, guilt, and adjustment — helping emotions stabilize over time.',
    },
  },
  {
    id: 481,
    category: 'services',
    subCategory: '墓园选址',
    subCategory_i18n: { ZH: '墓园选址', EN: 'Cemetery selection', KM: 'Cemetery selection' },
    serviceSubId: 'cemetery',
    seatZone: 'basic',
    name: '墓位购买·普通区（Basic Zone）',
    name_i18n: { ZH: '墓位购买·普通区（Basic Zone）', EN: 'Cemetery Plot Purchase · Basic Zone', KM: 'Cemetery Plot Purchase · Basic Zone' },
    price: 80.0,
    rating: 4.9,
    sales: 67,
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: '天国工坊',
    time: '含一次实地陪同',
    time_i18n: { ZH: '含一次实地陪同', EN: 'Includes one on-site visit', KM: 'Includes one on-site visit' },
    description: '室内普通墙面，密集排布，价格友好。',
    description_i18n: {
      ZH: '室内普通墙面，密集排布，价格友好。',
      EN: 'Indoor basic wall placement, denser layout, budget-friendly.',
      KM: 'Indoor basic wall placement, denser layout, budget-friendly.',
    },
  },
  {
    id: 482,
    category: 'services',
    subCategory: '墓园选址',
    subCategory_i18n: { ZH: '墓园选址', EN: 'Cemetery selection', KM: 'Cemetery selection' },
    serviceSubId: 'cemetery',
    seatZone: 'garden',
    name: '墓位购买·景观区（Garden Zone）',
    name_i18n: { ZH: '墓位购买·景观区（Garden Zone）', EN: 'Cemetery Plot Purchase · Garden Zone', KM: 'Cemetery Plot Purchase · Garden Zone' },
    price: 220.0,
    rating: 4.8,
    sales: 98,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm2',
    merchant: '拾光首饰定制',
    time: '含一次实地陪同',
    time_i18n: { ZH: '含一次实地陪同', EN: 'Includes one on-site visit', KM: 'Includes one on-site visit' },
    description: '花园/绿植区域，环境更好，价格适中。',
    description_i18n: {
      ZH: '花园/绿植区域，环境更好，价格适中。',
      EN: 'Garden/greenery area with a better environment and moderate pricing.',
      KM: 'Garden/greenery area with a better environment and moderate pricing.',
    },
  },
  {
    id: 483,
    category: 'services',
    subCategory: '墓园选址',
    subCategory_i18n: { ZH: '墓园选址', EN: 'Cemetery selection', KM: 'Cemetery selection' },
    serviceSubId: 'cemetery',
    seatZone: 'vip',
    name: '墓位购买·VIP区（Premium Zone）',
    name_i18n: { ZH: '墓位购买·VIP区（Premium Zone）', EN: 'Cemetery Plot Purchase · Premium Zone', KM: 'Cemetery Plot Purchase · Premium Zone' },
    price: 800.0,
    rating: 4.7,
    sales: 154,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm2',
    merchant: '拾光首饰定制',
    time: '含一次实地陪同',
    time_i18n: { ZH: '含一次实地陪同', EN: 'Includes one on-site visit', KM: 'Includes one on-site visit' },
    description: '独立纪念空间，私密高端，高溢价。',
    description_i18n: {
      ZH: '独立纪念空间，私密高端，高溢价。',
      EN: 'Private memorial space with premium privacy and higher value.',
      KM: 'Private memorial space with premium privacy and higher value.',
    },
  },
  {
    id: 9201,
    category: 'cemetery_annual',
    name: '墓位年费·普通区（$10/年）',
    name_i18n: { ZH: '墓位年费·普通区（$10/年）', EN: 'Cemetery Annual Fee · Basic Zone ($10/year)', KM: 'Cemetery Annual Fee · Basic Zone ($10/year)' },
    price: 10.0,
    rating: 4.9,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '年费订阅',
    time_i18n: { ZH: '年费订阅', EN: 'Annual subscription', KM: 'Annual subscription' },
    description: '包含墓位维护、线上纪念页与到期提醒等服务。',
    description_i18n: {
      ZH: '包含墓位维护、线上纪念页与到期提醒等服务。',
      EN: 'Includes plot maintenance, online memorial page, and renewal reminders.',
      KM: 'Includes plot maintenance, online memorial page, and renewal reminders.',
    },
  },
  {
    id: 9202,
    category: 'cemetery_annual',
    name: '墓位年费·景观区（$30/年）',
    name_i18n: { ZH: '墓位年费·景观区（$30/年）', EN: 'Cemetery Annual Fee · Garden Zone ($30/year)', KM: 'Cemetery Annual Fee · Garden Zone ($30/year)' },
    price: 30.0,
    rating: 4.9,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '年费订阅',
    time_i18n: { ZH: '年费订阅', EN: 'Annual subscription', KM: 'Annual subscription' },
    description: '包含墓位维护、线上纪念页与到期提醒等服务。',
    description_i18n: {
      ZH: '包含墓位维护、线上纪念页与到期提醒等服务。',
      EN: 'Includes plot maintenance, online memorial page, and renewal reminders.',
      KM: 'Includes plot maintenance, online memorial page, and renewal reminders.',
    },
  },
  {
    id: 9203,
    category: 'cemetery_annual',
    name: '墓位年费·VIP区（$120/年）',
    name_i18n: { ZH: '墓位年费·VIP区（$120/年）', EN: 'Cemetery Annual Fee · Premium Zone ($120/year)', KM: 'Cemetery Annual Fee · Premium Zone ($120/year)' },
    price: 120.0,
    rating: 4.9,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '年费订阅',
    time_i18n: { ZH: '年费订阅', EN: 'Annual subscription', KM: 'Annual subscription' },
    description: '包含墓位维护、线上纪念页与到期提醒等服务。',
    description_i18n: {
      ZH: '包含墓位维护、线上纪念页与到期提醒等服务。',
      EN: 'Includes plot maintenance, online memorial page, and renewal reminders.',
      KM: 'Includes plot maintenance, online memorial page, and renewal reminders.',
    },
  },
  {
    id: 9001,
    category: 'memorial',
    name: '云纪念·点亮祈福（1盏灯）',
    name_i18n: { ZH: '云纪念·点亮祈福（1盏灯）', EN: 'Cloud Memorial · Prayer Light (1 lamp)', KM: 'Cloud Memorial · Prayer Light (1 lamp)' },
    price: 1.99,
    rating: 4.9,
    sales: 1200,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '即时生效',
    time_i18n: { ZH: '即时生效', EN: 'Instant', KM: 'Instant' },
    description: '点亮一盏灯，愿思念温柔可见。',
    description_i18n: {
      ZH: '点亮一盏灯，愿思念温柔可见。',
      EN: 'Light a lamp — let your gentle longing be seen.',
      KM: 'Light a lamp — let your gentle longing be seen.',
    },
  },
  {
    id: 9002,
    category: 'memorial',
    name: '云纪念·献花（1束）',
    name_i18n: { ZH: '云纪念·献花（1束）', EN: 'Cloud Memorial · Flowers (1 bouquet)', KM: 'Cloud Memorial · Flowers (1 bouquet)' },
    price: 2.99,
    rating: 4.8,
    sales: 860,
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '即时生效',
    time_i18n: { ZH: '即时生效', EN: 'Instant', KM: 'Instant' },
    description: '一束花，一句想说的话。',
    description_i18n: {
      ZH: '一束花，一句想说的话。',
      EN: 'A bouquet, and the words you want to say.',
      KM: 'A bouquet, and the words you want to say.',
    },
  },
  {
    id: 9003,
    category: 'memorial',
    name: '云纪念·永久守护升级',
    name_i18n: { ZH: '云纪念·永久守护升级', EN: 'Cloud Memorial · Eternal Guardian Upgrade', KM: 'Cloud Memorial · Eternal Guardian Upgrade' },
    price: 29.9,
    rating: 4.9,
    sales: 210,
    image: 'https://images.unsplash.com/photo-1520975958225-45a42b0b63b4?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '即时生效',
    time_i18n: { ZH: '即时生效', EN: 'Instant', KM: 'Instant' },
    description: '解锁专属相册与永久守护标识，让纪念更完整。',
    description_i18n: {
      ZH: '解锁专属相册与永久守护标识，让纪念更完整。',
      EN: 'Unlock a dedicated album and an eternal guardian badge for a more complete memorial.',
      KM: 'Unlock a dedicated album and an eternal guardian badge for a more complete memorial.',
    },
  },
  {
    id: 9101,
    category: 'funeral_bundle',
    name: '善终拼单·接送费（0–5km）',
    name_i18n: { ZH: '善终拼单·接送费（0–5km）', EN: 'Aftercare Group Deal · Pickup Fee (0–5km)', KM: 'Aftercare Group Deal · Pickup Fee (0–5km)' },
    price: 10.0,
    rating: 4.8,
    sales: 320,
    image: 'https://images.unsplash.com/photo-1520012218364-4f5c2046a4a3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '同城 2 小时内',
    time_i18n: { ZH: '同城 2 小时内', EN: 'Within 2 hours (in-city)', KM: 'Within 2 hours (in-city)' },
    description: '按距离计费：0–5km $10 / 5–10km $20 / 10km+ $30。',
    description_i18n: {
      ZH: '按距离计费：0–5km $10 / 5–10km $20 / 10km+ $30。',
      EN: 'Distance-based: 0–5km $10 / 5–10km $20 / 10km+ $30.',
      KM: 'Distance-based: 0–5km $10 / 5–10km $20 / 10km+ $30.',
    },
  },
  {
    id: 9102,
    category: 'funeral_bundle',
    name: '善终拼单·告别仪式（轻量）',
    name_i18n: { ZH: '善终拼单·告别仪式（轻量）', EN: 'Aftercare Group Deal · Farewell Ceremony (Lite)', KM: 'Aftercare Group Deal · Farewell Ceremony (Lite)' },
    price: 49.0,
    rating: 4.9,
    sales: 210,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '现场布置',
    time_i18n: { ZH: '现场布置', EN: 'On-site setup', KM: 'On-site setup' },
    description: '基础布置 + 流程引导，可升级更完整的仪式套餐。',
    description_i18n: {
      ZH: '基础布置 + 流程引导，可升级更完整的仪式套餐。',
      EN: 'Basic setup + guided flow. Upgrade available for a fuller ceremony package.',
      KM: 'Basic setup + guided flow. Upgrade available for a fuller ceremony package.',
    },
  },
  {
    id: 9103,
    category: 'funeral_bundle',
    name: '善终拼单·火化安排（集体）',
    name_i18n: { ZH: '善终拼单·火化安排（集体）', EN: 'Aftercare Group Deal · Cremation Arrangement (Group)', KM: 'Aftercare Group Deal · Cremation Arrangement (Group)' },
    price: 10.0,
    rating: 4.7,
    sales: 180,
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '24 小时内',
    time_i18n: { ZH: '24 小时内', EN: 'Within 24 hours', KM: 'Within 24 hours' },
    description: '集体火化（更低价）；可选升级单独火化。',
    description_i18n: {
      ZH: '集体火化（更低价）；可选升级单独火化。',
      EN: 'Group cremation (lower price). Optional upgrade to private cremation.',
      KM: 'Group cremation (lower price). Optional upgrade to private cremation.',
    },
  },
  {
    id: 9104,
    category: 'funeral_bundle',
    name: '善终拼单·纪念火花（视频/图文）',
    name_i18n: { ZH: '善终拼单·纪念火花（视频/图文）', EN: 'Aftercare Group Deal · Memorial Moments (Video/Text)', KM: 'Aftercare Group Deal · Memorial Moments (Video/Text)' },
    price: 60.0,
    rating: 4.8,
    sales: 260,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '即时生成',
    time_i18n: { ZH: '即时生成', EN: 'Instant', KM: 'Instant' },
    description: '生成纪念视频/图文内容，便于分享与留存。',
    description_i18n: {
      ZH: '生成纪念视频/图文内容，便于分享与留存。',
      EN: 'Generate memorial video/text content for sharing and keeping.',
      KM: 'Generate memorial video/text content for sharing and keeping.',
    },
  },
  {
    id: 9711,
    category: 'aftercare_packages_v2',
    name: '基础告别套餐',
    name_i18n: { ZH: '基础告别套餐', EN: 'Basic Farewell Package', KM: 'Basic Farewell Package' },
    price: 399.0,
    rating: 4.9,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '标准服务流程',
    time_i18n: { ZH: '标准服务流程', EN: 'Standard service process', KM: 'Standard service process' },
    description: '适合小型宠物，集体羽化，环保不留灰。',
    description_i18n: {
      ZH: '适合小型宠物，集体羽化，环保不留灰。',
      EN: 'For small pets. Group cremation with an eco-friendly process (no ashes kept).',
      KM: 'For small pets. Group cremation with an eco-friendly process (no ashes kept).',
    },
  },
  {
    id: 9712,
    category: 'aftercare_packages_v2',
    name: '标准纪念套餐',
    name_i18n: { ZH: '标准纪念套餐', EN: 'Standard Memorial Package', KM: 'Standard Memorial Package' },
    price: 899.0,
    rating: 4.9,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520012218364-4f5c2046a4a3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '标准服务流程',
    time_i18n: { ZH: '标准服务流程', EN: 'Standard service process', KM: 'Standard service process' },
    description: '独立羽化，可留存骨灰，包含精美环保骨灰盒。',
    description_i18n: {
      ZH: '独立羽化，可留存骨灰，包含精美环保骨灰盒。',
      EN: 'Private cremation with ashes kept. Includes a premium eco-friendly urn box.',
      KM: 'Private cremation with ashes kept. Includes a premium eco-friendly urn box.',
    },
  },
  {
    id: 9713,
    category: 'aftercare_packages_v2',
    name: '尊享送别套餐',
    name_i18n: { ZH: '尊享送别套餐', EN: 'Premium Farewell Package', KM: 'Premium Farewell Package' },
    price: 1599.0,
    rating: 4.9,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975958225-45a42b0b63b4?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '标准服务流程',
    time_i18n: { ZH: '标准服务流程', EN: 'Standard service process', KM: 'Standard service process' },
    description: '沉浸式告别仪式，高端定制纪念品，全程专属客服。',
    description_i18n: {
      ZH: '沉浸式告别仪式，高端定制纪念品，全程专属客服。',
      EN: 'Immersive farewell ceremony, high-end custom keepsakes, and dedicated support end-to-end.',
      KM: 'Immersive farewell ceremony, high-end custom keepsakes, and dedicated support end-to-end.',
    },
  },
  {
    id: 9301,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '善终套餐·Basic（From $49）',
    name_i18n: { ZH: '善终套餐·Basic（From $49）', EN: 'Aftercare Package · Basic (From $49)', KM: 'Aftercare Package · Basic (From $49)' },
    price: 49.0,
    rating: 4.8,
    sales: 560,
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '24–48 小时交付',
    time_i18n: { ZH: '24–48 小时交付', EN: 'Delivered in 24–48 hours', KM: 'Delivered in 24–48 hours' },
    description: '用户送到服务点 + 集体火化 + 电子纪念。',
    description_i18n: {
      ZH: '用户送到服务点 + 集体火化 + 电子纪念。',
      EN: 'Drop-off at service point + group cremation + digital memorial.',
      KM: 'Drop-off at service point + group cremation + digital memorial.',
    },
  },
  {
    id: 9302,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '善终套餐·Standard（From $129）',
    name_i18n: { ZH: '善终套餐·Standard（From $129）', EN: 'Aftercare Package · Standard (From $129)', KM: 'Aftercare Package · Standard (From $129)' },
    price: 129.0,
    rating: 4.9,
    sales: 820,
    image: 'https://images.unsplash.com/photo-1520012218364-4f5c2046a4a3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '24–48 小时交付',
    time_i18n: { ZH: '24–48 小时交付', EN: 'Delivered in 24–48 hours', KM: 'Delivered in 24–48 hours' },
    description: '上门接宠 + 单独火化 + 基础骨灰盒 + 爪印纪念。',
    description_i18n: {
      ZH: '上门接宠 + 单独火化 + 基础骨灰盒 + 爪印纪念。',
      EN: 'Pickup service + private cremation + basic urn box + pawprint keepsake.',
      KM: 'Pickup service + private cremation + basic urn box + pawprint keepsake.',
    },
  },
  {
    id: 9303,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '善终套餐·Premium（From $249）',
    name_i18n: { ZH: '善终套餐·Premium（From $249）', EN: 'Aftercare Package · Premium (From $249)', KM: 'Aftercare Package · Premium (From $249)' },
    price: 249.0,
    rating: 4.9,
    sales: 260,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '24–48 小时交付',
    time_i18n: { ZH: '24–48 小时交付', EN: 'Delivered in 24–48 hours', KM: 'Delivered in 24–48 hours' },
    description: '上门接宠 + 单独火化 + 告别仪式 + 高端骨灰盒 + 爪印纪念 + 纪念相框/相片。',
    description_i18n: {
      ZH: '上门接宠 + 单独火化 + 告别仪式 + 高端骨灰盒 + 爪印纪念 + 纪念相框/相片。',
      EN: 'Pickup + private cremation + farewell ceremony + premium urn box + pawprint keepsake + memorial frame/photo.',
      KM: 'Pickup + private cremation + farewell ceremony + premium urn box + pawprint keepsake + memorial frame/photo.',
    },
  },
  {
    id: 9304,
    category: 'services',
    subCategory: '仪式策划',
    subCategory_i18n: { ZH: '仪式策划', EN: 'Ceremony planning', KM: 'Ceremony planning' },
    serviceSubId: 'ceremony',
    name: '善终套餐·Ceremony（From $399）',
    name_i18n: { ZH: '善终套餐·Ceremony（From $399）', EN: 'Aftercare Package · Ceremony (From $399)', KM: 'Aftercare Package · Ceremony (From $399)' },
    price: 399.0,
    rating: 4.9,
    sales: 90,
    image: 'https://images.unsplash.com/photo-1520975958225-45a42b0b63b4?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '定制化安排',
    time_i18n: { ZH: '定制化安排', EN: 'Custom arrangement', KM: 'Custom arrangement' },
    description: '专车接宠 + 告别仪式 + 单独火化 + 纪念视频 + 纪念首饰等升级项。',
    description_i18n: {
      ZH: '专车接宠 + 告别仪式 + 单独火化 + 纪念视频 + 纪念首饰等升级项。',
      EN: 'Private pickup vehicle + farewell ceremony + private cremation + memorial video + keepsake jewelry upgrades.',
      KM: 'Private pickup vehicle + farewell ceremony + private cremation + memorial video + keepsake jewelry upgrades.',
    },
  },
  {
    id: 9401,
    category: 'services',
    subCategory: '加购',
    subCategory_i18n: { ZH: '加购', EN: 'Add-ons', KM: 'Add-ons' },
    serviceSubId: 'ceremony',
    name: '加购·纪念视频',
    name_i18n: { ZH: '加购·纪念视频', EN: 'Add-on · Memorial Video', KM: 'Add-on · Memorial Video' },
    price: 60.0,
    rating: 4.8,
    sales: 460,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '24 小时内交付',
    time_i18n: { ZH: '24 小时内交付', EN: 'Delivered within 24 hours', KM: 'Delivered within 24 hours' },
    description: '将照片与文字整理成一段纪念视频，便于分享与留存。',
    description_i18n: {
      ZH: '将照片与文字整理成一段纪念视频，便于分享与留存。',
      EN: 'Turn photos and words into a memorial video for sharing and keeping.',
      KM: 'Turn photos and words into a memorial video for sharing and keeping.',
    },
  },
  {
    id: 9402,
    category: 'services',
    subCategory: '加购',
    subCategory_i18n: { ZH: '加购', EN: 'Add-ons', KM: 'Add-ons' },
    serviceSubId: 'ceremony',
    name: '加购·骨灰项链',
    name_i18n: { ZH: '加购·骨灰项链', EN: 'Add-on · Ashes Necklace', KM: 'Add-on · Ashes Necklace' },
    price: 80.0,
    rating: 4.9,
    sales: 240,
    image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '3–7 天',
    time_i18n: { ZH: '3–7 天', EN: 'Made in 3–7 days', KM: 'Made in 3–7 days' },
    description: '纪念首饰升级项，提供更强的情感价值交付。',
    description_i18n: {
      ZH: '纪念首饰升级项，提供更强的情感价值交付。',
      EN: 'Keepsake jewelry upgrade that delivers deeper emotional value.',
      KM: 'Keepsake jewelry upgrade that delivers deeper emotional value.',
    },
  },
  {
    id: 9403,
    category: 'services',
    subCategory: '加购',
    subCategory_i18n: { ZH: '加购', EN: 'Add-ons', KM: 'Add-ons' },
    serviceSubId: 'ceremony',
    name: '加购·纪念相框',
    name_i18n: { ZH: '加购·纪念相框', EN: 'Add-on · Memorial Photo Frame', KM: 'Add-on · Memorial Photo Frame' },
    price: 40.0,
    rating: 4.7,
    sales: 520,
    image: 'https://images.unsplash.com/photo-1520975869015-9f167c5f021d?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '48 小时内',
    time_i18n: { ZH: '48 小时内', EN: 'Within 48 hours', KM: 'Within 48 hours' },
    description: '将照片制作成纪念相框，适合放置在家中纪念角。',
    description_i18n: {
      ZH: '将照片制作成纪念相框，适合放置在家中纪念角。',
      EN: 'Turn photos into a memorial frame — perfect for a remembrance corner at home.',
      KM: 'Turn photos into a memorial frame — perfect for a remembrance corner at home.',
    },
  },
  {
    id: 9501,
    category: 'fee',
    name: '费用·接送费（0–5km）',
    name_i18n: { ZH: '费用·接送费（0–5km）', EN: 'Fee · Pickup (0–5km)', KM: 'Fee · Pickup (0–5km)' },
    price: 10.0,
    rating: 4.8,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520012218364-4f5c2046a4a3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '同城 2 小时内',
    time_i18n: { ZH: '同城 2 小时内', EN: 'Within 2 hours (in-city)', KM: 'Within 2 hours (in-city)' },
    description: '按距离计费（0–5km）。',
    description_i18n: { ZH: '按距离计费（0–5km）。', EN: 'Distance-based fee (0–5km).', KM: 'Distance-based fee (0–5km).' },
  },
  {
    id: 9502,
    category: 'fee',
    name: '费用·接送费（5–10km）',
    name_i18n: { ZH: '费用·接送费（5–10km）', EN: 'Fee · Pickup (5–10km)', KM: 'Fee · Pickup (5–10km)' },
    price: 20.0,
    rating: 4.8,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520012218364-4f5c2046a4a3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '同城 2 小时内',
    time_i18n: { ZH: '同城 2 小时内', EN: 'Within 2 hours (in-city)', KM: 'Within 2 hours (in-city)' },
    description: '按距离计费（5–10km）。',
    description_i18n: { ZH: '按距离计费（5–10km）。', EN: 'Distance-based fee (5–10km).', KM: 'Distance-based fee (5–10km).' },
  },
  {
    id: 9503,
    category: 'fee',
    name: '费用·接送费（10km+）',
    name_i18n: { ZH: '费用·接送费（10km+）', EN: 'Fee · Pickup (10km+)', KM: 'Fee · Pickup (10km+)' },
    price: 30.0,
    rating: 4.8,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520012218364-4f5c2046a4a3?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '同城 2 小时内',
    time_i18n: { ZH: '同城 2 小时内', EN: 'Within 2 hours (in-city)', KM: 'Within 2 hours (in-city)' },
    description: '按距离计费（10km+）。',
    description_i18n: { ZH: '按距离计费（10km+）。', EN: 'Distance-based fee (10km+).', KM: 'Distance-based fee (10km+).' },
  },
  {
    id: 9601,
    category: 'fee',
    name: '费用·体重加价（5–15kg）',
    name_i18n: { ZH: '费用·体重加价（5–15kg）', EN: 'Fee · Weight Surcharge (5–15kg)', KM: 'Fee · Weight Surcharge (5–15kg)' },
    price: 20.0,
    rating: 4.8,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '按体重段',
    time_i18n: { ZH: '按体重段', EN: 'By weight range', KM: 'By weight range' },
    description: '体重 5–15kg 加价。',
    description_i18n: { ZH: '体重 5–15kg 加价。', EN: 'Surcharge for weight 5–15kg.', KM: 'Surcharge for weight 5–15kg.' },
  },
  {
    id: 9602,
    category: 'fee',
    name: '费用·体重加价（15–30kg）',
    name_i18n: { ZH: '费用·体重加价（15–30kg）', EN: 'Fee · Weight Surcharge (15–30kg)', KM: 'Fee · Weight Surcharge (15–30kg)' },
    price: 40.0,
    rating: 4.8,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '按体重段',
    time_i18n: { ZH: '按体重段', EN: 'By weight range', KM: 'By weight range' },
    description: '体重 15–30kg 加价。',
    description_i18n: { ZH: '体重 15–30kg 加价。', EN: 'Surcharge for weight 15–30kg.', KM: 'Surcharge for weight 15–30kg.' },
  },
  {
    id: 9603,
    category: 'fee',
    name: '费用·体重加价（30kg+）',
    name_i18n: { ZH: '费用·体重加价（30kg+）', EN: 'Fee · Weight Surcharge (30kg+)', KM: 'Fee · Weight Surcharge (30kg+)' },
    price: 80.0,
    rating: 4.8,
    sales: 0,
    image: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=400&auto=format&fit=crop',
    merchantId: 'm1',
    merchant: 'RainbowPaw 官方',
    time: '按体重段',
    time_i18n: { ZH: '按体重段', EN: 'By weight range', KM: 'By weight range' },
    description: '体重 30kg+ 加价。',
    description_i18n: { ZH: '体重 30kg+ 加价。', EN: 'Surcharge for weight 30kg+.', KM: 'Surcharge for weight 30kg+.' },
  },
]

const MEMORIALS = [
  { id: 1, name: '球球', type: '金毛', date: '2024.01.12', message: '谢谢你陪伴我12年，永远爱你。', flowers: 156 },
  { id: 2, name: '咪咪', type: '布偶猫', date: '2023.11.05', message: '在喵星也要开开心心的哦。', flowers: 89 },
]

const Header = ({ title, showBack, onBack, onSearch, onCart, cartCount, onLang, langCode, hideActions }) => (
  <div className="rp-header flex items-center justify-between px-4 py-3 sticky top-0 z-50">
    <div className="flex items-center gap-2">
      {showBack ? (
        <button type="button" aria-label="back" className="border-0 bg-transparent p-0" onClick={onBack}>
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
      ) : null}
      {!showBack ? <img src="/rainbowpaw-logo.png" alt="RainbowPaw" className="w-6 h-6 rounded-lg bg-indigo-50" /> : null}
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    </div>
    {hideActions ? null : (
      <div className="flex gap-4">
        {onLang && langCode ? (
          <button className="border border-gray-200 bg-white/70 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full" onClick={onLang} type="button">
            {langCode}
          </button>
        ) : null}
        <button className="border-0 bg-transparent p-0" onClick={onSearch} type="button">
          <Search size={20} className="text-gray-600" />
        </button>
        <button className="relative border-0 bg-transparent p-0" onClick={onCart} type="button">
          <ShoppingCart size={20} className="text-gray-600" />
          {cartCount ? (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          ) : null}
        </button>
      </div>
    )}
  </div>
)

const PackageAddressPage = ({ t, packageCheckoutDraft, packageAddressDraft, setPackageAddressDraft, onBack, onConfirm, onRequestLocation }) => {
  const [submitting, setSubmitting] = useState(false)
  const canContinue = Boolean(
    String(packageAddressDraft?.pickup_address || '').trim() &&
      String(packageAddressDraft?.contact_name || '').trim() &&
      String(packageAddressDraft?.contact_phone || '').trim()
  )

  return (
    <div className="rp-page-bg min-h-screen pb-24">
      <Header title={t('aftercare.addr.title')} showBack onBack={onBack} hideActions />
      <div className="p-4 space-y-3">
        <div className="rp-card p-4">
          <div className="text-sm font-black text-gray-900 mb-1">{t('aftercare.addr.leadTitle')}</div>
          <div className="text-[10px] text-gray-500">{t('aftercare.addr.leadDesc')}</div>
        </div>

        <div className="rp-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">{t('aftercare.addr.contact')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={String(packageAddressDraft?.contact_name || '')}
                placeholder={t('aftercare.addr.contactPh')}
                onChange={(e) => setPackageAddressDraft((p) => ({ ...(p || {}), contact_name: e.target.value }))}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">{t('aftercare.addr.phone')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={String(packageAddressDraft?.contact_phone || '')}
                placeholder={t('aftercare.addr.phonePh')}
                onChange={(e) => setPackageAddressDraft((p) => ({ ...(p || {}), contact_phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1">{t('aftercare.addr.city')}</div>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
              value={String(packageAddressDraft?.city || '')}
              placeholder={t('aftercare.addr.cityPh')}
              onChange={(e) => setPackageAddressDraft((p) => ({ ...(p || {}), city: e.target.value }))}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1">{t('aftercare.addr.address')}</div>
            <textarea
              className="w-full min-h-[90px] border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 bg-white"
              value={String(packageAddressDraft?.pickup_address || '')}
              placeholder={t('aftercare.addr.addressPh')}
              onChange={(e) => setPackageAddressDraft((p) => ({ ...(p || {}), pickup_address: e.target.value }))}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1">{t('aftercare.addr.timeWindow')}</div>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
              value={String(packageAddressDraft?.time_window || '')}
              placeholder={t('aftercare.addr.timeWindowPh')}
              onChange={(e) => setPackageAddressDraft((p) => ({ ...(p || {}), time_window: e.target.value }))}
            />
          </div>
        </div>

        <div className="rp-card p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-600">{t('aftercare.addr.location')}</div>
              <div className="text-[10px] text-gray-500 truncate">{t('aftercare.addr.locationDesc')}</div>
            </div>
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-xs font-bold border bg-white text-gray-700 border-gray-200 active:bg-gray-50"
              onClick={onRequestLocation}
            >
              {t('aftercare.addr.locationBtn')}
            </button>
          </div>
          {packageAddressDraft?.location_lat != null && packageAddressDraft?.location_lng != null ? (
            <div className="text-[10px] font-mono text-gray-600">
              lat:{Number(packageAddressDraft.location_lat).toFixed(6)} lng:{Number(packageAddressDraft.location_lng).toFixed(6)}
              {packageAddressDraft.location_accuracy_m != null ? ` acc:${Number(packageAddressDraft.location_accuracy_m).toFixed(0)}m` : ''}
            </div>
          ) : (
            <div className="text-[10px] text-gray-400">{t('aftercare.addr.locationEmpty')}</div>
          )}
          {packageAddressDraft?.location_formatted_address || packageAddressDraft?.location_display_name ? (
            <div className="mt-2 text-[10px] text-gray-500">
              {String(packageAddressDraft.location_formatted_address || packageAddressDraft.location_display_name)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 pb-safe max-w-md mx-auto z-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-500">{t('aftercare.addr.bundleLabel')}</div>
            <div className="text-sm font-black text-gray-900 truncate">{packageCheckoutDraft?.title || '-'}</div>
          </div>
          <button
            type="button"
            disabled={!canContinue || !packageCheckoutDraft || submitting}
            className={`rp-btn-primary px-5 py-3 rounded-xl text-sm font-bold border-0 ${canContinue && packageCheckoutDraft && !submitting ? '' : 'opacity-60'}`}
            onClick={() => {
              if (submitting) return
              if (!packageCheckoutDraft) return
              const pickup_address = String(packageAddressDraft?.pickup_address || '').trim()
              const contact_name = String(packageAddressDraft?.contact_name || '').trim()
              const contact_phone = String(packageAddressDraft?.contact_phone || '').trim()
              if (!pickup_address || !contact_name || !contact_phone) return
              setSubmitting(true)
              const payload = {
                city: String(packageAddressDraft?.city || '').trim() || null,
                pickup_address,
                time_window: String(packageAddressDraft?.time_window || '').trim() || null,
                contact_name,
                contact_phone,
                location_lat: packageAddressDraft?.location_lat ?? null,
                location_lng: packageAddressDraft?.location_lng ?? null,
                location_accuracy_m: packageAddressDraft?.location_accuracy_m ?? null,
                location_source: packageAddressDraft?.location_source ?? null,
                location_display_name: packageAddressDraft?.location_display_name ?? null,
                location_formatted_address: packageAddressDraft?.location_formatted_address ?? null,
              }
              setTimeout(() => {
                Promise.resolve(onConfirm(payload)).finally(() => setSubmitting(false))
              }, 0)
            }}
          >
            {submitting ? t('common.processing') : t('aftercare.addr.confirmPay')}
          </button>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, onClick, onMerchantClick, t }) => (
  <div className="rp-card overflow-hidden mb-4">
    <SafeImage src={product.image} alt={product.name} className="w-full h-32 sm:h-40 object-cover" onClick={() => onClick(product)} />
    <div className="p-3">
      <div
        className="text-[10px] text-indigo-600 font-medium mb-1 flex items-center gap-1 active:opacity-60"
        onClick={(e) => {
          e.stopPropagation()
          onMerchantClick(product.merchantId)
        }}
      >
        <Store size={10} />
        {product.merchant}
        <ChevronRight size={10} />
      </div>
      <h3 className="font-medium text-sm text-gray-800 mb-1 truncate" onClick={() => onClick(product)}>{product.name}</h3>
      <div className="flex items-center justify-between">
        <span className="text-red-500 font-bold text-base">${product.price.toFixed(2)}</span>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Star size={10} className="fill-yellow-400 text-yellow-400" />
          <span>{product.rating}</span>
          <span className="ml-1">{t('product.sold', { count: product.sales })}</span>
        </div>
      </div>
    </div>
  </div>
)

const ProductDetailPage = ({ product, onBack, onBuy, onMerchantClick, onAddToCart, t }) => (
    <div className="rp-page-bg min-h-screen pb-28">
    <div className="relative">
      <SafeImage src={product.image} className="w-full h-80 object-cover" alt="detail" />
      <button onClick={onBack} className="absolute top-4 left-4 bg-black/30 p-2 rounded-full text-white backdrop-blur-sm">
        <ArrowLeft size={20} />
      </button>
    </div>
    <div className="rp-card mx-4 p-5 rounded-3xl -mt-8 relative z-10">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-xl font-bold text-gray-800 flex-1">{product.name}</h1>
        <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold">
          <Star size={12} className="fill-indigo-600" />
          {product.rating}
        </div>
      </div>
      <div className="text-2xl font-black text-red-500 mb-4">${product.price.toFixed(2)}</div>
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl active:bg-gray-100" onClick={() => onMerchantClick(product.merchantId)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center font-bold text-indigo-600">{product.merchant[0]}</div>
            <div>
              <p className="text-xs font-bold">{product.merchant}</p>
              <p className="text-[9px] text-gray-400">{t('product.toStore')}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Clock size={14} />
          <span>{t('product.makeTime', { time: product.time })}</span>
        </div>
        <div className="border-t pt-4">
          <h4 className="font-bold text-sm mb-2">{t('product.detailTitle')}</h4>
          <p className="text-xs text-gray-500 leading-relaxed">{product.description}</p>
        </div>
      </div>
    </div>
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 pb-safe flex gap-3 items-center max-w-md mx-auto z-50">
      <div className="flex flex-col items-center gap-1 text-gray-500" onClick={() => onMerchantClick(product.merchantId)}>
        <Store size={20} />
        <span className="text-[10px]">{t('product.store')}</span>
      </div>
      <button className="rp-btn-soft flex-1 font-bold py-3 rounded-xl text-sm border-0" onClick={onAddToCart}>{t('product.addToCart')}</button>
      <button onClick={onBuy} className="rp-btn-primary flex-1 font-bold py-3 rounded-xl text-sm">{t('product.buyNow')}</button>
    </div>
  </div>
)

const PaymentPage = ({ onBack, total, method, setMethod, onConfirm, t }) => {
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="rp-page-bg min-h-screen">
      <Header title={t('pay.title')} showBack onBack={onBack} hideActions />
      <div className="p-6">
        <div className="rp-card rounded-2xl p-6 text-center mb-6 border-b-4 border-indigo-600">
          <p className="text-gray-400 text-sm mb-2">{t('pay.amount')}</p>
          <h2 className="text-3xl font-black text-gray-900">${total.toFixed(2)}</h2>
        </div>
        <h3 className="font-bold text-sm text-gray-500 mb-4 px-2 uppercase tracking-wider">{t('pay.chooseMethod')}</h3>
        <div className="space-y-3">
          {[
            { id: 'aba', name: 'ABA Pay', desc: t('pay.method.aba.desc'), icon: '🏦' },
            { id: 'usdt', name: 'USDT (TRC20)', desc: t('pay.method.usdt.desc'), icon: '🪙' },
            { id: 'bank', name: 'Bank Transfer', desc: t('pay.method.bank.desc'), icon: '💳' },
          ].map((m) => (
            <div
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`p-4 bg-white rounded-xl border-2 transition-all flex items-center justify-between ${method === m.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="font-bold text-sm">{m.name}</p>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                </div>
              </div>
              {method === m.id ? <CheckCircle2 className="text-indigo-600" size={20} /> : null}
            </div>
          ))}
        </div>
        <button
          className={`rp-btn-primary w-full font-bold py-4 rounded-2xl mt-8 active:scale-95 transition-transform ${submitting ? 'opacity-70' : ''}`}
          disabled={submitting}
          onClick={async () => {
            if (submitting) return
            setSubmitting(true)
            try {
              await onConfirm?.()
            } finally {
              setSubmitting(false)
            }
          }}
          type="button"
        >
          {submitting ? t('common.processing') : t('pay.confirm')}
        </button>
      </div>
    </div>
  )
}

const MerchantPortal = ({ onBackToUser, lang, t }) => {
  const [merchantTab, setMerchantTab] = useState('orders')
  const [merchantToken, setMerchantToken] = useState(() => {
    try {
      return localStorage.getItem('rp_merchant_bearer_v1') || ''
    } catch {
      return ''
    }
  })
  const [merchantMe, setMerchantMe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const [orderFilter, setOrderFilter] = useState('todo')
  const [merchantOrders, setMerchantOrders] = useState([])
  const [selectedMerchantOrderId, setSelectedMerchantOrderId] = useState(null)
  const [merchantOrderDetail, setMerchantOrderDetail] = useState(null)
  const [shipModal, setShipModal] = useState(null)
  const [shipDraft, setShipDraft] = useState({ carrier: '', tracking_no: '', note: '' })

  const [merchantProducts, setMerchantProducts] = useState([])
  const [productDraft, setProductDraft] = useState(null)
  const [productSaving, setProductSaving] = useState(false)
  const [productEditLocale, setProductEditLocale] = useState(() => rpMiniAppLangToLocale(lang))

  const [merchantRevenue, setMerchantRevenue] = useState(null)
  const [settlementRequests, setSettlementRequests] = useState([])
  const [settlementNote, setSettlementNote] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const merchantHeaders = () => {
    const token = String(merchantToken || '').trim()
    if (!token) return null
    return { authorization: `Bearer ${token}` }
  }

  const merchantFetch = async (path, opts = {}) => {
    const headers = merchantHeaders()
    if (!headers) throw new Error(t('merchant.missingToken'))
    const locale = rpMiniAppLangToLocale(lang)
    const withLang = (p) => {
      const s = String(p || '')
      if (!locale) return s
      if (s.includes('lang=')) return s
      const sep = s.includes('?') ? '&' : '?'
      return `${s}${sep}lang=${encodeURIComponent(locale)}`
    }
    return apiFetch(withLang(path), { ...opts, headers: { ...(opts.headers || {}), ...headers } })
  }

  const loadMerchantMe = async () => {
    setLoading(true)
    try {
      const me = await merchantFetch('/api/v1/merchant/me')
      setMerchantMe(me)
      try {
        localStorage.setItem('rp_merchant_bearer_v1', String(merchantToken || '').trim())
      } catch (e) {
        void e
      }
      return me
    } finally {
      setLoading(false)
    }
  }

  const loadMerchantOrders = async () => {
    if (!merchantHeaders()) return []
    const res = await merchantFetch('/api/v1/merchant/orders')
    const items = Array.isArray(res?.items) ? res.items : []
    setMerchantOrders(items)
    return items
  }

  const loadMerchantOrderDetail = async (orderId) => {
    if (!orderId) return null
    setLoading(true)
    try {
      const res = await merchantFetch(`/api/v1/merchant/orders/${encodeURIComponent(orderId)}`)
      setMerchantOrderDetail(res)
      return res
    } finally {
      setLoading(false)
    }
  }

  const loadMerchantProducts = async () => {
    if (!merchantHeaders()) return []
    const res = await merchantFetch('/api/v1/merchant/products')
    const items = Array.isArray(res?.items) ? res.items : []
    setMerchantProducts(items)
    return items
  }

  const loadMerchantRevenue = async () => {
    if (!merchantHeaders()) return null
    const res = await merchantFetch('/api/v1/merchant/revenue')
    setMerchantRevenue(res)
    return res
  }

  const loadSettlementRequests = async () => {
    if (!merchantHeaders()) return []
    const res = await merchantFetch('/api/v1/merchant/settlement-requests')
    const items = Array.isArray(res?.items) ? res.items : []
    setSettlementRequests(items)
    return items
  }

  useEffect(() => {
    if (!merchantHeaders()) return
    loadMerchantMe()
      .then(() => Promise.all([loadMerchantOrders(), loadMerchantProducts(), loadMerchantRevenue(), loadSettlementRequests()]))
      .catch(() => {})
  }, [])

  const ordersTodo = merchantOrders.filter((o) => !['completed', 'cancelled'].includes(String(o.status || '')) && String(o.status || '') !== 'shipped')
  const ordersDone = merchantOrders.filter((o) => ['completed', 'shipped'].includes(String(o.status || '')))
  const ordersToRender = orderFilter === 'all' ? merchantOrders : orderFilter === 'done' ? ordersDone : ordersTodo

  const gmvToday = (() => {
    const today = new Date().toISOString().slice(0, 10)
    const sum = ordersTodo
      .concat(ordersDone)
      .filter((o) => String(o.created_at || '').slice(0, 10) === today)
      .reduce((acc, o) => acc + Number(o.total_amount_cents || 0), 0)
    return (sum / 100).toFixed(2)
  })()

  const ensureMerchantReady = () => {
    if (!merchantHeaders()) {
      showToast(t('merchant.tokenRequired'))
      return false
    }
    if (!merchantMe) {
      showToast(t('merchant.verifyTokenRequired'))
      return false
    }
    return true
  }

  const acceptOrder = async (orderId) => {
    if (!ensureMerchantReady()) return
    setLoading(true)
    try {
      await merchantFetch(`/api/v1/merchant/orders/${encodeURIComponent(orderId)}/accept`, { method: 'POST' })
      showToast('已接单')
      await loadMerchantOrders()
      await loadMerchantOrderDetail(orderId)
    } catch (e) {
      showToast(e?.message || t('merchant.acceptFailed'))
    } finally {
      setLoading(false)
    }
  }

  const rejectOrder = async (orderId) => {
    if (!ensureMerchantReady()) return
    const reason = prompt(t('merchant.rejectReasonPrompt')) || null
    setLoading(true)
    try {
      await merchantFetch(`/api/v1/merchant/orders/${encodeURIComponent(orderId)}/reject`, { method: 'POST', body: { reason } })
      showToast('已拒单')
      setSelectedMerchantOrderId(null)
      setMerchantOrderDetail(null)
      await loadMerchantOrders()
    } catch (e) {
      showToast(e?.message || t('merchant.rejectFailed'))
    } finally {
      setLoading(false)
    }
  }

  const shipOrder = async (orderId) => {
    if (!ensureMerchantReady()) return
    setLoading(true)
    try {
      await merchantFetch(`/api/v1/merchant/orders/${encodeURIComponent(orderId)}/ship`, { method: 'POST', body: shipDraft })
      showToast('已标记发货')
      setShipModal(null)
      setShipDraft({ carrier: '', tracking_no: '', note: '' })
      await loadMerchantOrders()
      await loadMerchantOrderDetail(orderId)
    } catch (e) {
      showToast(e?.message || t('merchant.shipFailed'))
    } finally {
      setLoading(false)
    }
  }

  const requestSettlement = async () => {
    if (!ensureMerchantReady()) return
    setLoading(true)
    try {
      await merchantFetch('/api/v1/merchant/settlement-requests', { method: 'POST', body: { note: settlementNote || null } })
      showToast('已提交结算申请')
      setSettlementNote('')
      await loadSettlementRequests()
    } catch (e) {
      showToast(e?.message || t('merchant.applyFailed'))
    } finally {
      setLoading(false)
    }
  }

  const setProductStatus = async (productId, status) => {
    if (!ensureMerchantReady()) return
    setProductSaving(true)
    try {
      await merchantFetch(`/api/v1/merchant/products/${encodeURIComponent(productId)}/status`, { method: 'POST', body: { status } })
      await loadMerchantProducts()
      showToast(status === 'active' ? '已上架' : '已下架')
    } catch (e) {
      showToast(e?.message || t('merchant.actionFailed'))
    } finally {
      setProductSaving(false)
    }
  }

  const setProductStock = async (productId, stock) => {
    if (!ensureMerchantReady()) return
    const n = Number(stock)
    if (!Number.isFinite(n) || n < 0) {
      showToast('库存必须是 >= 0 的数字')
      return
    }
    setProductSaving(true)
    try {
      await merchantFetch(`/api/v1/merchant/products/${encodeURIComponent(productId)}/stock`, { method: 'POST', body: { stock: Math.floor(n) } })
      await loadMerchantProducts()
      showToast('库存已更新')
    } catch (e) {
      showToast(e?.message || t('merchant.updateFailed'))
    } finally {
      setProductSaving(false)
    }
  }

  const ensureI18nShape = (i18n) => {
    const next = i18n && typeof i18n === 'object' ? { ...i18n } : {}
    const ensure = (k) => {
      if (!next[k] || typeof next[k] !== 'object') next[k] = {}
      next[k] = {
        name: next[k].name || '',
        category_label: next[k].category_label || '',
        description: next[k].description || '',
      }
    }
    ensure('zh-CN')
    ensure('en')
    ensure('km')
    return next
  }

  const saveProductDraft = async () => {
    if (!ensureMerchantReady()) return
    const d = productDraft && typeof productDraft === 'object' ? productDraft : null
    if (!d) return
    const isNew = !d.id
    const defaultLang = d.default_lang || rpMiniAppLangToLocale(lang)
    const i18n = ensureI18nShape(d.i18n)
    const name = String(i18n?.[defaultLang]?.name || '').trim()
    const categoryLabel = String(i18n?.[defaultLang]?.category_label || '').trim()
    const payload = {
      category: String(d.category || '').trim(),
      price_cents: Math.round(Number(d.price_usd || 0) * 100),
      stock: d.stock == null || d.stock === '' ? null : Math.max(0, Math.floor(Number(d.stock || 0))),
      default_lang: defaultLang,
      i18n,
    }
    if (!name || !categoryLabel || !payload.category || !Number.isFinite(payload.price_cents)) {
      showToast(t ? t('merchant.productDraft.required') : '请完整填写默认语言的名称/分类、以及类目/价格')
      return
    }
    setProductSaving(true)
    try {
      if (isNew) await merchantFetch('/api/v1/merchant/products', { method: 'POST', body: payload })
      else await merchantFetch(`/api/v1/merchant/products/${encodeURIComponent(d.id)}`, { method: 'PATCH', body: payload })
      setProductDraft(null)
      await loadMerchantProducts()
      showToast(isNew ? '商品已创建（待审核）' : '商品已更新')
    } catch (e) {
      showToast(e?.message || t('merchant.saveFailed'))
    } finally {
      setProductSaving(false)
    }
  }

  const header = (
    <div className="bg-indigo-600 text-white p-6 pt-12 rounded-b-[40px] shadow-lg">
      <div className="flex items-center mb-6">
        <button type="button" onClick={onBackToUser} className="bg-white/20 p-2 rounded-full backdrop-blur-md active:scale-90 border-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold">{merchantMe?.name || '商家管理'}</h2>
          <p className="text-[10px] opacity-70">认证状态：{merchantMe?.status === 'approved' ? '已认证商家' : '未认证'}</p>
        </div>
        <div className="w-10" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
          <p className="text-[10px] opacity-70 mb-1 uppercase">今日 GMV</p>
          <p className="text-xl font-black">${gmvToday}</p>
        </div>
        <button
          type="button"
          className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm text-left border-0 active:opacity-80"
          onClick={() => {
            setMerchantTab('orders')
            setOrderFilter('todo')
          }}
        >
          <p className="text-[10px] opacity-70 mb-1 uppercase">待处理订单</p>
          <p className="text-xl font-black">{ordersTodo.length}</p>
        </button>
      </div>
    </div>
  )

  const tokenGate = !merchantHeaders() || !merchantMe

  return (
    <div className="rp-page-bg min-h-screen pb-24">
      {header}

      {tokenGate ? (
        <div className="p-4">
          <div className="rp-card p-4">
            <div className="text-sm font-black text-gray-900 mb-2">Merchant Token</div>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
              placeholder="请输入 merchant token（Bearer 后面的 token）"
              value={merchantToken}
              onChange={(e) => setMerchantToken(e.target.value)}
            />
            <button
              type="button"
              disabled={loading || !String(merchantToken || '').trim()}
              onClick={() => loadMerchantMe().then(() => Promise.all([loadMerchantOrders(), loadMerchantProducts(), loadMerchantRevenue(), loadSettlementRequests()])).catch((e) => showToast(e?.message || '验证失败'))}
              className={`w-full mt-3 font-black py-3 rounded-xl border-0 ${loading || !String(merchantToken || '').trim() ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white'}`}
            >
              验证并进入
            </button>
            <div className="text-[10px] text-gray-500 mt-2">可从管理后台“商家→Token”获取。</div>
          </div>
        </div>
      ) : null}

      {!tokenGate && merchantTab === 'orders' ? (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">订单管理</h3>
            <div className="flex gap-2">
              <button type="button" className={`px-3 py-1 text-[10px] rounded-full border shadow-sm ${orderFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => setOrderFilter('all')}>
                全部
              </button>
              <button type="button" className={`px-3 py-1 text-[10px] rounded-full border shadow-sm ${orderFilter === 'todo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => setOrderFilter('todo')}>
                待处理
              </button>
              <button type="button" className={`px-3 py-1 text-[10px] rounded-full border shadow-sm ${orderFilter === 'done' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => setOrderFilter('done')}>
                已完成
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {ordersToRender.map((o) => {
              const id = String(o.order_code || o.order_id || '')
              const status = String(o.status || '')
              const amount = (Number(o.total_amount_cents || 0) / 100).toFixed(2)
              const shipDisabled = ['shipped', 'completed', 'cancelled'].includes(status)
              return (
                <div
                  key={id}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-xl p-4 border shadow-sm w-full text-left active:opacity-80 cursor-pointer"
                  onClick={() => {
                    setSelectedMerchantOrderId(id)
                    loadMerchantOrderDetail(id).catch(() => {})
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    setSelectedMerchantOrderId(id)
                    loadMerchantOrderDetail(id).catch(() => {})
                  }}
                >
                  <div className="flex justify-between mb-3">
                    <span className="text-[10px] font-mono text-gray-400">#{id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${status === 'shipped' || status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {status || 'unknown'}
                    </span>
                  </div>
                  <div className="flex gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{String(o.service_package || o.service_category || '订单')}</p>
                      <p className="text-[10px] text-gray-400 truncate">{String(o.city || '')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">${amount}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <button
                      type="button"
                      className="flex-1 text-[11px] font-bold py-2 border rounded-lg active:bg-gray-50"
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          const data = await loadMerchantOrderDetail(id)
                          const phone = String(data?.order?.user_phone || data?.order?.phone || '').trim()
                          if (!phone) return showToast('缺少买家手机号')
                          try {
                            await navigator.clipboard.writeText(phone)
                            showToast(t('merchant.phoneCopied'))
                          } catch {
                            showToast(phone)
                          }
                        } catch (err) {
                          showToast(err?.message || t('merchant.loadFailed'))
                        }
                      }}
                    >
                      联系买家
                    </button>
                    <button
                      type="button"
                      disabled={shipDisabled}
                      className={`flex-1 text-[11px] font-bold py-2 rounded-lg border-0 ${shipDisabled ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white active:bg-indigo-700'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (shipDisabled) return
                        setShipModal({ orderId: id })
                        setShipDraft({ carrier: '', tracking_no: '', note: '' })
                      }}
                    >
                      {t('merchant.confirmShipBtn')}
                    </button>
                  </div>
                </div>
              )
            })}
            {ordersToRender.length === 0 ? <div className="text-xs text-gray-500 text-center py-10">暂无订单</div> : null}
          </div>

          {selectedMerchantOrderId && merchantOrderDetail ? (
            <div className="mt-6 bg-white rounded-2xl p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-black text-gray-900">订单详情</div>
                <button type="button" className="text-xs font-bold border rounded-lg px-3 py-2 active:bg-gray-50" onClick={() => { setSelectedMerchantOrderId(null); setMerchantOrderDetail(null) }}>
                  关闭
                </button>
              </div>
              <div className="text-[10px] font-mono text-gray-500 mb-2">#{selectedMerchantOrderId}</div>
              <div className="text-xs text-gray-500 mb-3">买家手机号：{merchantOrderDetail?.order?.user_phone || merchantOrderDetail?.order?.phone || '-'}</div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  className="text-[11px] font-bold py-2 border rounded-lg active:bg-gray-50"
                  onClick={async () => {
                    const phone = String(merchantOrderDetail?.order?.user_phone || merchantOrderDetail?.order?.phone || '').trim()
                    if (!phone) return showToast('缺少买家手机号')
                    try {
                      await navigator.clipboard.writeText(phone)
                      showToast(t('merchant.phoneCopied'))
                    } catch {
                      showToast(phone)
                    }
                  }}
                >
                  联系买家
                </button>
                <button
                  type="button"
                  disabled={['shipped', 'completed', 'cancelled'].includes(String(merchantOrderDetail?.order?.status || ''))}
                  className={`text-[11px] font-bold py-2 rounded-lg border-0 ${['shipped', 'completed', 'cancelled'].includes(String(merchantOrderDetail?.order?.status || '')) ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white active:bg-indigo-700'}`}
                  onClick={() => {
                    if (['shipped', 'completed', 'cancelled'].includes(String(merchantOrderDetail?.order?.status || ''))) return
                    setShipModal({ orderId: selectedMerchantOrderId })
                    setShipDraft({ carrier: '', tracking_no: '', note: '' })
                  }}
                >
                  {t('merchant.confirmShipBtn')}
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  disabled={['accepted', 'shipped', 'completed', 'cancelled', 'rejected'].includes(String(merchantOrderDetail?.order?.status || ''))}
                  className={`flex-1 text-[11px] font-bold py-2 border rounded-lg ${['accepted', 'shipped', 'completed', 'cancelled', 'rejected'].includes(String(merchantOrderDetail?.order?.status || '')) ? 'bg-gray-200 text-gray-500' : 'active:bg-gray-50'}`}
                  onClick={() => acceptOrder(selectedMerchantOrderId)}
                >
                  接单
                </button>
                <button
                  type="button"
                  disabled={['shipped', 'completed', 'cancelled'].includes(String(merchantOrderDetail?.order?.status || ''))}
                  className={`flex-1 text-[11px] font-bold py-2 border rounded-lg ${['shipped', 'completed', 'cancelled'].includes(String(merchantOrderDetail?.order?.status || '')) ? 'bg-gray-200 text-gray-500' : 'active:bg-gray-50'}`}
                  onClick={() => rejectOrder(selectedMerchantOrderId)}
                >
                  拒单
                </button>
              </div>

              <div className="text-xs font-bold text-gray-600 mb-2">明细</div>
              <div className="space-y-2">
                {(merchantOrderDetail.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{String(it.title_snapshot || '')}</div>
                      <div className="text-[10px] text-gray-500">x{Number(it.quantity || 1)}</div>
                    </div>
                    <div className="text-sm font-black text-gray-900">${(Number(it.line_total_cents || 0) / 100).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold text-gray-600 mb-2">时间线</div>
                <div className="space-y-2">
                  {Array.isArray(merchantOrderDetail?.order?.intake_metadata?.timeline) && merchantOrderDetail.order.intake_metadata.timeline.length ? (
                    merchantOrderDetail.order.intake_metadata.timeline
                      .slice()
                      .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
                      .map((ev, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{String(ev.title || ev.type || 'event')}</div>
                            {ev.desc ? <div className="text-[10px] text-gray-500 mt-0.5">{String(ev.desc)}</div> : null}
                          </div>
                          <div className="text-[10px] text-gray-400 shrink-0">{String(ev.at || '')}</div>
                        </div>
                      ))
                  ) : (
                    <div className="text-xs text-gray-500">暂无</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!tokenGate && merchantTab === 'products' ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">商品管理</h3>
            <button type="button" className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white border-0 active:bg-indigo-700" onClick={() => setProductDraft({ category: 'jewelry', price_usd: 0, stock: 0, default_lang: rpMiniAppLangToLocale(lang), i18n: ensureI18nShape(null) })}>
              新增商品
            </button>
          </div>

          {productDraft ? (
            <div className="bg-white rounded-2xl p-4 border shadow-sm mb-4">
              <div className="text-sm font-black text-gray-900 mb-3">{productDraft.id ? '编辑商品' : '新增商品'}</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[11px] font-bold text-gray-600">默认语言</div>
                {['zh-CN', 'en', 'km'].map((lc) => (
                  <button
                    key={lc}
                    type="button"
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${String(productDraft.default_lang || rpMiniAppLangToLocale(lang)) === lc ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}
                    onClick={() => setProductDraft({ ...productDraft, default_lang: lc })}
                  >
                    {lc === 'zh-CN' ? '中文' : lc === 'en' ? 'English' : 'ខ្មែរ'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[11px] font-bold text-gray-600">编辑语言</div>
                {['zh-CN', 'en', 'km'].map((lc) => (
                  <button
                    key={lc}
                    type="button"
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${productEditLocale === lc ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'}`}
                    onClick={() => setProductEditLocale(lc)}
                  >
                    {lc === 'zh-CN' ? '中文' : lc === 'en' ? 'English' : 'ខ្មែរ'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="类目代码（例如：jewelry）" value={productDraft.category || ''} onChange={(e) => setProductDraft({ ...productDraft, category: e.target.value })} />
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="价格（USD）" value={String(productDraft.price_usd ?? '')} onChange={(e) => setProductDraft({ ...productDraft, price_usd: e.target.value })} />
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="库存（空=不限）" value={productDraft.stock ?? ''} onChange={(e) => setProductDraft({ ...productDraft, stock: e.target.value })} />
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  placeholder="商品名称"
                  value={(productDraft.i18n && productDraft.i18n[productEditLocale] ? productDraft.i18n[productEditLocale].name : '') || ''}
                  onChange={(e) => {
                    const nextI18n = ensureI18nShape(productDraft.i18n)
                    nextI18n[productEditLocale].name = e.target.value
                    setProductDraft({ ...productDraft, i18n: nextI18n })
                  }}
                />
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  placeholder="分类显示名"
                  value={(productDraft.i18n && productDraft.i18n[productEditLocale] ? productDraft.i18n[productEditLocale].category_label : '') || ''}
                  onChange={(e) => {
                    const nextI18n = ensureI18nShape(productDraft.i18n)
                    nextI18n[productEditLocale].category_label = e.target.value
                    setProductDraft({ ...productDraft, i18n: nextI18n })
                  }}
                />
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white min-h-[90px]"
                  placeholder="详情/描述"
                  value={(productDraft.i18n && productDraft.i18n[productEditLocale] ? productDraft.i18n[productEditLocale].description : '') || ''}
                  onChange={(e) => {
                    const nextI18n = ensureI18nShape(productDraft.i18n)
                    nextI18n[productEditLocale].description = e.target.value
                    setProductDraft({ ...productDraft, i18n: nextI18n })
                  }}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" disabled={productSaving} className={`flex-1 py-3 rounded-xl text-sm font-black border-0 ${productSaving ? 'bg-gray-200 text-gray-500' : 'bg-indigo-600 text-white'}`} onClick={saveProductDraft}>
                  {t('common.save')}
                </button>
                <button type="button" className="flex-1 py-3 rounded-xl text-sm font-black border border-gray-200 bg-white text-gray-700 active:bg-gray-50" onClick={() => setProductDraft(null)}>
                  取消
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {merchantProducts.map((p) => {
              const cover = p.images?.[0]?.image_url || p.cover_image_url || null
              const stock = p.stock == null ? null : Number(p.stock)
              const status = String(p.status || '')
              return (
                <div key={p.id} className="bg-white rounded-2xl p-4 border shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                      {cover ? <SafeImage src={cover} alt="p" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-gray-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{p.category} · ${((Number(p.price_cents || 0) || 0) / 100).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        状态：{status} · 库存：{stock == null ? '不限' : String(stock)}
                        {p.audit_status ? ` · 审核：${String(p.audit_status)}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <button type="button" disabled={productSaving} className="text-[11px] font-bold py-2 border rounded-lg active:bg-gray-50" onClick={() => setProductStatus(p.id, status === 'active' ? 'inactive' : 'active')}>
                      {status === 'active' ? '下架' : '上架'}
                    </button>
                    <button type="button" disabled={productSaving} className="text-[11px] font-bold py-2 border rounded-lg active:bg-gray-50" onClick={() => setProductStock(p.id, 0)}>
                      售罄
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-bold py-2 border rounded-lg active:bg-gray-50"
                      onClick={() =>
                        setProductDraft({
                          id: p.id,
                          category: p.category,
                          price_usd: ((Number(p.price_cents || 0) || 0) / 100).toFixed(2),
                          stock: p.stock == null ? '' : String(p.stock),
                          default_lang: p.default_lang || rpMiniAppLangToLocale(lang),
                          i18n: ensureI18nShape(p.i18n),
                        })
                      }
                    >
                      修改
                    </button>
                    <button type="button" disabled={productSaving} className="text-[11px] font-bold py-2 border rounded-lg active:bg-gray-50" onClick={() => setProductStock(p.id, Number.isFinite(stock) ? stock + 1 : 1)}>
                      +1 库存
                    </button>
                  </div>
                </div>
              )
            })}
            {merchantProducts.length === 0 ? <div className="text-xs text-gray-500 text-center py-10">暂无商品</div> : null}
          </div>
        </div>
      ) : null}

      {!tokenGate && merchantTab === 'stats' ? (
        <div className="p-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h4 className="font-bold mb-4">财务明细</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">累计交易额</span>
                <span className="font-bold">${(Number(merchantRevenue?.total_amount_cents || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">平台服务费</span>
                <span className="font-bold text-red-400">-${(Number(merchantRevenue?.platform_fee_cents || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-sm font-bold text-gray-800">可提现余额</span>
                <span className="text-lg font-black text-green-500">${(Number(merchantRevenue?.merchant_payout_cents || 0) / 100).toFixed(2)}</span>
              </div>
            </div>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white mt-4"
              placeholder="结算备注（可选）"
              value={settlementNote}
              onChange={(e) => setSettlementNote(e.target.value)}
            />
            <button
              disabled={loading || Number(merchantRevenue?.merchant_payout_cents || 0) <= 0}
              className={`w-full font-bold py-3 rounded-xl mt-3 border-0 ${loading || Number(merchantRevenue?.merchant_payout_cents || 0) <= 0 ? 'bg-gray-200 text-gray-500' : 'bg-green-500 text-white active:bg-green-600'}`}
              onClick={requestSettlement}
              type="button"
            >
              申请结算
            </button>

            <div className="mt-6">
              <div className="text-xs font-bold text-gray-600 mb-2">结算申请记录</div>
              <div className="space-y-2">
                {settlementRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-gray-900">${(Number(r.amount_cents || 0) / 100).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-500 truncate">{String(r.status || '')} · {String(r.created_at || '')}</div>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[45%]">{r.note || ''}</div>
                  </div>
                ))}
                {settlementRequests.length === 0 ? <div className="text-xs text-gray-500">暂无</div> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {shipModal ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-4">
            <div className="text-sm font-black text-gray-900 mb-3">{t('merchant.confirmShip')}</div>
            <div className="space-y-2">
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="物流公司（可选）" value={shipDraft.carrier} onChange={(e) => setShipDraft({ ...shipDraft, carrier: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="运单号（可选）" value={shipDraft.tracking_no} onChange={(e) => setShipDraft({ ...shipDraft, tracking_no: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white" placeholder="备注（可选）" value={shipDraft.note} onChange={(e) => setShipDraft({ ...shipDraft, note: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" className="flex-1 py-3 rounded-xl text-sm font-black bg-indigo-600 text-white border-0 active:bg-indigo-700" onClick={() => shipOrder(shipModal.orderId)}>
                提交
              </button>
              <button type="button" className="flex-1 py-3 rounded-xl text-sm font-black bg-white text-gray-700 border border-gray-200 active:bg-gray-50" onClick={() => setShipModal(null)}>
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-bold px-4 py-2 rounded-full z-[200]">
          {toast}
        </div>
      ) : null}

      <div className="rp-tabbar fixed bottom-0 left-0 right-0 px-8 py-3 pb-safe flex justify-around max-w-md mx-auto z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        <button type="button" onClick={() => setMerchantTab('orders')} className={`rp-tab-item flex flex-col items-center gap-1 border-0 bg-transparent ${merchantTab === 'orders' ? 'rp-tab-item-active' : ''}`}>
          <Package size={20} />
          <span className="text-[10px] font-bold">订单管理</span>
        </button>
        <button type="button" onClick={() => setMerchantTab('products')} className={`rp-tab-item flex flex-col items-center gap-1 border-0 bg-transparent ${merchantTab === 'products' ? 'rp-tab-item-active' : ''}`}>
          <Plus size={24} className="bg-indigo-600 text-white rounded-full p-1 shadow-lg shadow-indigo-200" />
          <span className="text-[10px] font-bold">商品管理</span>
        </button>
        <button type="button" onClick={() => setMerchantTab('stats')} className={`rp-tab-item flex flex-col items-center gap-1 border-0 bg-transparent ${merchantTab === 'stats' ? 'rp-tab-item-active' : ''}`}>
          <BarChart3 size={20} />
          <span className="text-[10px] font-bold">财务报表</span>
        </button>
      </div>
    </div>
  )
}

export default function RainbowPawMiniApp() {
  const [view, setView] = useState('user')
  const [activeTab, setActiveTab] = useState('home')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [checkoutStep, setCheckoutStep] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('aba')
  const [page, setPage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [checkout, setCheckout] = useState(null)
  const [orders, setOrders] = useState([])
  const [backendOrders, setBackendOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [orderPayments, setOrderPayments] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paidOrder, setPaidOrder] = useState(null)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState('pending')
  const [postPayMemorialId, setPostPayMemorialId] = useState(null)
  const [lang, setLang] = useState('ZH')
  const [langReturnPage, setLangReturnPage] = useState(null)
  const [showLangModal, setShowLangModal] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const [runtimeCategories, setRuntimeCategories] = useState(null)
  const [cemeteryLayout, setCemeteryLayout] = useState(null)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const raw = localStorage.getItem('rp_user_profile_v1')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [userAuthToken, setUserAuthToken] = useState(() => {
    try {
      return localStorage.getItem('rp_user_bearer_v1') || ''
    } catch {
      return ''
    }
  })
  const [packageCheckoutDraft, setPackageCheckoutDraft] = useState(null)
  const [packageAddressDraft, setPackageAddressDraft] = useState(() => {
    try {
      const raw = localStorage.getItem('rp_package_address_v1')
      const parsed = raw ? JSON.parse(raw) : null
      const base = parsed && typeof parsed === 'object' ? parsed : {}
      return {
        city: typeof base.city === 'string' ? base.city : 'Phnom Penh',
        pickup_address: typeof base.pickup_address === 'string' ? base.pickup_address : '',
        time_window: typeof base.time_window === 'string' ? base.time_window : '',
        contact_name: typeof base.contact_name === 'string' ? base.contact_name : '',
        contact_phone: typeof base.contact_phone === 'string' ? base.contact_phone : '',
        location_lat: typeof base.location_lat === 'number' ? base.location_lat : null,
        location_lng: typeof base.location_lng === 'number' ? base.location_lng : null,
        location_accuracy_m: typeof base.location_accuracy_m === 'number' ? base.location_accuracy_m : null,
        location_source: typeof base.location_source === 'string' ? base.location_source : null,
        location_display_name: typeof base.location_display_name === 'string' ? base.location_display_name : null,
        location_formatted_address: typeof base.location_formatted_address === 'string' ? base.location_formatted_address : null,
      }
    } catch {
      return {
        city: 'Phnom Penh',
        pickup_address: '',
        time_window: '',
        contact_name: '',
        contact_phone: '',
        location_lat: null,
        location_lng: null,
        location_accuracy_m: null,
        location_source: null,
        location_display_name: null,
        location_formatted_address: null,
      }
    }
  })
  const telegramAutoLoginOnceRef = useRef(false)
  const [pets, setPets] = useState([])
  const [petDraft, setPetDraft] = useState(null)
  const [petsLoading, setPetsLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [memorialFavIds, setMemorialFavIds] = useState(() => {
    try {
      const raw = localStorage.getItem('rp_memorial_favs_v1')
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  })
  const [memorials, setMemorials] = useState(() =>
    MEMORIALS.map((m, idx) => ({
      ...m,
      candles: idx === 0 ? 256 : 64,
      messages: [],
      photos: [],
      upgraded: false,
    }))
  )
  const [memorialSelectedId, setMemorialSelectedId] = useState(MEMORIALS[0]?.id || null)
  const [memorialDraftMessage, setMemorialDraftMessage] = useState('')
  const [memorialDraftPhoto, setMemorialDraftPhoto] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rp_miniapp_lang')
      if (saved) {
        setLang(saved)
        setShowLangModal(false)
      } else {
        const auto = rpMiniAppLocaleToLang(
          typeof navigator !== 'undefined' ? navigator.language : 'en',
        )
        setLang(auto)
        setShowLangModal(true)
      }
    } catch (e) {
      void e
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('rp_miniapp_lang', lang)
    } catch (e) {
      void e
    }
  }, [lang])

  const t = (key, vars) => rpMiniAppT(lang, key, vars)

  const pickI18n = (value) => {
    const translateZh = (s) => {
      let out = String(s || '')
      out = out
        .replaceAll('云纪念·', 'Cloud Memorial · ')
        .replaceAll('点亮祈福', 'Prayer Light')
        .replaceAll('献花', 'Flowers')
        .replaceAll('永久守护升级', 'Eternal Guardian Upgrade')
        .replaceAll('善终拼单·', 'Aftercare Group Deal · ')
        .replaceAll('接送费', 'Pickup fee')
        .replaceAll('告别仪式', 'Farewell ceremony')
        .replaceAll('火化安排', 'Cremation arrangement')
        .replaceAll('集体', 'Group')
        .replaceAll('单独', 'Private')
        .replaceAll('即时生效', 'Instant')
        .replaceAll('即时生成', 'Instant')
        .replaceAll('预约制', 'By appointment')
        .replaceAll('标准服务流程', 'Standard process')
        .replaceAll('年费订阅', 'Annual subscription')
        .replaceAll('含一次实地陪同', 'Includes one on-site visit')
        .replaceAll('普通区', 'Basic zone')
        .replaceAll('景观区', 'Garden zone')
        .replaceAll('尊享', 'Premium')
        .replaceAll('基础', 'Basic')
        .replaceAll('标准', 'Standard')
        .replaceAll('加购·', 'Add-on · ')
      out = out
        .replace(/\b(\d+)天制作\b/g, 'Made in $1 days')
        .replace(/\b(\d+)-(\d+)天制作\b/g, 'Made in $1–$2 days')
        .replace(/\b(\d+)-(\d+)\s*天\b/g, '$1–$2 days')
        .replace(/\b(\d+)\s*小时内\b/g, 'Within $1 hours')
        .replaceAll('分钟', 'min')
      return out
    }

    if (!value) return ''
    const wantTranslate = lang !== 'ZH'
    if (typeof value === 'string') return wantTranslate ? translateZh(value) : value
    if (typeof value === 'object') {
      const v = value[lang] || value.EN || value.ZH
      if (v == null) return ''
      const s = String(v)
      return wantTranslate ? translateZh(s) : s
    }
    return wantTranslate ? translateZh(String(value)) : String(value)
  }

  const merchants = MERCHANTS_RAW.map((m) => ({
    ...m,
    name: pickI18n(m.name_i18n || m.name),
    location: pickI18n(m.location_i18n || m.location),
    desc: pickI18n(m.desc_i18n || m.desc),
  }))
  const merchantById = merchants.reduce((acc, m) => {
    acc[m.id] = m
    return acc
  }, {})
  const products = PRODUCTS_RAW.map((p) => ({
    ...p,
    subCategory: pickI18n(p.subCategory_i18n || p.subCategory),
    name: pickI18n(p.name_i18n || p.name),
    time: pickI18n(p.time_i18n || p.time),
    description: pickI18n(p.description_i18n || p.description),
    merchant: (merchantById[p.merchantId] && merchantById[p.merchantId].name) || p.merchant || '',
  }))

  const saveUserAuthToken = (next) => {
    const token = String(next || '').trim()
    setUserAuthToken(token)
    try {
      if (token) localStorage.setItem('rp_user_bearer_v1', token)
      else localStorage.removeItem('rp_user_bearer_v1')
    } catch (e) {
      void e
    }
  }

  const saveUserProfile = (next) => {
    setUserProfile(next)
    try {
      if (next) localStorage.setItem('rp_user_profile_v1', JSON.stringify(next))
      else localStorage.removeItem('rp_user_profile_v1')
    } catch (e) {
      void e
    }
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const initData = typeof tg?.initData === 'string' ? tg.initData.trim() : ''
    if (!initData) return

    const currentPhone = String(userProfile?.phone || '').trim()
    if (currentPhone && !currentPhone.startsWith('tg_')) return
    if (telegramAutoLoginOnceRef.current) return
    telegramAutoLoginOnceRef.current = true

    setProfileLoading(true)
    apiFetch('/api/v1/auth/telegram/webapp/login', { method: 'POST', body: { init_data: initData, role: 'owner' } })
      .then((data) => {
        if (data?.token) saveUserAuthToken(data.token)
        if (data?.user && typeof data.user === 'object') saveUserProfile(data.user)
      })
      .catch((e) => {
        void e
      })
      .finally(() => setProfileLoading(false))
  }, [userProfile])

  const profilePhone = String(userProfile?.phone || '').trim()

  const loadProfile = async (phone) => {
    if (!phone) return null
    setProfileLoading(true)
    try {
      const u = await apiFetch(`/api/v1/users/by-phone?phone=${encodeURIComponent(phone)}`)
      if (u && typeof u === 'object') saveUserProfile(u)
      return u
    } catch (e) {
      void e
      return null
    } finally {
      setProfileLoading(false)
    }
  }

  const loadPets = async (phone) => {
    if (!phone) return []
    setPetsLoading(true)
    try {
      const res = await apiFetch(`/api/v1/pets?phone=${encodeURIComponent(phone)}`)
      const items = Array.isArray(res?.items) ? res.items : []
      setPets(items)
      return items
    } catch (e) {
      void e
      setPets([])
      return []
    } finally {
      setPetsLoading(false)
    }
  }

  const loadOrders = async (phone) => {
    if (!phone) return []
    try {
      const res = await apiFetch(`/api/v1/orders?phone=${encodeURIComponent(phone)}`)
      const items = Array.isArray(res?.items) ? res.items : []
      setBackendOrders(items)
      return items
    } catch (e) {
      void e
      setBackendOrders([])
      return []
    }
  }

  const loadPayments = async (phone) => {
    if (!phone) return []
    setPaymentsLoading(true)
    try {
      const res = await apiFetch(`/api/v1/payments?phone=${encodeURIComponent(phone)}`)
      const items = Array.isArray(res?.items) ? res.items : []
      setPayments(items)
      return items
    } catch (e) {
      void e
      setPayments([])
      return []
    } finally {
      setPaymentsLoading(false)
    }
  }

  const loadOrderDetail = async (orderId) => {
    if (!orderId) return null
    setOrderDetailLoading(true)
    try {
      const detail = await apiFetch(`/api/v1/orders/${encodeURIComponent(orderId)}`)
      setOrderDetail(detail)
      return detail
    } catch (e) {
      void e
      setOrderDetail(null)
      return null
    } finally {
      setOrderDetailLoading(false)
    }
  }

  const loadOrderPayments = async (orderId) => {
    if (!orderId) return []
    try {
      const res = await apiFetch(`/api/v1/payments/order/${encodeURIComponent(orderId)}`)
      const items = Array.isArray(res?.items) ? res.items : []
      setOrderPayments(items)
      return items
    } catch {
      setOrderPayments([])
      return []
    }
  }

  const loadMemorialFavs = async (phone) => {
    if (!phone) return memorialFavIds
    try {
      const res = await apiFetch(`/api/v1/memorial-favorites?phone=${encodeURIComponent(phone)}`)
      const ids = Array.isArray(res?.items) ? res.items.map((x) => Number(x.memorial_id)).filter((x) => Number.isFinite(x)) : []
      setMemorialFavIds(ids)
      try {
        localStorage.setItem('rp_memorial_favs_v1', JSON.stringify(ids))
      } catch (e) {
        void e
      }
      return ids
    } catch {
      return memorialFavIds
    }
  }

  const toggleMemorialFav = async (memorialId) => {
    const idNum = Number(memorialId)
    if (!Number.isFinite(idNum)) return
    const nextHas = !memorialFavIds.includes(idNum)
    const next = nextHas ? [...memorialFavIds, idNum] : memorialFavIds.filter((x) => x !== idNum)
    setMemorialFavIds(next)
    try {
      localStorage.setItem('rp_memorial_favs_v1', JSON.stringify(next))
    } catch (e) {
      void e
    }
    if (!profilePhone) return
    try {
      if (nextHas) {
        await apiFetch('/api/v1/memorial-favorites', { method: 'POST', body: { phone: profilePhone, memorial_id: idNum } })
      } else {
        await apiFetch(`/api/v1/memorial-favorites/${encodeURIComponent(String(idNum))}?phone=${encodeURIComponent(profilePhone)}`, { method: 'DELETE' })
      }
    } catch (e) {
      void e
    }
  }

  useEffect(() => {
    if (!profilePhone) {
      setBackendOrders([])
      setPets([])
      setPayments([])
      return
    }
    loadProfile(profilePhone)
    loadPets(profilePhone)
    loadOrders(profilePhone)
    loadPayments(profilePhone)
    loadMemorialFavs(profilePhone)
  }, [profilePhone])

  const categories = runtimeCategories && Array.isArray(runtimeCategories) && runtimeCategories.length ? runtimeCategories : CATEGORIES

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/v1/marketplace/categories')
      .then((data) => {
        if (cancelled) return
        const items = Array.isArray(data?.items) ? data.items : []
        if (!items.length) return
        const mapped = items.map((it) => ({
          id: String(it.id || '').trim(),
          order: Number(it.order || 0),
          icon: it.icon || '📦',
          labels: it.labels && typeof it.labels === 'object' ? it.labels : null,
          subs: Array.isArray(it.subs) ? it.subs : [],
        })).filter((x) => x.id)
        if (mapped.length) setRuntimeCategories(mapped)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/v1/marketplace/cemetery-layout')
      .then((data) => {
        if (cancelled) return
        if (!data || typeof data !== 'object') return
        const rows = Array.isArray(data.rows) ? data.rows : null
        const cols = Number(data.cols || 0)
        const zones = Array.isArray(data.zones) ? data.zones : null
        const zoneByCol = Array.isArray(data.zone_by_col) ? data.zone_by_col : null
        const sold = Array.isArray(data.sold) ? data.sold : []
        const locked = Array.isArray(data.locked) ? data.locked : []
        const expired = Array.isArray(data.expired) ? data.expired : []
        if (!rows || !cols || !zones || !zoneByCol) return
        setCemeteryLayout({ rows, cols, zones, zoneByCol, sold, locked, expired })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const pickLabel = (labels) => {
    if (!labels || typeof labels !== 'object') return ''
    return labels[lang] || labels.ZH || labels.EN || Object.values(labels)[0] || ''
  }

  const showToast = (nextToast) => {
    setToast(nextToast)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 1600)
  }

  const requestPackageLocation = () => {
    const tg = window.Telegram?.WebApp
    const lm = tg?.LocationManager
    const applyLocation = (loc, source) => {
      const lat = Number(loc?.latitude ?? loc?.lat ?? NaN)
      const lng = Number(loc?.longitude ?? loc?.lng ?? NaN)
      const acc = loc?.accuracy_radius ?? loc?.accuracy ?? null
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        showToast({ title: t('common.failed'), desc: t('aftercare.addr.locFailNoCoords') })
        return
      }
      setPackageAddressDraft((p) => ({
        ...(p || {}),
        location_lat: lat,
        location_lng: lng,
        location_accuracy_m: acc != null ? Number(acc) : null,
        location_source: source || null,
      }))
      apiFetch(`/api/v1/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`)
        .then((res) => {
          const formattedAddress = res?.formatted_address ? String(res.formatted_address) : null
          const displayName = res?.display_name ? String(res.display_name) : null
          const best = formattedAddress || displayName
          if (!best) return
          setPackageAddressDraft((p) => {
            const prev = p || {}
            const hasPickup = Boolean(String(prev.pickup_address || '').trim())
            return {
              ...prev,
              location_display_name: displayName,
              location_formatted_address: formattedAddress,
              pickup_address: hasPickup ? prev.pickup_address : best,
            }
          })
        })
        .catch(() => {})
        .finally(() => showToast({ title: t('common.saved'), desc: '定位已获取' }))
    }

    if (lm && typeof lm.init === 'function') {
      try {
        const handler = (data) => {
          try {
            if (typeof tg?.offEvent === 'function') tg.offEvent('locationRequested', handler)
          } catch (e) {
            void e
          }
          applyLocation(data, 'telegram')
        }
        if (typeof tg?.onEvent === 'function') tg.onEvent('locationRequested', handler)
        lm.init()
        if (typeof lm.requestLocation === 'function') lm.requestLocation()
        else if (typeof lm.getLocation === 'function') lm.getLocation()
        else showToast({ title: t('common.failed'), desc: 'Telegram 定位能力不可用' })
        return
      } catch (e) {
        void e
      }
    }

    if (navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }, 'browser'),
        () => showToast({ title: t('common.failed'), desc: t('aftercare.addr.locFailNoPerm') }),
        { enableHighAccuracy: true, timeout: 10000 }
      )
      return
    }

    showToast({ title: t('common.failed'), desc: '当前环境不支持定位' })
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const handleProductClick = (p) => setSelectedProduct(p)
  const handleMerchantClick = (mid) => setSelectedMerchant(merchants.find((m) => m.id === mid))
  const handleCategoryClick = (cid) => {
    setSelectedCategory(cid)
    setActiveTab('shop')
  }

  const cartCount = cartItems.reduce((sum, it) => sum + it.quantity, 0)

  const closeOverlays = () => {
    setPage(null)
    setPaidOrder(null)
  }

  const openSearch = () => {
    setSearchQuery('')
    setPage('search')
  }

  const openCart = () => {
    setPage('cart')
  }

  const openLang = (returnPage) => {
    setLangReturnPage(returnPage || null)
    setPage('lang')
  }

  const defaultCemeteryLayout = {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    cols: 10,
    zones: [
      {
        id: 'basic',
        type: 'basic',
        order: 1,
        enabled: true,
        color: 'emerald',
        labels: { ZH: '普通区', EN: 'Basic Zone' },
        description: '室内普通墙面，密集排布，价格友好',
        image_url: null,
        price_product_id: 481,
        annual_fee_product_id: 9201,
      },
      {
        id: 'garden',
        type: 'garden',
        order: 2,
        enabled: true,
        color: 'amber',
        labels: { ZH: '景观区', EN: 'Garden Zone' },
        description: '花园/绿植区域，环境更好，价格适中',
        image_url: null,
        price_product_id: 482,
        annual_fee_product_id: 9202,
      },
      {
        id: 'vip',
        type: 'vip',
        order: 3,
        enabled: true,
        color: 'indigo',
        labels: { ZH: 'VIP区', EN: 'Premium Zone' },
        description: '独立纪念空间，私密高端，高溢价',
        image_url: null,
        price_product_id: 483,
        annual_fee_product_id: 9203,
      },
    ],
    zoneByCol: ['basic', 'basic', 'basic', 'garden', 'garden', 'garden', 'garden', 'vip', 'vip', 'vip'],
    sold: ['A1', 'A2', 'B1', 'D10', 'E10', 'H9'],
    locked: ['C7', 'F6'],
    expired: [],
  }

  const cemeteryCfg = cemeteryLayout || defaultCemeteryLayout
  const cemeteryRows = cemeteryCfg.rows
  const cemeteryCols = Array.from({ length: cemeteryCfg.cols }, (_, i) => i + 1)
  const cemeterySold = new Set(cemeteryCfg.sold || [])
  const cemeteryLocked = new Set(cemeteryCfg.locked || [])
  const cemeteryExpired = new Set(cemeteryCfg.expired || [])

  const zoneColorClass = (color) => {
    if (color === 'amber') return 'bg-amber-400'
    if (color === 'emerald') return 'bg-emerald-400'
    if (color === 'sky') return 'bg-sky-400'
    if (color === 'indigo') return 'bg-indigo-400'
    if (color === 'rose') return 'bg-rose-400'
    return 'bg-gray-300'
  }

  const cemeteryZones = (Array.isArray(cemeteryCfg.zones) ? cemeteryCfg.zones : defaultCemeteryLayout.zones)
    .filter((z) => z && z.enabled !== false)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((z) => ({
      id: String(z.id || ''),
      type: String(z.type || z.id || ''),
      label: pickLabel(z.labels) || String(z.id || ''),
      colorClass: zoneColorClass(String(z.color || '')),
      productId: Number(z.price_product_id || 0),
      annualProductId: Number(z.annual_fee_product_id || 0) || null,
      description: z.description ? String(z.description) : '',
      imageUrl: z.image_url ? String(z.image_url) : '',
    }))
    .filter((z) => z.id && z.productId)

  const resolveCemeteryZone = (col) => {
    const map = cemeteryCfg.zoneByCol || defaultCemeteryLayout.zoneByCol
    const val = map[col - 1]
    return val || map[map.length - 1] || 'basic'
  }

  const CemeteryDetailPage = () => {
    const readReserved = () => {
      try {
        const raw = localStorage.getItem('rp_cemetery_reserved_v1')
        const parsed = raw ? JSON.parse(raw) : null
        if (!parsed || typeof parsed !== 'object') return {}
        return parsed
      } catch {
        return {}
      }
    }

    const writeReserved = (next) => {
      try {
        localStorage.setItem('rp_cemetery_reserved_v1', JSON.stringify(next || {}))
      } catch (e) {
        void e
      }
    }

    const normalizeReserved = (obj) => {
      const now = Date.now()
      const next = {}
      if (!obj || typeof obj !== 'object') return next
      Object.keys(obj).forEach((k) => {
        const exp = Number(obj[k] || 0)
        if (exp > now) next[k] = exp
      })
      return next
    }

    const [step, setStep] = useState('landing')
    const [zoneId, setZoneId] = useState(cemeteryZones[0]?.id || 'basic')
    const [selectedCell, setSelectedCell] = useState(null)
    const [petName, setPetName] = useState('')
    const [petType, setPetType] = useState('')
    const [reserved, setReserved] = useState(() => normalizeReserved(readReserved()))

    useEffect(() => {
      const next = normalizeReserved(readReserved())
      setReserved(next)
      writeReserved(next)
    }, [])

    const currentZone = cemeteryZones.find((z) => z.id === zoneId) || cemeteryZones[0] || null
    const purchaseProduct = currentZone ? products.find((p) => p.id === currentZone.productId) : null
    const fallbackAnnualId =
      zoneId === 'basic' || zoneId === 'A' ? 9201 : zoneId === 'garden' || zoneId === 'B' ? 9202 : zoneId === 'vip' || zoneId === 'C' ? 9203 : 9201
    const annualProductId = Number(currentZone?.annualProductId || 0) || fallbackAnnualId
    const annualProduct = products.find((p) => p.id === annualProductId) || null

    const zonePrefix = (id) => {
      if (id === 'basic') return 'A'
      if (id === 'garden') return 'B'
      if (id === 'vip') return 'C'
      return String(id || 'Z').slice(0, 1).toUpperCase()
    }

    const slotIdOf = (row, col, zid) => {
      const rowIdx = Math.max(1, cemeteryRows.indexOf(row) + 1)
      return `${zonePrefix(zid)}-${String(rowIdx).padStart(2, '0')}-${String(col).padStart(2, '0')}`
    }

    const selected = selectedCell ? { ...selectedCell, code: `${selectedCell.row}${selectedCell.col}` } : null
    const selectedSlotId = selected ? slotIdOf(selected.row, selected.col, zoneId) : null

    const Landing = () => (
      <div className="p-4">
        <div className="rp-card p-5 mb-4 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white overflow-hidden relative">
          <div className="absolute right-[-30px] top-[-30px] opacity-20">
            <MapPin size={140} />
          </div>
          <div className="text-lg font-black mb-1">{t('cemetery.landingTitle')}</div>
          <div className="text-xs opacity-90 leading-relaxed">{t('cemetery.landingDesc')}</div>
          <button
            type="button"
            className="mt-4 bg-white text-emerald-700 px-4 py-2 rounded-full text-xs font-black border-0 active:scale-95 transition-transform"
            onClick={() => setStep('zones')}
          >
            {t('cemetery.chooseSpot')}
          </button>
        </div>

        <div className="rp-card p-4">
          <div className="text-xs font-bold text-gray-500 mb-3">{t('cemetery.zonesTitle')}</div>
          <div className="grid grid-cols-1 gap-3">
            {cemeteryZones.map((z) => {
              const buy = products.find((p) => p.id === z.productId)
              const annual = z.annualProductId ? products.find((p) => p.id === z.annualProductId) : null
              return (
                <div
                  key={z.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3 active:opacity-80 cursor-pointer"
                  onClick={() => {
                    setZoneId(z.id)
                    setStep('layout')
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-black text-gray-900 truncate">{z.label}</div>
                    <div className="text-[10px] text-gray-500 truncate">{z.description}</div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {t('cemetery.purchase')}: ${Number(buy?.price || 0).toFixed(0)} · {t('cemetery.annual')}: ${Number(annual?.price || 0).toFixed(0)}/y
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              )
            })}
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold text-gray-500 mb-2">{t('cemetery.zoneShowcase')}</div>
            <div className="grid grid-cols-3 gap-2">
              {cemeteryZones.map((z) => {
                const img =
                  z.imageUrl ||
                  (z.type === 'garden'
                    ? 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=600&auto=format&fit=crop'
                    : z.type === 'vip'
                      ? 'https://images.unsplash.com/photo-1520962922320-2038eebab146?q=80&w=600&auto=format&fit=crop'
                      : 'https://images.unsplash.com/photo-1523510468197-455cc987be86?q=80&w=600&auto=format&fit=crop')
                return (
                  <div
                    key={z.id}
                    className="rounded-2xl overflow-hidden border border-gray-200 bg-white cursor-pointer active:opacity-80"
                    onClick={() => {
                      setZoneId(z.id)
                      setStep('layout')
                    }}
                  >
                    <div className="relative w-full h-16">
                      <SafeImage src={img} alt={z.label} className="w-full h-16 object-cover" />
                      <div className="absolute inset-0 bg-black/25" />
                      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${z.colorClass}`} />
                        <span className="text-[10px] font-black text-white truncate">{z.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )

    const ZoneSelection = () => (
      <div className="p-4">
        <div className="rp-card p-4 mb-4">
          <div className="text-sm font-black text-gray-900 mb-1">{t('cemetery.zonesTitle')}</div>
          <div className="text-[10px] text-gray-500">{t('cemetery.zonesTip')}</div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {cemeteryZones.map((z) => {
            const buy = products.find((p) => p.id === z.productId)
            const annual = z.annualProductId ? products.find((p) => p.id === z.annualProductId) : null
            const active = zoneId === z.id
            return (
              <div
                key={z.id}
                className={`rp-card p-4 flex items-center justify-between gap-3 cursor-pointer ${active ? 'border-indigo-200 bg-indigo-50/20' : ''}`}
                onClick={() => {
                  setZoneId(z.id)
                  setSelectedCell(null)
                  setStep('layout')
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${z.colorClass}`} />
                    <div className="text-sm font-black text-gray-900 truncate">{z.label}</div>
                  </div>
                  <div className="text-[10px] text-gray-500 truncate mt-1">{z.description}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {t('cemetery.purchase')}: ${Number(buy?.price || 0).toFixed(0)} · {t('cemetery.annual')}: ${Number(annual?.price || 0).toFixed(0)}/y
                  </div>
                </div>
                <button type="button" className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-[11px] font-black border-0 active:scale-95 transition-transform">
                  {t('cemetery.viewLayout')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )

    const Layout = () => (
      <div className="p-4 pb-28">
        <div className="rp-card p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black text-gray-900 truncate">{currentZone?.label || t('cemetery.zonesTitle')}</div>
              <div className="text-[10px] text-gray-500 truncate">{currentZone?.description || t('cemetery.selectTip')}</div>
            </div>
            <button
              type="button"
              className="rp-btn-soft px-3 py-2 rounded-xl text-xs font-black border-0"
              onClick={() => setStep('zones')}
            >
              {t('cemetery.switchZone')}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
              <span className="text-[10px] text-gray-500">{t('cemetery.legend.available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
              <span className="text-[10px] text-gray-500">{t('cemetery.legend.sold')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 border-dashed" />
              <span className="text-[10px] text-gray-500">{t('cemetery.legend.locked')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-50 border border-red-300 border-dashed" />
              <span className="text-[10px] text-gray-500">{t('cemetery.legend.expired')}</span>
            </div>
          </div>
        </div>

        <div className="rp-card p-4 mb-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cemeteryCols.length + 1}, minmax(0, 1fr))` }}>
            <div />
            {cemeteryCols.map((c) => (
              <div key={c} className="text-[9px] text-gray-400 text-center">{c}</div>
            ))}
            {cemeteryRows.map((r) => (
              <React.Fragment key={r}>
                <div className="text-[9px] text-gray-400 flex items-center justify-center">{r}</div>
                {cemeteryCols.map((c) => {
                  const code = `${r}${c}`
                  const cellZone = resolveCemeteryZone(c)
                  const outOfZone = cellZone !== zoneId
                  const expTs = Number(reserved?.[code] || 0)
                  const isSoldCell = cemeterySold.has(code)
                  const isExpiredCell = cemeteryExpired.has(code)
                  const isReservedCell = !isSoldCell && !isExpiredCell && (cemeteryLocked.has(code) || expTs > Date.now())
                  const selectedNow = selectedCell && selectedCell.row === r && selectedCell.col === c
                  const disabled = outOfZone || isSoldCell || isReservedCell || isExpiredCell
                  const className = isSoldCell
                    ? 'bg-gray-200 border-gray-300 opacity-80 cursor-not-allowed'
                    : isReservedCell
                      ? 'bg-yellow-100 border-yellow-300 border-dashed opacity-90 cursor-not-allowed'
                      : isExpiredCell
                        ? 'bg-red-50 border-red-300 border-dashed opacity-90 cursor-not-allowed'
                        : outOfZone
                          ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                          : 'bg-emerald-100 border-emerald-200 cursor-pointer active:scale-95 transition-transform'
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={disabled}
                      className={`h-7 rounded-md border ${className} ${selectedNow ? 'ring-2 ring-indigo-500' : ''}`}
                      onClick={() => {
                        if (disabled) return
                        setSelectedCell({ row: r, col: c })
                      }}
                    />
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="rp-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-500">{t('cemetery.slotDetail')}</div>
            <div className="text-[10px] font-mono text-gray-500">{selectedSlotId || '-'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-500">{t('cemetery.purchase')}</div>
              <div className="text-base font-black text-gray-900">${Number(purchaseProduct?.price || 0).toFixed(0)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-500">{t('cemetery.annual')}</div>
              <div className="text-base font-black text-gray-900">${Number(annualProduct?.price || 0).toFixed(0)}/y</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">{t('cemetery.petName')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder={t('cemetery.petNamePlaceholder')}
              />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">{t('cemetery.petType')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
                placeholder={t('cemetery.petTypePlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 pb-safe max-w-md mx-auto z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500">{t('cemetery.totalToday')}</div>
              <div className="text-lg font-black text-gray-900">
                ${Number((purchaseProduct?.price || 0) + (annualProduct?.price || 0)).toFixed(2)}
              </div>
            </div>
            <button
              type="button"
              disabled={!selected || cemeteryLocked.has(selected.code) || cemeterySold.has(selected.code) || cemeteryExpired.has(selected.code)}
              className={`rp-btn-soft px-4 py-3 rounded-xl text-sm font-black border-0 ${selected ? '' : 'opacity-60'}`}
              onClick={() => {
                if (!selected) return
                const next = normalizeReserved({ ...reserved, [selected.code]: Date.now() + 24 * 60 * 60 * 1000 })
                setReserved(next)
                writeReserved(next)
                showToast({ title: t('cemetery.reserveOkTitle'), desc: t('cemetery.reserveOkDesc') })
              }}
            >
              {t('cemetery.reserve')}
            </button>
            <button
              type="button"
              disabled={!selected || !purchaseProduct || !annualProduct}
              className={`rp-btn-primary px-5 py-3 rounded-xl text-sm font-black border-0 ${selected ? '' : 'opacity-60'}`}
              onClick={() => {
                if (!selected || !purchaseProduct || !annualProduct) return
                startPay({
                  title: `${t('cemetery.orderTitle')} · ${currentZone?.label || ''} · ${selectedSlotId}`,
                  items: [{ productId: purchaseProduct.id, quantity: 1 }, { productId: annualProduct.id, quantity: 1 }],
                  source: 'buy_now',
                  meta: {
                    kind: 'cemetery_purchase',
                    zoneId,
                    zoneLabel: currentZone?.label || zoneId,
                    code: selected.code,
                    slotId: selectedSlotId,
                    petName: petName.trim() || null,
                    petType: petType.trim() || null,
                    purchaseProductId: purchaseProduct.id,
                    annualProductId: annualProduct.id,
                  },
                })
              }}
            >
              {t('cemetery.buyNow')}
            </button>
          </div>
        </div>
      </div>
    )

    return (
      <div className="rp-page-bg min-h-screen pb-24">
        <Header
          title={t('catSub.services.1')}
          showBack
          onBack={() => setPage(null)}
          onSearch={openSearch}
          onCart={openCart}
          cartCount={cartCount}
        />
        {step === 'landing' ? <Landing /> : step === 'zones' ? <ZoneSelection /> : <Layout />}
      </div>
    )
  }

  const FuneralBundlePage = () => {
    const [buying, setBuying] = useState(false)
    const packages = [
      {
        productId: 9711,
        title: '基础告别套餐',
        price: '$399',
        desc: '适合小型宠物，集体羽化，环保不留灰。',
        includes: ['免费上门接宠 (5km内)', '专业仪容整理', '集体羽化', '电子纪念证书'],
        excludes: ['骨灰保留', '独立告别厅', '定制纪念品'],
      },
      {
        productId: 9712,
        title: '标准纪念套餐',
        price: '$899',
        desc: '独立羽化，可留存骨灰，包含精美环保骨灰盒。',
        includes: ['专车接宠 (10km内)', '独立羽化仪式', '基础骨灰盒', '骨灰送回/寄存30天', '告别视频片段'],
        excludes: ['定制骨灰盒', '线下告别厅使用'],
      },
      {
        productId: 9713,
        title: '尊享送别套餐',
        price: '$1599',
        desc: '沉浸式告别仪式，高端定制纪念品，全程专属客服。',
        includes: ['24H优先专车接宠', '线下独立告别厅 (1小时)', '高级定制木质骨灰盒', '爪印泥/毛发纪念品', '全程影像记录'],
        excludes: [],
      },
    ]
    const flow = [
      { title: '提交预约与报价确认', desc: '系统生成准确报价，绝无额外隐形消费。' },
      { title: '专员上门接宠', desc: '按约定时间抵达，提供遗体清理与打包。' },
      { title: '告别与羽化处理', desc: '根据套餐提供告别仪式及环保羽化。' },
      { title: '纪念品交付', desc: '骨灰及纪念品专车送回或快递寄出。' },
    ]

    return (
      <div className="rp-page-bg min-h-screen pb-28">
        <Header title={t('bundle.title')} showBack onBack={() => setPage(null)} onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
        <div className="p-4">
          <div className="rp-card p-4 mb-4">
            <div className="text-sm font-black text-gray-900 mb-1">{t('bundle.subtitle')}</div>
            <div className="text-[10px] text-gray-500">{t('bundle.tip')}</div>
          </div>

          <div className="space-y-3">
            {packages.map((p) => (
              <div key={p.productId} className="rp-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-black text-gray-900 truncate">{p.title}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{p.desc}</div>
                  </div>
                  <div className="text-lg font-black text-gray-900 flex-shrink-0">{p.price}</div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">套餐包含项</div>
                    <div className="space-y-1">
                      {p.includes.map((x) => (
                        <div key={x} className="text-xs text-gray-700">
                          · {x}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-gray-600 mb-2">不包含项</div>
                    <div className="space-y-1">
                      {(p.excludes.length ? p.excludes : ['无']).map((x) => (
                        <div key={x} className="text-xs text-gray-700">
                          · {x}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className={`rp-btn-primary w-full mt-4 px-5 py-3 rounded-xl text-sm font-bold border-0 ${buying ? 'opacity-70' : ''}`}
                  type="button"
                  disabled={buying}
                  onClick={() => {
                    if (buying) return
                    setBuying(true)
                    setPackageCheckoutDraft({ productId: p.productId, title: p.title })
                    setPackageAddressDraft((prev) => {
                      const next = { ...(prev || {}) }
                      if (!String(next.contact_name || '').trim()) next.contact_name = String(userProfile?.name || '').trim()
                      if (!String(next.contact_phone || '').trim()) next.contact_phone = String(userProfile?.phone || '').trim()
                      return next
                    })
                    setTimeout(() => setPage('package_address'), 0)
                  }}
                >
                  立即购买
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 rp-card p-4">
            <div className="text-xs font-bold text-gray-600 mb-2">标准服务流程</div>
            <div className="space-y-2">
              {flow.map((s, idx) => (
                <div key={s.title} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-gray-900">{s.title}</div>
                    <div className="text-[10px] text-gray-500">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const AftercareCeremonyPage = () => {
    const packages = [9301, 9302, 9303, 9304].map((id) => products.find((p) => p.id === id)).filter(Boolean)
    const upsells = [9401, 9402, 9403].map((id) => products.find((p) => p.id === id)).filter(Boolean)
    const [pkgId, setPkgId] = useState(packages[1]?.id || packages[0]?.id || 9302)
    const [pickupTier, setPickupTier] = useState('0_5')
    const [weightBand, setWeightBand] = useState('5–15kg')
    const [selectedUpsells, setSelectedUpsells] = useState(() => new Set())

    const [customerName, setCustomerName] = useState(() => String(userProfile?.name || ''))
    const [phone, setPhone] = useState(() => String(userProfile?.phone || ''))
    const [city, setCity] = useState('Phnom Penh')
    const [pickupAddress, setPickupAddress] = useState('')
    const [timeWindow, setTimeWindow] = useState('')
    const [petName, setPetName] = useState('')
    const [petType, setPetType] = useState('Dog')
    const [selectedPetId, setSelectedPetId] = useState('')
    const [note, setNote] = useState('')

    const pkg = packages.find((p) => p.id === pkgId) || packages[0] || null
    const servicePackage = pkgId === 9301 ? 'basic' : pkgId === 9302 ? 'standard' : pkgId === 9303 ? 'premium' : 'ceremony'

    const pickupFeeProductId = pickupTier === '0_5' ? 9501 : pickupTier === '5_10' ? 9502 : 9503
    const pickupFee = products.find((p) => p.id === pickupFeeProductId) || null

    const weightFeeProductId = weightBand === '<5kg' ? null : weightBand === '5–15kg' ? 9601 : weightBand === '15–30kg' ? 9602 : 9603
    const weightFee = weightFeeProductId ? products.find((p) => p.id === weightFeeProductId) : null

    const itemIds = [
      pkg?.id,
      pickupFee?.id,
      weightFee?.id,
      ...Array.from(selectedUpsells),
    ].filter(Boolean)

    const items = itemIds.map((id) => ({ productId: id, quantity: 1 }))
    const total = items.reduce((sum, it) => {
      const p = products.find((x) => x.id === it.productId)
      return sum + (p ? p.price : 0) * it.quantity
    }, 0)

    const canPay = Boolean(phone.trim() && city.trim() && pickupAddress.trim() && timeWindow.trim() && petType.trim() && weightBand.trim() && pkg)

    return (
      <div className="rp-page-bg min-h-screen pb-28">
        <Header title={t('aftercare.title')} showBack onBack={() => setPage(null)} onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
        <div className="p-4">
          <div className="rp-card p-4 mb-4">
            <div className="text-sm font-black text-gray-900 mb-1">{t('aftercare.subtitle')}</div>
            <div className="text-[10px] text-gray-500">{t('aftercare.tip')}</div>
          </div>

          <div className="rp-card p-4 mb-4">
            <div className="text-xs font-bold text-gray-500 mb-3">{t('aftercare.packages')}</div>
            <div className="space-y-2">
              {packages.map((p) => {
                const checked = pkgId === p.id
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${checked ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}
                    onClick={() => setPkgId(p.id)}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-gray-900 truncate">{p.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{p.description}</div>
                    </div>
                    <div className="text-sm font-black text-gray-900">${Number(p.price || 0).toFixed(0)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rp-card p-4 mb-4">
            <div className="text-xs font-bold text-gray-500 mb-3">{t('aftercare.fees')}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.pickupFee')}</div>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={pickupTier}
                  onChange={(e) => setPickupTier(e.target.value)}
                >
                  <option value="0_5">{t('aftercare.pickup0_5')}</option>
                  <option value="5_10">{t('aftercare.pickup5_10')}</option>
                  <option value="10p">{t('aftercare.pickup10p')}</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.weightBand')}</div>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={weightBand}
                  onChange={(e) => setWeightBand(e.target.value)}
                >
                  <option value="<5kg">{t('aftercare.w0_5')}</option>
                  <option value="5–15kg">{t('aftercare.w5_15')}</option>
                  <option value="15–30kg">{t('aftercare.w15_30')}</option>
                  <option value="30kg+">{t('aftercare.w30p')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rp-card p-4 mb-4">
            <div className="text-xs font-bold text-gray-500 mb-3">{t('aftercare.upsells')}</div>
            <div className="space-y-2">
              {upsells.map((p) => {
                const checked = selectedUpsells.has(p.id)
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${checked ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}
                    onClick={() =>
                      setSelectedUpsells((prev) => {
                        const next = new Set(prev)
                        if (next.has(p.id)) next.delete(p.id)
                        else next.add(p.id)
                        return next
                      })
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                        {checked ? <CheckCircle2 size={14} className="text-white" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{p.description}</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-gray-900">${Number(p.price || 0).toFixed(0)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rp-card p-4">
            <div className="text-xs font-bold text-gray-500 mb-3">{t('aftercare.form')}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.customerName')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('aftercare.customerNamePh')}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.phone')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('aftercare.phonePh')}
                />
              </div>
              <div className="col-span-2">
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.city')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.address')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder={t('aftercare.addressPh')}
                />
              </div>
              <div className="col-span-2">
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.timeWindow')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  placeholder={t('aftercare.timeWindowPh')}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.petName')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder={t('aftercare.petNamePh')}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.petType')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={petType}
                  onChange={(e) => setPetType(e.target.value)}
                  placeholder={t('aftercare.petTypePh')}
                />
              </div>
              {Array.isArray(pets) && pets.length ? (
                <div className="col-span-2">
                  <div className="text-[10px] font-bold text-gray-500 mb-1">{t('pets.select')}</div>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                    value={selectedPetId}
                    onChange={(e) => {
                      const id = e.target.value
                      setSelectedPetId(id)
                      const p = pets.find((x) => String(x.id) === String(id))
                      if (!p) return
                      setPetName(String(p.pet_name || ''))
                      setPetType(String(p.pet_type || 'Dog'))
                      const w = String(p.pet_weight || '').trim()
                      if (w === '<5kg' || w === '5–15kg' || w === '15–30kg' || w === '30kg+') setWeightBand(w)
                    }}
                  >
                    <option value="">{t('pets.selectPh')}</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {String(p.pet_name || t('pets.noName'))} · {String(p.pet_type || '')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="col-span-2">
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('aftercare.note')}</div>
                <textarea
                  className="w-full min-h-[90px] border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('aftercare.notePh')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 pb-safe max-w-md mx-auto z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-500">{t('aftercare.total')}</div>
              <div className="text-lg font-black text-gray-900">${total.toFixed(2)}</div>
            </div>
            <button
              type="button"
              disabled={!canPay}
              className={`rp-btn-primary px-5 py-3 rounded-xl text-sm font-black border-0 ${canPay ? '' : 'opacity-60'}`}
              onClick={() => {
                if (!canPay) return
                const addons = []
                if (pickupFee) addons.push({ code: pickupTier === '0_5' ? 'pickup_fee_0_5km' : pickupTier === '5_10' ? 'pickup_fee_5_10km' : 'pickup_fee_10km_plus', item_type: 'service', title: pickupFee.name, unit_price_cents: Math.round(pickupFee.price * 100), quantity: 1 })
                if (weightFee) addons.push({ code: weightBand === '5–15kg' ? 'weight_fee_5_15kg' : weightBand === '15–30kg' ? 'weight_fee_15_30kg' : 'weight_fee_30kg_plus', item_type: 'service', title: weightFee.name, unit_price_cents: Math.round(weightFee.price * 100), quantity: 1 })
                Array.from(selectedUpsells).forEach((id) => {
                  const p = products.find((x) => x.id === id)
                  if (!p) return
                  addons.push({ code: `upsell_${id}`, item_type: 'product', title: p.name, unit_price_cents: Math.round(p.price * 100), quantity: 1 })
                })

                const intakePayload = {
                  source: { lead_source: 'other', conversation_channel: 'web', quote_version: 'RP-AF-PRICE-V2' },
                  customer: { name: customerName.trim() || null, phone: phone.trim(), language: lang },
                  location: { city: city.trim(), pickup_address: pickupAddress.trim(), pickup_lat: null, pickup_lng: null },
                  schedule: { time_window: timeWindow.trim() },
                  pet: { name: petName.trim() || null, type: petType.trim(), weight_band: weightBand, weight_kg: null },
                  service: { service_package: servicePackage, addons },
                  pricing: {
                    currency: 'USD',
                    pickup_fee_cents: pickupFee ? Math.round(pickupFee.price * 100) : 0,
                    weight_fee_cents: weightFee ? Math.round(weightFee.price * 100) : 0,
                    discount_cents: 0,
                    total_amount_cents: Math.round(total * 100),
                  },
                  note: note.trim() || null,
                }

                startPay({
                  title: `${t('aftercare.orderTitle')} · ${pkg?.name || ''}`,
                  items,
                  source: 'buy_now',
                  meta: { kind: 'aftercare_intake', intakePayload },
                })
              }}
            >
              {t('aftercare.pay')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const addToCart = (productId, quantity = 1) => {
    setCartItems((prev) => {
      const next = [...prev]
      const idx = next.findIndex((x) => x.productId === productId)
      if (idx >= 0) {
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
        return next
      }
      next.push({ productId, quantity })
      return next
    })
  }

  const setCartQuantity = (productId, quantity) => {
    setCartItems((prev) => prev.map((x) => (x.productId === productId ? { ...x, quantity: Math.max(1, quantity) } : x)))
  }

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((x) => x.productId !== productId))
  }

  const applyCheckoutEffects = (nextCheckout) => {
    const meta = nextCheckout?.meta
    if (!meta || typeof meta !== 'object') return
    if (meta.kind === 'memorial_offer') {
      const memorialId = Number(meta.memorialId || 0)
      const effect = String(meta.effect || '')
      const qty = Math.max(1, Number(meta.qty || 1))
      setMemorials((prev) =>
        prev.map((m) => {
          if (Number(m.id) !== memorialId) return m
          if (effect === 'candle') return { ...m, candles: Number(m.candles || 0) + qty }
          if (effect === 'flower') return { ...m, flowers: Number(m.flowers || 0) + qty }
          return m
        })
      )
      return
    }
    if (meta.kind === 'memorial_upgrade') {
      const memorialId = Number(meta.memorialId || 0)
      setMemorials((prev) => prev.map((m) => (Number(m.id) === memorialId ? { ...m, upgraded: true } : m)))
      return
    }
    if (meta.kind === 'cemetery_purchase') {
      const code = String(meta.code || '').trim()
      if (code) {
        setCemeteryLayout((prev) => {
          const base = prev || defaultCemeteryLayout
          const sold = Array.isArray(base.sold) ? base.sold : []
          const locked = Array.isArray(base.locked) ? base.locked : []
          const nextSold = sold.includes(code) ? sold : [code, ...sold]
          const nextLocked = locked.filter((x) => String(x) !== code)
          return { ...base, sold: nextSold, locked: nextLocked }
        })
      }

      const createdAt = new Date().toLocaleDateString()
      const id = Date.now()
      const name = meta.petName ? String(meta.petName) : 'TA'
      const type = meta.petType ? String(meta.petType) : ''
      const zoneLabel = meta.zoneLabel ? String(meta.zoneLabel) : ''
      const slotId = meta.slotId ? String(meta.slotId) : ''
      setMemorials((prev) => [
        {
          id,
          name,
          type,
          date: createdAt,
          message: zoneLabel && slotId ? `安放位置：${zoneLabel} · ${slotId}` : '我们会一直记得你。',
          flowers: 0,
          candles: 0,
          messages: [],
          photos: [],
          upgraded: false,
        },
        ...prev,
      ])
      setPostPayMemorialId(id)
    }
  }

  useEffect(() => {
    if (page !== 'pay_pending') return
    const displayId = String(pendingPayment?.display_id || '').trim()
    if (!displayId) return
    let cancelled = false
    const tick = async () => {
      try {
        const r = await apiFetch(`/payments/${encodeURIComponent(displayId)}`)
        const st = String(r?.data?.payment?.status || 'pending')
        if (cancelled) return
        setPendingPaymentStatus(st)
        if (st === 'confirmed') {
          const order = pendingPayment?.order
          if (order) {
            const paid = { ...order, status: 'paid' }
            setOrders((prev) => prev.map((o) => (String(o.id) === String(order.id) ? paid : o)))
            setPaidOrder(paid)
          }
          if (pendingPayment?.checkout) {
            applyCheckoutEffects(pendingPayment.checkout)
            if (pendingPayment.checkout.source === 'cart') setCartItems([])
          }
          setCheckoutStep(null)
          setCheckout(null)
          setPendingPayment(null)
          setPage('pay_success')
        }
      } catch {
        if (cancelled) return
        setPendingPaymentStatus('pending')
      }
    }
    tick()
    const h = setInterval(tick, 3000)
    return () => {
      cancelled = true
      clearInterval(h)
    }
  }, [page, pendingPayment?.display_id])

  const startPay = ({ title, items, source, meta }) => {
    if (checkoutStep === 'pay') return
    const total = items.reduce((sum, it) => {
      const p = products.find((x) => x.id === it.productId)
      return sum + (p ? p.price : 0) * it.quantity
    }, 0)
    setCheckout({ title, items, total, source, meta: meta || null })
    setCheckoutStep('pay')
    setSelectedProduct(null)
    setSelectedMerchant(null)
    setPage(null)
  }

  const HomeTab = () => (
    <div className="pb-20 rp-page-bg">
      <Header title="RainbowPaw" onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
      <div className="p-4">
        <div className="mb-4">
          <p className="rp-sub text-sm mb-3">{t('home.brandLine')}</p>
          <p className="rp-sub text-xs leading-relaxed">{t('home.brandDesc')}</p>
          <button
            className="rp-btn-primary mt-4 px-4 py-2 rounded-full text-xs font-bold border-0 active:scale-95 transition-transform"
            onClick={() => {
              const service = products.find((p) => p.category === 'services') || products[0]
              setSelectedProduct(service)
            }}
            type="button"
          >
            {t('home.bookService')}
          </button>
        </div>
        <div className="px-4 py-2 bg-orange-50 rounded-xl flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600 flex items-center justify-center flex-shrink-0">
              <FlameKindling size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-orange-900 leading-tight">{t('home.memorialTitle')}</h4>
              <p className="text-[10px] text-orange-700 leading-tight truncate">{t('home.memorialDesc')}</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('memorial')} className="bg-orange-600 text-white text-[10px] px-3 py-1 rounded-full border-0 active:scale-95 transition-transform" type="button">
            {t('home.memorialEnter')}
          </button>
        </div>
        <div className="rp-card bg-gradient-to-r from-indigo-500 to-purple-500 h-36 flex flex-col items-start justify-center p-6 text-white text-left relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
            <Heart size={120} />
          </div>
          <h2 className="text-xl font-bold mb-1">{t('home.heroTitle')}</h2>
          <p className="text-sm opacity-90 mb-4">{t('home.heroDesc')}</p>
          <button
            className="bg-white text-indigo-600 px-4 py-2 rounded-full text-xs font-bold w-max shadow-lg border-0 active:scale-95 transition-transform"
            onClick={() => setActiveTab('shop')}
            type="button"
          >
            {t('home.heroExplore')}
          </button>
        </div>
      </div>
      <div className="flex justify-between px-6 py-4 overflow-x-auto no-scrollbar gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-col items-center flex-shrink-0 active:opacity-60" onClick={() => handleCategoryClick(cat.id)}>
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-1 shadow-sm">{cat.icon}</div>
            <span className="text-[11px] text-gray-600">{cat.labels ? pickLabel(cat.labels) : t(cat.nameKey)}</span>
          </div>
        ))}
      </div>
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 border-l-4 border-indigo-500 pl-2">{t('home.hotTitle')}</h3>
          <span className="text-xs text-gray-400 flex items-center" onClick={() => setActiveTab('shop')}>{t('common.all')} <ChevronRight size={14} /></span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} onClick={handleProductClick} onMerchantClick={handleMerchantClick} t={t} />
          ))}
        </div>
      </div>
    </div>
  )

  const ShopTab = ({ onProductClick, onMerchantClick, initialCategory }) => {
    const [currentCat, setCurrentCat] = useState(initialCategory || categories[0]?.id || 'services')
    const [serviceSub, setServiceSub] = useState(null)
    useEffect(() => {
      if (initialCategory) setCurrentCat(initialCategory)
    }, [initialCategory])
    useEffect(() => {
      setServiceSub(null)
    }, [currentCat])
    useEffect(() => {
      if (!categories.find((c) => c.id === currentCat)) {
        setCurrentCat(categories[0]?.id || 'services')
      }
    }, [categories, currentCat])
    const categoryData = categories.find((c) => c.id === currentCat) || categories[0] || CATEGORIES[0]
    const fallbackCategoryData = CATEGORIES.find((c) => c.id === categoryData.id) || CATEGORIES[0]
    const categoryTitleText = categoryData.labels ? pickLabel(categoryData.labels) : t(categoryData.nameKey)
    const categorySubItems = Array.isArray(categoryData.subs) && categoryData.subs.length
      ? categoryData.subs.map((s) => ({ id: s.id, label: pickLabel(s.labels) || String(s.id || '') }))
      : (categoryData.subKeys || fallbackCategoryData.subKeys || []).map((k, idx) => ({ id: String(idx), label: t(k) }))
    const isServices = currentCat === 'services'
    const filteredProducts = products.filter((p) => p.category === currentCat)
    const serviceProducts = isServices ? products.filter((p) => p.category === 'services' && (!serviceSub || p.serviceSubId === serviceSub)) : []

    const serviceSubTitleKey =
      serviceSub === 'ceremony' ? 'catSub.services.0' : serviceSub === 'cemetery' ? 'catSub.services.1' : serviceSub === 'grief' ? 'catSub.services.2' : null

    const headerTitle = isServices && serviceSubTitleKey ? t(serviceSubTitleKey) : t('shop.title')
    return (
      <div className="pb-20 h-screen flex flex-col rp-page-bg">
        <Header
          title={headerTitle}
          showBack={Boolean(isServices && serviceSub)}
          onBack={() => {
            setServiceSub(null)
          }}
          onSearch={openSearch}
          onCart={openCart}
          cartCount={cartCount}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="w-20 bg-gray-50 flex flex-col overflow-y-auto no-scrollbar">
            {categories.map((cat) => (
              <div key={cat.id} onClick={() => setCurrentCat(cat.id)} className={`py-6 flex flex-col items-center gap-1 transition-colors ${currentCat === cat.id ? 'bg-white border-l-4 border-indigo-600' : ''}`}>
                <span className="text-lg">{cat.icon}</span>
                <span className={`text-[10px] font-medium ${currentCat === cat.id ? 'text-indigo-600' : 'text-gray-500'}`}>{cat.labels ? pickLabel(cat.labels) : t(cat.nameKey)}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-white overflow-y-auto overflow-x-hidden p-4">
            {isServices ? (
              (
                <div>
                  {!serviceSub ? (
                    <div className="mb-4">
                      <h2 className="font-bold text-gray-800 mb-4">{categoryTitleText}</h2>
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { id: 'bundle', key: 'bundle.title', desc: t('bundle.desc'), icon: '🧩', action: () => setPage('funeral_bundle') },
                          { id: 'ceremony', key: 'catSub.services.0', desc: t('aftercare.desc'), icon: '🕯️', action: () => setPage('aftercare_ceremony') },
                          { id: 'cemetery', key: 'catSub.services.1', desc: '像选影院座位一样选位置，按区域计价', icon: '🪦', action: () => setPage('cemetery') },
                          { id: 'grief', key: 'catSub.services.2', desc: '倾听与陪伴，帮助情绪逐步稳定', icon: '💬' },
                        ].map((s) => (
                          <div key={s.id} className="rp-card p-4 flex items-center justify-between" onClick={s.action || (() => setServiceSub(s.id))}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">{s.icon}</div>
                              <div className="min-w-0">
                                <div className="text-sm font-black text-gray-900 truncate">{t(s.key)}</div>
                                <div className="text-[10px] text-gray-500 truncate">{s.desc}</div>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('shop.reco')}</span>
                          <Filter size={14} className="text-gray-400" />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {products.filter((p) => p.category === 'services').map((p) => (
                            <div key={p.id} className="flex gap-3 bg-white border-b pb-4 overflow-hidden">
                              <SafeImage src={p.image} className="w-24 h-24 rounded-xl object-cover" alt="p" onClick={() => onProductClick(p)} />
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-1" onClick={() => onProductClick(p)}>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800 mb-1 truncate">{p.name}</h4>
                                  <p className="text-[10px] text-gray-400 truncate">{p.description}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-red-500 font-bold text-sm">${p.price}</span>
                                  <span className="text-[9px] text-gray-400">{t('product.sold', { count: p.sales })}</span>
                                </div>
                              </div>
                              <button className="text-[10px] text-indigo-600 border-0 bg-transparent" onClick={() => onMerchantClick(p.merchantId)} type="button">
                                {t('common.shop')}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('shop.reco')}</span>
                        <Filter size={14} className="text-gray-400" />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {serviceProducts.map((p) => (
                          <div key={p.id} className="flex gap-3 bg-white border-b pb-4 overflow-hidden">
                            <SafeImage src={p.image} className="w-24 h-24 rounded-xl object-cover" alt="p" onClick={() => onProductClick(p)} />
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1" onClick={() => onProductClick(p)}>
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-1 truncate">{p.name}</h4>
                                <p className="text-[10px] text-gray-400 truncate">{p.description}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-red-500 font-bold text-sm">${p.price}</span>
                                <span className="text-[9px] text-gray-400">{t('product.sold', { count: p.sales })}</span>
                              </div>
                            </div>
                            <button className="text-[10px] text-indigo-600 border-0 bg-transparent" onClick={() => onMerchantClick(p.merchantId)} type="button">
                              {t('common.shop')}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div>
                <div className="mb-4">
                  <h2 className="font-bold text-gray-800 mb-4">{categoryTitleText}</h2>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {categorySubItems.map((s) => (
                      <div key={s.id} className="bg-gray-50 rounded-lg py-2 flex flex-col items-center">
                        <div className="w-8 h-8 bg-white rounded-md mb-1 border border-gray-100"></div>
                        <span className="text-[9px] text-gray-500">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('shop.reco')}</span>
                  <Filter size={14} className="text-gray-400" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="flex gap-3 bg-white border-b pb-4 overflow-hidden">
                      <SafeImage src={p.image} className="w-24 h-24 rounded-xl object-cover" alt="p" onClick={() => onProductClick(p)} />
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1" onClick={() => onProductClick(p)}>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-1 truncate">{p.name}</h4>
                          <p className="text-[10px] text-gray-400 truncate">{p.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-red-500 font-bold text-sm">${p.price}</span>
                          <span className="text-[9px] text-gray-400">{t('product.sold', { count: p.sales })}</span>
                        </div>
                      </div>
                      <button className="text-[10px] text-indigo-600 border-0 bg-transparent" onClick={() => onMerchantClick(p.merchantId)} type="button">
                        {t('common.shop')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const MerchantStorePage = ({ merchant, onBack, onProductClick }) => (
    <div className="rp-page-bg min-h-screen pb-10">
      <div className="relative h-48">
        <SafeImage src={merchant.cover} className="w-full h-full object-cover" alt="cover" />
        <div className="absolute inset-0 bg-black/40"></div>
        <button onClick={onBack} className="absolute top-10 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white"><ArrowLeft size={20} /></button>
        <button className="absolute top-10 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white"><Share2 size={20} /></button>
        <div className="absolute bottom-[-30px] left-6 flex items-end gap-4">
          <SafeImage src={merchant.logo} className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-white" alt="logo" />
          <div className="pb-8">
            <h2 className="text-xl font-bold text-white drop-shadow-md">{merchant.name}</h2>
            <div className="flex items-center gap-2 text-white/80 text-[10px]">
              <div className="flex items-center gap-1 bg-indigo-600/60 px-2 py-0.5 rounded backdrop-blur-sm">
                <Star size={10} className="fill-white text-white" />
                <span>{merchant.rating}分</span>
              </div>
              <span className="flex items-center gap-1"><MapPin size={10} /> {merchant.location}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 px-6">
        <p className="text-xs text-gray-500 leading-relaxed italic mb-6">"{merchant.desc}"</p>
        <div className="flex gap-6 border-b mb-6">
          <span className="pb-2 border-b-2 border-indigo-600 font-bold text-sm text-indigo-600">商品</span>
          <span className="pb-2 text-sm text-gray-400">评价</span>
          <span className="pb-2 text-sm text-gray-400">动态</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {products.filter((p) => p.merchantId === merchant.id).map((p) => (
            <ProductCard key={p.id} product={p} onClick={onProductClick} onMerchantClick={() => {}} t={t} />
          ))}
        </div>
      </div>
    </div>
  )

  const MemorialTab = () => {
    const hall = memorials[0] || null
    return (
      <div className="pb-20 bg-slate-900 min-h-screen text-white">
        <Header title={t('home.memorialTitle')} onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
        <div className="p-6 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
            <div className="relative w-full h-full rounded-full border-2 border-indigo-400 p-1">
              <SafeImage src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200" className="w-full h-full rounded-full object-cover" alt="pet" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-1">{hall ? `${hall.name} 的思念堂` : t('tabs.memorial')}</h2>
          <p className="text-xs text-indigo-300">{hall ? `已点燃 ${hall.candles} 盏灯 · 已献花 ${hall.flowers} 次` : ''}</p>
        </div>
        <div className="flex justify-around py-6 border-y border-white/10 bg-white/5">
          <div
            className="text-center active:opacity-60 cursor-pointer"
            onClick={() => {
              if (!hall) return
              startPay({
                title: `${hall.name} · ${t('memorial.light')}`,
                items: [{ productId: 9001, quantity: 1 }],
                source: 'buy_now',
                meta: { kind: 'memorial_offer', memorialId: hall.id, effect: 'candle', qty: 1 },
              })
            }}
          >
            <FlameKindling className="mx-auto mb-1 text-orange-400" />
            <p className="text-[10px]">{t('memorial.light')}</p>
          </div>
          <div
            className="text-center active:opacity-60 cursor-pointer"
            onClick={() => {
              if (!hall) return
              startPay({
                title: `${hall.name} · ${t('memorial.flowers')}`,
                items: [{ productId: 9002, quantity: 1 }],
                source: 'buy_now',
                meta: { kind: 'memorial_offer', memorialId: hall.id, effect: 'flower', qty: 1 },
              })
            }}
          >
            <MessageSquare className="mx-auto mb-1 text-blue-400" />
            <p className="text-[10px]">{t('memorial.flowers')}</p>
          </div>
          <div
            className="text-center active:opacity-60 cursor-pointer"
            onClick={() => {
              if (!hall) return
              setMemorialSelectedId(hall.id)
              setPage('memorial_detail')
            }}
          >
            <Camera className="mx-auto mb-1 text-green-400" />
            <p className="text-[10px]">{t('memorial.enter')}</p>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-bold mb-4 opacity-70 uppercase tracking-widest">{t('memorial.recent')}</h3>
          {memorials.map((m) => (
            <div
              key={m.id}
              className="bg-white/5 rounded-xl p-4 mb-3 flex items-start gap-3 border border-white/5 active:opacity-80 cursor-pointer"
              onClick={() => {
                setMemorialSelectedId(m.id)
                setPage('memorial_detail')
              }}
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">{m.name[0]}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">
                    {m.name} <span className="text-[10px] font-normal opacity-50">({m.type})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={`border px-2 py-1 rounded-full text-[10px] font-bold ${memorialFavIds.includes(Number(m.id)) ? 'bg-pink-500 text-white border-0' : 'bg-white/10 text-white border-white/10'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMemorialFav(m.id)
                      }}
                    >
                      {memorialFavIds.includes(Number(m.id)) ? t('memorial.faved') : t('memorial.fav')}
                    </button>
                    <span className="text-[10px] opacity-40">{m.date}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-300 italic leading-relaxed">"{m.message}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const MemorialDetailPage = () => {
    const memorial = memorials.find((m) => Number(m.id) === Number(memorialSelectedId)) || memorials[0] || null
    if (!memorial) return null
    const canUpgrade = !memorial.upgraded
    const isFav = memorialFavIds.includes(Number(memorial.id))
    return (
      <div className="pb-20 bg-slate-900 min-h-screen text-white">
        <Header title={t('tabs.memorial')} showBack onBack={() => setPage(null)} onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
        <div className="p-6">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-lg font-black shadow-lg">{memorial.name[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-black truncate">{memorial.name}</div>
                <div className="text-[10px] text-white/60 truncate">{memorial.type} · {memorial.date}{memorial.upgraded ? ` · ${t('memorial.upgraded')}` : ''}</div>
              </div>
              <button
                type="button"
                className={`border px-3 py-2 rounded-xl text-xs font-black ${isFav ? 'bg-pink-500 text-white border-0' : 'bg-white/10 text-white border-white/10'}`}
                onClick={() => toggleMemorialFav(memorial.id)}
              >
                {isFav ? t('memorial.faved') : t('memorial.fav')}
              </button>
            </div>
            <div className="mt-3 text-xs text-white/70 italic leading-relaxed">"{memorial.message}"</div>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-white/60">{t('memorial.candles')}</div>
                <div className="text-lg font-black">{memorial.candles}</div>
              </div>
              <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-[10px] text-white/60">{t('memorial.flowersCount')}</div>
                <div className="text-lg font-black">{memorial.flowers}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              type="button"
              className="bg-orange-500 text-white rounded-2xl p-4 font-bold active:scale-95 transition-transform border-0"
              onClick={() =>
                startPay({
                  title: `${memorial.name} · ${t('memorial.light')}`,
                  items: [{ productId: 9001, quantity: 1 }],
                  source: 'buy_now',
                  meta: { kind: 'memorial_offer', memorialId: memorial.id, effect: 'candle', qty: 1 },
                })
              }
            >
              {t('memorial.light')}
            </button>
            <button
              type="button"
              className="bg-pink-500 text-white rounded-2xl p-4 font-bold active:scale-95 transition-transform border-0"
              onClick={() =>
                startPay({
                  title: `${memorial.name} · ${t('memorial.flowers')}`,
                  items: [{ productId: 9002, quantity: 1 }],
                  source: 'buy_now',
                  meta: { kind: 'memorial_offer', memorialId: memorial.id, effect: 'flower', qty: 1 },
                })
              }
            >
              {t('memorial.flowers')}
            </button>
            <button
              type="button"
              className="bg-white/10 text-white rounded-2xl p-4 font-bold active:scale-95 transition-transform border border-white/10"
              onClick={() => setPage('memorial_album')}
            >
              {t('memorial.album')}
            </button>
            <button
              type="button"
              className={`rounded-2xl p-4 font-bold active:scale-95 transition-transform border ${canUpgrade ? 'bg-indigo-500 text-white border-0' : 'bg-white/10 text-white/60 border-white/10'}`}
              disabled={!canUpgrade}
              onClick={() =>
                startPay({
                  title: `${memorial.name} · ${t('memorial.upgrade')}`,
                  items: [{ productId: 9003, quantity: 1 }],
                  source: 'buy_now',
                  meta: { kind: 'memorial_upgrade', memorialId: memorial.id },
                })
              }
            >
              {t('memorial.upgrade')}
            </button>
          </div>

          <div className="mt-4 bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="text-sm font-black mb-3">{t('memorial.messages')}</div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-indigo-400"
                placeholder={t('memorial.messagePlaceholder')}
                value={memorialDraftMessage}
                onChange={(e) => setMemorialDraftMessage(e.target.value)}
              />
              <button
                type="button"
                className="bg-indigo-500 text-white px-4 rounded-xl font-bold border-0 active:scale-95 transition-transform"
                onClick={() => {
                  const text = memorialDraftMessage.trim()
                  if (!text) return
                  const msg = { id: `m_${Date.now()}`, text, at: new Date().toLocaleString() }
                  setMemorials((prev) => prev.map((x) => (Number(x.id) === Number(memorial.id) ? { ...x, messages: [msg, ...(x.messages || [])] } : x)))
                  setMemorialDraftMessage('')
                  showToast({ title: t('memorial.sent'), desc: t('memorial.sentDesc') })
                }}
              >
                {t('memorial.send')}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(memorial.messages || []).length ? (
                memorial.messages.map((msg) => (
                  <div key={msg.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="text-[10px] text-white/50 mb-1">{msg.at}</div>
                    <div className="text-sm text-white/90 leading-relaxed">{msg.text}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-white/50">{t('memorial.noMessages')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const MemorialAlbumPage = () => {
    const memorial = memorials.find((m) => Number(m.id) === Number(memorialSelectedId)) || memorials[0] || null
    if (!memorial) return null
    return (
      <div className="pb-20 bg-slate-900 min-h-screen text-white">
        <Header title={t('memorial.album')} showBack onBack={() => setPage('memorial_detail')} onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
        <div className="p-6">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="text-sm font-black mb-3">{memorial.name}</div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-indigo-400"
                placeholder={t('memorial.photoPlaceholder')}
                value={memorialDraftPhoto}
                onChange={(e) => setMemorialDraftPhoto(e.target.value)}
              />
              <button
                type="button"
                className="bg-indigo-500 text-white px-4 rounded-xl font-bold border-0 active:scale-95 transition-transform"
                onClick={() => {
                  const url = memorialDraftPhoto.trim()
                  if (!url) return
                  setMemorials((prev) =>
                    prev.map((x) => (Number(x.id) === Number(memorial.id) ? { ...x, photos: [url, ...(x.photos || [])] } : x))
                  )
                  setMemorialDraftPhoto('')
                  showToast({ title: t('memorial.saved'), desc: t('memorial.savedDesc') })
                }}
              >
                {t('memorial.addPhoto')}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(memorial.photos || []).length ? (
              memorial.photos.map((url) => (
                <div key={url} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <SafeImage src={url} alt="photo" className="w-full h-36 object-cover" />
                </div>
              ))
            ) : (
              <div className="col-span-2 text-xs text-white/50">{t('memorial.noPhotos')}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ProfileTab = ({ setMerchantView }) => {
    const list = (backendOrders && backendOrders.length ? backendOrders : orders) || []
    const total = list.length
    const pending = list.filter((o) => String(o.status || '') === 'pending').length
    const completed = list.filter((o) => String(o.status || '') === 'completed' || String(o.status || '') === 'paid').length
    const isTelegramPhone = profilePhone && profilePhone.startsWith('tg_')
    const tgInitData = typeof window !== 'undefined' && window.Telegram?.WebApp && typeof window.Telegram.WebApp.initData === 'string'
      ? window.Telegram.WebApp.initData.trim()
      : ''
    const showCrmConsole = (() => {
      try {
        const qs = typeof window !== 'undefined' ? window.location.search : ''
        const p = new URLSearchParams(qs)
        return p.get('crm') === '1'
      } catch {
        return false
      }
    })()

    return (
      <div className="pb-20 rp-page-bg min-h-screen">
        <div className="rp-card p-8 pt-12 flex flex-col items-center rounded-b-[40px]">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
            <User size={40} />
          </div>
          <h2 className="text-lg font-bold">{String(userProfile?.name || t('profile.guestName'))}</h2>
          <p className="text-xs text-gray-400">
            {profilePhone ? `${t('profile.phone')}: ${profilePhone}` : t('profile.noPhone')}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            登录方式：{isTelegramPhone ? 'Telegram' : profilePhone ? '手机号' : tgInitData ? 'Telegram（未登录）' : '游客'}
          </p>
          {!profilePhone ? (
            <button
              type="button"
              className="mt-3 rp-btn-primary px-4 py-2 rounded-full text-xs font-bold border-0"
              onClick={() => setPage('profile_edit')}
            >
              手机号登录/完善资料
            </button>
          ) : null}
        </div>
        <div className="mt-[-20px] mx-6 rp-card flex justify-around py-6 relative z-10">
          <div className="text-center">
            <p className="font-bold text-lg">{total}</p>
            <p className="text-[10px] text-gray-400">{t('profile.stats.all')}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{pending}</p>
            <p className="text-[10px] text-gray-400">{t('profile.stats.pending')}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-indigo-600">{completed}</p>
            <p className="text-[10px] text-gray-400">{t('profile.stats.completed')}</p>
          </div>
        </div>
        <div className="mt-8 px-4 flex flex-col gap-2">
          {(
            [
            { icon: <Pencil size={18} />, label: t('profile.editProfile'), action: () => setPage('profile_edit') },
            { icon: <PawPrint size={18} />, label: t('profile.myPets'), action: () => setPage('pets') },
            { icon: <Package size={18} />, label: t('profile.myOrders'), action: () => setPage('orders') },
            { icon: <Heart size={18} />, label: t('profile.memorialFav'), action: () => setPage('memorial_favs') },
            { icon: <CreditCard size={18} />, label: t('profile.payments'), action: () => setPage('payments') },
            { icon: <Settings size={18} />, label: t('profile.settings'), action: () => setPage('settings') },
            { icon: <Store size={18} />, label: t('profile.switchMerchant'), action: setMerchantView },
            ...(showCrmConsole
              ? [
                  {
                    icon: <BarChart3 size={18} />,
                    label: 'CRM 工作台',
                    action: () => {
                      try {
                        window.location.assign('/rainbowpaw/crm')
                      } catch {
                        void 0
                      }
                    },
                  },
                ]
              : []),
          ]
            )
            .map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className="rp-card p-4 flex items-center justify-between active:bg-gray-100 transition-colors border-0 bg-transparent text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  const ProfileEditPage = () => {
    const [name, setName] = useState(() => String(userProfile?.name || ''))
    const [phone, setPhone] = useState(() => String(userProfile?.phone || ''))
    const [email, setEmail] = useState(() => String(userProfile?.email || ''))

    return (
      <div className="rp-page-bg min-h-screen">
        <Header title={t('profile.editProfile')} showBack onBack={() => setPage(null)} hideActions />
        <div className="p-4 space-y-3">
          <div className="rp-card p-4">
            <div className="text-xs font-bold text-gray-500 mb-3">{t('profile.editTip')}</div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('profile.name')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('profile.namePh')}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('profile.phone')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('profile.phonePh')}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 mb-1">{t('profile.email')}</div>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('profile.emailPh')}
                />
              </div>
              <button
                type="button"
                className={`rp-btn-primary w-full py-3 rounded-xl text-sm font-black border-0 ${profileLoading ? 'opacity-70' : ''}`}
                disabled={profileLoading}
                onClick={async () => {
                  const nextName = name.trim()
                  const nextPhone = phone.trim()
                  const nextEmail = email.trim()
                  if (!nextName || !nextPhone) {
                    showToast({ title: t('common.failed'), desc: t('profile.required') })
                    return
                  }
                  try {
                    const tg = window.Telegram?.WebApp
                    const initData = typeof tg?.initData === 'string' ? tg.initData.trim() : ''
                    const saved = initData
                      ? await apiFetch('/api/v1/auth/telegram/webapp/bind-phone', {
                          method: 'POST',
                          body: { init_data: initData, name: nextName, phone: nextPhone, email: nextEmail || null, language: lang },
                        })
                      : await apiFetch('/api/v1/users', {
                          method: 'POST',
                          body: { name: nextName, phone: nextPhone, email: nextEmail || null, language: lang },
                        })

                    const nextUser = saved?.user ? saved.user : saved
                    if (saved?.token) saveUserAuthToken(saved.token)
                    if (nextUser && typeof nextUser === 'object') {
                      saveUserProfile(nextUser)
                      await loadPets(String(nextUser.phone || nextPhone))
                      await loadOrders(String(nextUser.phone || nextPhone))
                    }
                    showToast({ title: t('common.saved'), desc: t('profile.saved') })
                    setPage(null)
                  } catch (e) {
                    showToast({ title: t('common.failed'), desc: e?.message || t('profile.saveFailed') })
                  }
                }}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PetsPage = () => (
    <div className="rp-page-bg min-h-screen">
      <Header title={t('pets.title')} showBack onBack={() => setPage(null)} hideActions />
      <div className="p-4 space-y-3">
        {!profilePhone ? (
          <div className="rp-card p-6 text-center">
            <div className="text-sm font-bold text-gray-800 mb-2">{t('pets.needProfileTitle')}</div>
            <div className="text-xs text-gray-500 mb-4">{t('pets.needProfileDesc')}</div>
            <button className="rp-btn-primary px-4 py-2 rounded-full text-xs font-bold border-0" onClick={() => setPage('profile_edit')} type="button">
              {t('profile.editProfile')}
            </button>
          </div>
        ) : (
          <>
            <button
              className="rp-btn-primary w-full py-3 rounded-xl text-sm font-black border-0"
              type="button"
              onClick={() => {
                setPetDraft({ mode: 'create', pet_name: '', pet_type: 'Dog', pet_weight: '' })
                setPage('pet_edit')
              }}
            >
              {t('pets.add')}
            </button>

            {petsLoading ? <div className="text-xs text-gray-500 px-1">{t('common.loading')}</div> : null}

            {Array.isArray(pets) && pets.length ? (
              pets.map((p) => (
                <div key={p.id} className="rp-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-black text-gray-900 truncate">{String(p.pet_name || t('pets.noName'))}</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {t('pets.type')}: {String(p.pet_type || '')}
                        {p.pet_weight ? ` · ${t('pets.weight')}: ${String(p.pet_weight)}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="rp-btn-soft px-3 py-2 rounded-xl text-xs font-bold border-0 flex items-center gap-1"
                        onClick={() => {
                          setPetDraft({ mode: 'edit', ...p })
                          setPage('pet_edit')
                        }}
                      >
                        <Pencil size={14} />
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        className="rp-btn-soft px-3 py-2 rounded-xl text-xs font-bold border-0 flex items-center gap-1 text-red-600"
                        onClick={async () => {
                          const okDel = window.confirm(t('pets.confirmDelete'))
                          if (!okDel) return
                          try {
                            await apiFetch(`/api/v1/pets/${encodeURIComponent(String(p.id))}?phone=${encodeURIComponent(profilePhone)}`, { method: 'DELETE' })
                            showToast({ title: t('common.deleted'), desc: t('pets.deleted') })
                            await loadPets(profilePhone)
                          } catch (e) {
                            showToast({ title: t('common.failed'), desc: e?.message || t('pets.deleteFailed') })
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rp-card p-6 text-center">
                <div className="text-sm font-bold text-gray-800 mb-2">{t('pets.emptyTitle')}</div>
                <div className="text-xs text-gray-500">{t('pets.emptyDesc')}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  const PetEditPage = () => {
    const draft = petDraft && typeof petDraft === 'object' ? petDraft : null
    const isEdit = draft?.mode === 'edit'
    const [petName, setPetName] = useState(() => String(draft?.pet_name || ''))
    const [petType, setPetType] = useState(() => String(draft?.pet_type || 'Dog'))
    const [petWeight, setPetWeight] = useState(() => String(draft?.pet_weight || ''))

    if (!draft) {
      return (
        <div className="rp-page-bg min-h-screen">
          <Header title={t('pets.editTitle')} showBack onBack={() => setPage('pets')} hideActions />
          <div className="p-4">
            <div className="rp-card p-6 text-center">
              <div className="text-sm font-bold text-gray-800">{t('pets.noDraft')}</div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="rp-page-bg min-h-screen">
        <Header title={t('pets.editTitle')} showBack onBack={() => setPage('pets')} hideActions />
        <div className="p-4 space-y-3">
          <div className="rp-card p-4 space-y-3">
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">{t('pets.name')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder={t('pets.namePh')}
              />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">{t('pets.type')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
                placeholder={t('pets.typePh')}
              />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 mb-1">{t('pets.weight')}</div>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white"
                value={petWeight}
                onChange={(e) => setPetWeight(e.target.value)}
                placeholder={t('pets.weightPh')}
              />
            </div>
          </div>
          <button
            type="button"
            className="rp-btn-primary w-full py-3 rounded-xl text-sm font-black border-0"
            onClick={async () => {
              if (!profilePhone) {
                showToast({ title: t('common.failed'), desc: t('pets.needProfileDesc') })
                return
              }
              const nextType = petType.trim()
              if (!nextType) {
                showToast({ title: t('common.failed'), desc: t('pets.required') })
                return
              }
              try {
                if (isEdit) {
                  await apiFetch(`/api/v1/pets/${encodeURIComponent(String(draft.id))}`, {
                    method: 'PATCH',
                    body: {
                      owner_phone: profilePhone,
                      pet_name: petName.trim() || null,
                      pet_type: nextType,
                      pet_weight: petWeight.trim() || null,
                    },
                  })
                } else {
                  await apiFetch('/api/v1/pets', {
                    method: 'POST',
                    body: {
                      owner_phone: profilePhone,
                      pet_name: petName.trim() || null,
                      pet_type: nextType,
                      pet_weight: petWeight.trim() || null,
                    },
                  })
                }
                await loadPets(profilePhone)
                showToast({ title: t('common.saved'), desc: isEdit ? t('pets.updated') : t('pets.created') })
                setPetDraft(null)
                setPage('pets')
              } catch (e) {
                showToast({ title: t('common.failed'), desc: e?.message || t('pets.saveFailed') })
              }
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    )
  }

  const LangPage = () => (
    <div className="rp-page-bg min-h-screen">
      <Header
        title={t('lang.title')}
        showBack
        onBack={() => {
          setPage(langReturnPage || null)
          setLangReturnPage(null)
        }}
        hideActions
      />
      <div className="p-4 space-y-2">
        {RP_MINIAPP_LANGS.map((l) => (
          <div
            key={l.id}
            className={`rp-card p-4 flex items-center justify-between ${lang === l.id ? 'border-indigo-200 bg-indigo-50/30' : ''}`}
            onClick={() => {
              setLang(l.id)
              setPage(langReturnPage || null)
              setLangReturnPage(null)
            }}
          >
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{l.label}</div>
              <div className="text-[10px] text-gray-400">{rpMiniAppGetLangLabel(l.id)}</div>
            </div>
            <div className="text-[10px] font-mono text-gray-500">{l.id}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const SettingsPage = () => (
    <div className="rp-page-bg min-h-screen">
      <Header title={t('profile.settings')} showBack onBack={() => setPage(null)} hideActions />
      <div className="p-4 space-y-2">
        <div className="rp-card p-4">
          <div className="text-xs font-bold text-gray-500 mb-2">{t('settings.loginStatus')}</div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black text-gray-900 truncate">{profilePhone ? profilePhone : t('settings.guest')}</div>
              <div className="text-[10px] text-gray-400 truncate">
                {profilePhone && profilePhone.startsWith('tg_')
                  ? t('settings.loginTelegram')
                  : profilePhone
                    ? t('settings.loginPhone')
                    : t('settings.notLoggedIn')}
              </div>
            </div>
            <button
              type="button"
              disabled={!profilePhone && !userAuthToken}
              className={`px-3 py-2 rounded-lg text-xs font-bold border ${!profilePhone && !userAuthToken ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-200 active:bg-gray-50'}`}
              onClick={() => {
                saveUserAuthToken('')
                saveUserProfile(null)
                setPets([])
                setBackendOrders([])
                setPayments([])
                setMemorialFavIds([])
                showToast({ title: t('common.deleted'), desc: t('settings.loggedOut') })
                setPage(null)
              }}
            >
              {t('settings.logout')}
            </button>
          </div>

          {userAuthToken ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-500">{t('settings.bizToken')}</div>
                <div className="text-[10px] font-mono text-gray-500 truncate">
                  {userAuthToken.slice(0, 10)}...{userAuthToken.slice(-6)}
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-xs font-bold border bg-white text-gray-700 border-gray-200 active:bg-gray-50"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(userAuthToken)
                    showToast({ title: t('common.saved'), desc: t('settings.tokenCopied') })
                  } catch {
                    showToast({ title: t('common.failed'), desc: t('common.copyFailed') })
                  }
                }}
              >
                {t('common.copy')}
              </button>
            </div>
          ) : null}
        </div>
        <div className="rp-card p-4 flex items-center justify-between" onClick={() => openLang('settings')}>
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquare size={18} className="text-gray-500" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{t('profile.language')}</div>
              <div className="text-[10px] text-gray-400 truncate">{rpMiniAppGetLangLabel(lang)}</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    </div>
  )

  const SearchPage = () => {
    const q = searchQuery.trim().toLowerCase()
    const results = q ? products.filter((p) => `${p.name} ${p.merchant}`.toLowerCase().includes(q)).slice(0, 20) : products.slice(0, 12)
    return (
      <div className="rp-page-bg min-h-screen">
        <Header title={t('search.title')} showBack onBack={() => setPage(null)} hideActions />
        <div className="p-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <div className="mt-4 space-y-3">
            {results.map((p) => (
              <div
                key={p.id}
                className="rp-card p-3 flex items-center gap-3 active:opacity-70"
                onClick={() => {
                  setSelectedProduct(p)
                  setPage(null)
                }}
              >
                <SafeImage src={p.image} alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{p.merchant}</div>
                </div>
                <div className="text-sm font-black text-red-500">${p.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const CartPage = () => {
    const items = cartItems
      .map((it) => {
        const p = products.find((x) => x.id === it.productId)
        if (!p) return null
        return { ...it, product: p }
      })
      .filter(Boolean)

    const total = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0)

    return (
      <div className="rp-page-bg min-h-screen pb-24">
        <Header title={t('cart.title')} showBack onBack={() => setPage(null)} hideActions />
        <div className="p-4">
          {items.length ? (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.productId} className="rp-card p-3 flex items-center gap-3">
                  <SafeImage src={it.product.image} alt={it.product.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-800 truncate">{it.product.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{it.product.merchant}</div>
                    <div className="text-sm font-black text-red-500 mt-1">${it.product.price.toFixed(2)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="text-[10px] text-gray-400 border-0 bg-transparent" onClick={() => removeFromCart(it.productId)} type="button">
                      {t('common.delete')}
                    </button>
                    <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-black border-0" onClick={() => setCartQuantity(it.productId, it.quantity - 1)} type="button">
                        -
                      </button>
                      <div className="w-8 text-center text-sm font-bold text-gray-800">{it.quantity}</div>
                      <button className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-black border-0" onClick={() => setCartQuantity(it.productId, it.quantity + 1)} type="button">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rp-card p-6 text-center">
              <div className="text-sm font-bold text-gray-800 mb-2">{t('cart.emptyTitle')}</div>
              <div className="text-xs text-gray-500 mb-4">{t('cart.emptyDesc')}</div>
              <button
                className="rp-btn-primary px-4 py-2 rounded-full text-xs font-bold border-0"
                onClick={() => {
                  setActiveTab('shop')
                  setPage(null)
                }}
                type="button"
              >
                {t('cart.goShop')}
              </button>
            </div>
          )}
        </div>

        {items.length ? (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center gap-4 max-w-md mx-auto z-50">
            <div className="flex-1">
              <div className="text-[10px] text-gray-400">{t('cart.total')}</div>
              <div className="text-xl font-black text-gray-900">${total.toFixed(2)}</div>
            </div>
            <button
              className="rp-btn-primary px-6 py-3 rounded-xl text-sm font-bold border-0"
              onClick={() => startPay({ title: t('cart.title'), items: cartItems, source: 'cart' })}
              type="button"
            >
              {t('cart.pay')}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  const OrdersPage = () => {
    const list = profilePhone ? backendOrders : orders
    return (
      <div className="rp-page-bg min-h-screen">
        <Header title={t('orders.title')} showBack onBack={() => setPage(null)} hideActions />
        <div className="p-4 space-y-3">
          {profilePhone ? (
            <div className="rp-card p-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500">{t('profile.phone')}</div>
                <div className="text-sm font-black text-gray-900 truncate">{profilePhone}</div>
              </div>
              <button
                type="button"
                className="rp-btn-soft px-4 py-2 rounded-xl text-xs font-bold border-0"
                onClick={() => loadOrders(profilePhone)}
              >
                {t('common.refresh')}
              </button>
            </div>
          ) : null}

          {Array.isArray(list) && list.length ? (
            list.map((o) => {
              const id = String(o.order_id || o.id || '')
              const status = String(o.status || '')
              const createdAt = String(o.created_at || o.createdAt || '')
              const title =
                o.service_package
                  ? `${t('orders.service')}: ${String(o.service_package).toUpperCase()}`
                  : String(o.title || t('order.default'))
              const amount = o.total_amount_cents != null ? Number(o.total_amount_cents || 0) / 100 : Number(o.total || 0)
              const statusText = status === 'paid' || status === 'completed' ? t('orders.paid') : t('orders.pending')
              const statusClass = status === 'paid' || status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              return (
                <button
                  key={id}
                  type="button"
                  className="rp-card p-4 w-full text-left active:opacity-80"
                  onClick={() => {
                    if (!id) return
                    setSelectedOrderId(id)
                    setPage('order_detail')
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-mono text-gray-400">#{id}</div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>{statusText}</div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate mb-1">{title}</div>
                  <div className="text-[10px] text-gray-400 mb-2">{createdAt}</div>
                  {o.pickup_address ? <div className="text-[10px] text-gray-500 truncate mb-2">{String(o.pickup_address)}</div> : null}
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-gray-500">
                      {o.pet_type ? `${String(o.pet_type)}${o.pet_weight ? ` · ${String(o.pet_weight)}` : ''}` : ''}
                    </div>
                    <div className="text-lg font-black text-gray-900">${Number(amount || 0).toFixed(2)}</div>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="rp-card p-6 text-center">
              <div className="text-sm font-bold text-gray-800 mb-2">{t('orders.emptyTitle')}</div>
              <div className="text-xs text-gray-500">{t('orders.emptyDesc')}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const OrderDetailPage = () => {
    const orderId = String(selectedOrderId || '').trim()
    const detail = orderDetail && typeof orderDetail === 'object' ? orderDetail : null
    const timelineRaw = detail?.intake_metadata && typeof detail.intake_metadata === 'object' ? detail.intake_metadata.timeline : null
    const timeline = Array.isArray(timelineRaw) ? timelineRaw : []
    const status = String(detail?.status || '')

    useEffect(() => {
      if (!orderId) return
      loadOrderDetail(orderId)
      loadOrderPayments(orderId)
    }, [orderId])

    return (
      <div className="rp-page-bg min-h-screen pb-24">
        <Header title={t('orders.detailTitle')} showBack onBack={() => setPage('orders')} hideActions />
        <div className="p-4 space-y-3">
          {orderDetailLoading ? <div className="text-xs text-gray-500 px-1">{t('common.loading')}</div> : null}

          {detail ? (
            <>
              <div className="rp-card p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-[10px] font-mono text-gray-400">#{String(detail.order_id || '')}</div>
                  <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{String(status || '-')}</div>
                </div>
                <div className="text-sm font-black text-gray-900">
                  {t('orders.service')}: {String(detail.service_package || '').toUpperCase()}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {detail.city ? `${String(detail.city)} · ` : ''}
                  {detail.pet_type ? `${String(detail.pet_type)}${detail.pet_weight ? ` · ${String(detail.pet_weight)}` : ''}` : ''}
                </div>
                {detail.pickup_address ? <div className="text-[10px] text-gray-500 mt-2">{String(detail.pickup_address)}</div> : null}
              </div>

              <div className="rp-card p-4">
                <div className="text-xs font-bold text-gray-500 mb-3">{t('orders.timeline')}</div>
                {timeline.length ? (
                  <div className="space-y-2">
                    {timeline
                      .slice()
                      .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))
                      .map((ev, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">{String(ev.title || ev.type || 'event')}</div>
                            {ev.desc ? <div className="text-[10px] text-gray-500 mt-0.5">{String(ev.desc)}</div> : null}
                          </div>
                          <div className="text-[10px] text-gray-400 shrink-0">{String(ev.at || '')}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">{t('orders.noTimeline')}</div>
                )}
              </div>

              <div className="rp-card p-4">
                <div className="text-xs font-bold text-gray-500 mb-3">{t('orders.items')}</div>
                {Array.isArray(detail.items) && detail.items.length ? (
                  <div className="space-y-2">
                    {detail.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{String(it.title_snapshot || '')}</div>
                          <div className="text-[10px] text-gray-500">
                            {String(it.item_type || '')} · x{Number(it.quantity || 1)}
                          </div>
                        </div>
                        <div className="text-sm font-black text-gray-900">${(Number(it.line_total_cents || 0) / 100).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">{t('orders.noItems')}</div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[10px] text-gray-500">{t('orders.total')}</div>
                  <div className="text-lg font-black text-gray-900">${(Number(detail.total_amount_cents || 0) / 100).toFixed(2)}</div>
                </div>
              </div>

              <div className="rp-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-500">{t('payments.title')}</div>
                  <button type="button" className="rp-btn-soft px-4 py-2 rounded-xl text-xs font-bold border-0" onClick={() => loadOrderPayments(orderId)}>
                    {t('common.refresh')}
                  </button>
                </div>
                {Array.isArray(orderPayments) && orderPayments.length ? (
                  <div className="space-y-2">
                    {orderPayments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{String(p.method || '')}</div>
                          <div className="text-[10px] text-gray-500 truncate">{String(p.status || '')} · {String(p.created_at || '')}</div>
                        </div>
                        <div className="text-sm font-black text-gray-900">${(Number(p.amount_cents || 0) / 100).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">{t('payments.empty')}</div>
                )}
              </div>
            </>
          ) : (
            <div className="rp-card p-6 text-center">
              <div className="text-sm font-bold text-gray-800 mb-2">{t('orders.notFoundTitle')}</div>
              <div className="text-xs text-gray-500">{t('orders.notFoundDesc')}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const PaymentsPage = () => (
    <div className="rp-page-bg min-h-screen">
      <Header title={t('payments.title')} showBack onBack={() => setPage(null)} hideActions />
      <div className="p-4 space-y-3">
        {!profilePhone ? (
          <div className="rp-card p-6 text-center">
            <div className="text-sm font-bold text-gray-800 mb-2">{t('payments.needProfileTitle')}</div>
            <div className="text-xs text-gray-500 mb-4">{t('payments.needProfileDesc')}</div>
            <button className="rp-btn-primary px-4 py-2 rounded-full text-xs font-bold border-0" onClick={() => setPage('profile_edit')} type="button">
              {t('profile.editProfile')}
            </button>
          </div>
        ) : (
          <>
            <div className="rp-card p-4 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500">{t('profile.phone')}</div>
                <div className="text-sm font-black text-gray-900 truncate">{profilePhone}</div>
              </div>
              <button type="button" className="rp-btn-soft px-4 py-2 rounded-xl text-xs font-bold border-0" onClick={() => loadPayments(profilePhone)}>
                {t('common.refresh')}
              </button>
            </div>
            {paymentsLoading ? <div className="text-xs text-gray-500 px-1">{t('common.loading')}</div> : null}
            {Array.isArray(payments) && payments.length ? (
              payments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="rp-card p-4 w-full text-left active:opacity-80"
                  onClick={() => {
                    const oid = String(p.order_id || '').trim()
                    if (!oid) return
                    setSelectedOrderId(oid)
                    setPage('order_detail')
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-mono text-gray-400">#{String(p.order_id || '')}</div>
                    <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{String(p.status || '')}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{String(p.method || '')}</div>
                      <div className="text-[10px] text-gray-500 truncate">{String(p.created_at || '')}</div>
                    </div>
                    <div className="text-lg font-black text-gray-900">${(Number(p.amount_cents || 0) / 100).toFixed(2)}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rp-card p-6 text-center">
                <div className="text-sm font-bold text-gray-800 mb-2">{t('payments.emptyTitle')}</div>
                <div className="text-xs text-gray-500">{t('payments.emptyDesc')}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  const MemorialFavsPage = () => {
    const favSet = new Set((Array.isArray(memorialFavIds) ? memorialFavIds : []).map((x) => Number(x)))
    const favs = memorials.filter((m) => favSet.has(Number(m.id)))
    return (
      <div className="pb-20 bg-slate-900 min-h-screen text-white">
        <Header title={t('memorial.favsTitle')} showBack onBack={() => setPage(null)} onSearch={openSearch} onCart={openCart} cartCount={cartCount} />
        <div className="p-4">
          {favs.length ? (
            favs.map((m) => (
              <div key={m.id} className="bg-white/5 rounded-xl p-4 mb-3 flex items-start gap-3 border border-white/5">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">{m.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-sm truncate">
                      {m.name} <span className="text-[10px] font-normal opacity-50">({m.type})</span>
                    </div>
                    <button type="button" className="border border-white/10 bg-white/5 text-white text-[10px] font-bold px-2 py-1 rounded-full" onClick={() => toggleMemorialFav(m.id)}>
                      {t('memorial.unfav')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 italic leading-relaxed mt-1 truncate">"{m.message}"</p>
                  <button
                    type="button"
                    className="mt-3 border border-white/10 bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl"
                    onClick={() => {
                      setMemorialSelectedId(m.id)
                      setPage('memorial_detail')
                    }}
                  >
                    {t('memorial.open')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
              <div className="text-sm font-black mb-2">{t('memorial.favsEmptyTitle')}</div>
              <div className="text-xs text-white/60">{t('memorial.favsEmptyDesc')}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const PaySuccessPage = () => (
    <div className="rp-page-bg min-h-screen">
      <Header title={t('pay.successTitle')} hideActions />
      <div className="p-6">
        <div className="rp-card p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
            <CheckCircle2 size={26} />
          </div>
          <div className="text-lg font-black text-gray-900 mb-1">{t('pay.successHeadline')}</div>
          <div className="text-xs text-gray-500 mb-4">{t('pay.successDesc')}</div>
          <div className="text-[10px] font-mono text-gray-400 mb-4">#{paidOrder?.id}</div>
          <div className="flex gap-3">
            <button
              className="rp-btn-soft flex-1 py-3 rounded-xl text-sm font-bold border-0"
              onClick={() => {
                setPaidOrder(null)
                setPostPayMemorialId(null)
                setPage('orders')
              }}
              type="button"
            >
              {t('pay.viewOrder')}
            </button>
            <button
              className="rp-btn-primary flex-1 py-3 rounded-xl text-sm font-bold border-0"
              onClick={() => {
                setPaidOrder(null)
                setPostPayMemorialId(null)
                setActiveTab('home')
                setPage(null)
              }}
              type="button"
            >
              {t('pay.backHome')}
            </button>
          </div>
          {postPayMemorialId ? (
            <button
              className="mt-3 w-full rp-btn-primary py-3 rounded-xl text-sm font-bold border-0"
              type="button"
              onClick={() => {
                const mid = postPayMemorialId
                setPaidOrder(null)
                setPostPayMemorialId(null)
                setActiveTab('memorial')
                setMemorialSelectedId(mid)
                setPage('memorial_detail')
              }}
            >
              {t('pay.goMemorial')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  const PayPendingPage = () => (
    <div className="rp-page-bg min-h-screen">
      <Header title={t('pay.title')} hideActions showBack onBack={() => setPage(null)} />
      <div className="p-6">
        <div className="rp-card p-6">
          <div className="text-sm font-black text-gray-900 mb-1">等待确认支付</div>
          <div className="text-xs text-gray-500">完成支付后系统会自动确认，请不要直接关闭页面。</div>
          <div className="mt-3 text-[10px] font-mono text-gray-400">#{pendingPayment?.display_id}</div>

          {pendingPayment?.method === 'usdt' ? (
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-800 mb-2">USDT(TRC20) 收款地址</div>
              <div className="text-[11px] font-mono break-all text-gray-700">{pendingPayment?.pay?.usdtTrc20Address || '-'}</div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rp-btn-soft flex-1 py-2 rounded-xl text-xs font-bold border-0"
                  onClick={async () => {
                    try {
                      const v = String(pendingPayment?.pay?.usdtTrc20Address || '').trim()
                      if (!v) return
                      await navigator.clipboard.writeText(v)
                      showToast({ title: '已复制地址', desc: '请到钱包粘贴转账' })
                    } catch {
                      showToast({ title: '复制失败', desc: '请长按地址复制' })
                    }
                  }}
                >
                  复制地址
                </button>
                {pendingPayment?.pay?.settlecorePaymentUrl ? (
                  <button
                    type="button"
                    className="rp-btn-primary flex-1 py-2 rounded-xl text-xs font-bold border-0"
                    onClick={() => window.open(String(pendingPayment.pay.settlecorePaymentUrl), '_blank', 'noopener,noreferrer')}
                  >
                    打开支付页
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-800 mb-2">ABA 转账信息</div>
              <div className="text-[11px] text-gray-700">名称：{pendingPayment?.pay?.abaName || '-'}</div>
              <div className="text-[11px] text-gray-700">编号：{pendingPayment?.pay?.abaId || '-'}</div>
              {pendingPayment?.pay?.settlecorePaymentUrl ? (
                <button
                  type="button"
                  className="mt-3 w-full rp-btn-primary py-2 rounded-xl text-xs font-bold border-0"
                  onClick={() => window.open(String(pendingPayment.pay.settlecorePaymentUrl), '_blank', 'noopener,noreferrer')}
                >
                  打开支付页
                </button>
              ) : null}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="text-gray-500">当前状态</div>
            <div className="font-bold text-gray-800">{pendingPaymentStatus === 'confirmed' ? '已确认' : '等待中'}</div>
          </div>

          <div className="mt-3 text-[10px] text-gray-400">系统每 3 秒自动查询一次支付状态。</div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (page === 'memorial_detail') return <MemorialDetailPage />
    if (page === 'memorial_album') return <MemorialAlbumPage />
    if (page === 'funeral_bundle') return <FuneralBundlePage />
    if (page === 'package_address')
      return (
        <PackageAddressPage
          t={t}
          packageCheckoutDraft={packageCheckoutDraft}
          packageAddressDraft={packageAddressDraft}
          setPackageAddressDraft={setPackageAddressDraft}
          onBack={() => setPage('funeral_bundle')}
          onRequestLocation={requestPackageLocation}
          onConfirm={(payload) => {
            try {
              localStorage.setItem('rp_package_address_v1', JSON.stringify(payload))
            } catch (e) {
              void e
            }
            if (!packageCheckoutDraft) return
            startPay({
              title: `${t('bundle.title')} · ${packageCheckoutDraft.title}`,
              items: [{ productId: packageCheckoutDraft.productId, quantity: 1 }],
              source: 'buy_now',
              meta: { kind: 'aftercare_packages_v2', package_product_id: packageCheckoutDraft.productId, package_title: packageCheckoutDraft.title, ...payload },
            })
          }}
        />
      )
    if (page === 'aftercare_ceremony') return <AftercareCeremonyPage />
    if (page === 'profile_edit') return <ProfileEditPage />
    if (page === 'pets') return <PetsPage />
    if (page === 'pet_edit') return <PetEditPage />
    if (page === 'payments') return <PaymentsPage />
    if (page === 'memorial_favs') return <MemorialFavsPage />
    if (page === 'lang') return <LangPage />
    if (page === 'settings') return <SettingsPage />
    if (page === 'search') return <SearchPage />
    if (page === 'cart') return <CartPage />
    if (page === 'orders') return <OrdersPage />
    if (page === 'order_detail') return <OrderDetailPage />
    if (page === 'pay_pending') return <PayPendingPage />
    if (page === 'pay_success') return <PaySuccessPage />
    if (page === 'cemetery') return <CemeteryDetailPage />
    if (view === 'merchant') return <MerchantPortal lang={lang} t={t} onBackToUser={() => setView('user')} />
    if (selectedProduct)
      return (
        <ProductDetailPage
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onBuy={() => startPay({ title: selectedProduct.name, items: [{ productId: selectedProduct.id, quantity: 1 }], source: 'buy_now' })}
          onAddToCart={() => {
            addToCart(selectedProduct.id, 1)
            showToast({ title: t('cart.addedTitle'), desc: t('cart.addedDesc', { merchant: selectedProduct.merchant }) })
          }}
          onMerchantClick={handleMerchantClick}
          t={t}
        />
      )
    if (selectedMerchant) return <MerchantStorePage merchant={selectedMerchant} onBack={() => setSelectedMerchant(null)} onProductClick={handleProductClick} />
    if (checkoutStep === 'pay')
      return (
        <PaymentPage
          onBack={() => {
            setCheckoutStep(null)
            setCheckout(null)
          }}
          total={checkout?.total || 0}
          method={paymentMethod}
          setMethod={setPaymentMethod}
          onConfirm={async () => {
            let backendOrderId = null
            if (checkout?.meta && typeof checkout.meta === 'object' && checkout.meta.kind === 'aftercare_intake' && checkout.meta.intakePayload) {
              try {
                const res = await apiFetch('/api/v1/orders/intake', { method: 'POST', body: checkout.meta.intakePayload })
                backendOrderId = res?.order_id || null
              } catch (e) {
                showToast({ title: t('aftercare.createOrderFailed'), desc: e?.message || t('aftercare.createOrderFailedDesc') })
              }
            }
            const id = `RP-${String(Date.now()).slice(-8)}`
            const createdAt = new Date().toLocaleString()
            const idempotencyKey = `mini_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
            const resp = await apiFetch('/payments/miniapp', {
              method: 'POST',
              headers: { 'x-idempotency-key': idempotencyKey },
              body: {
                amount: checkout?.total || 0,
                title: checkout?.title || t('order.default'),
                method: paymentMethod,
                metadata: { ...(checkout?.meta || {}), backend_order_id: backendOrderId },
              },
            })
            const displayId = String(resp?.data?.display_id || '').trim()
            if (!displayId) throw new Error('missing payment display_id')

            const order = { id, title: checkout?.title || t('order.default'), items: checkout?.items || [], total: checkout?.total || 0, method: paymentMethod, status: 'pending', createdAt, meta: checkout?.meta || null, backend_order_id: backendOrderId, payment_display_id: displayId }
            setOrders((prev) => [order, ...prev])
            setPendingPayment({ display_id: displayId, method: paymentMethod, pay: resp?.data?.pay || null, order, checkout })
            setPendingPaymentStatus('pending')
            setPage('pay_pending')
          }}
          t={t}
        />
      )
    if (activeTab === 'home') return <HomeTab />
    if (activeTab === 'shop') return <ShopTab onProductClick={handleProductClick} onMerchantClick={handleMerchantClick} initialCategory={selectedCategory} />
    if (activeTab === 'memorial') return <MemorialTab />
    return <ProfileTab setMerchantView={() => setView('merchant')} />
  }

  return (
    <div className="rp-shell max-w-md mx-auto min-h-screen bg-white overflow-x-hidden relative flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">{renderContent()}</div>
      {view === 'user' && !selectedProduct && !checkoutStep && !selectedMerchant && !page ? (
        <div className="rp-tabbar fixed bottom-0 left-0 right-0 px-8 py-3 pb-safe flex justify-between max-w-md mx-auto z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
          {[
            { id: 'home', icon: <Home size={20} />, label: t('tabs.home') },
            { id: 'shop', icon: <ShoppingBag size={20} />, label: t('tabs.shop') },
            { id: 'memorial', icon: <FlameKindling size={20} />, label: t('tabs.memorial') },
            { id: 'profile', icon: <User size={20} />, label: t('tabs.profile') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              onClick={() => {
                setActiveTab(tab.id)
                closeOverlays()
                if (tab.id === 'shop') setSelectedCategory(null)
              }}
              className={`rp-tab-item flex flex-col items-center gap-1 transition-all border-0 bg-transparent ${activeTab === tab.id ? 'rp-tab-item-active scale-110' : ''}`}
            >
              {tab.icon}
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      {showLangModal ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-safe">
            <div className="text-sm font-black text-gray-900 mb-1">{t('lang.title')}</div>
            <div className="text-xs text-gray-500 mb-4">{t('lang.firstTip')}</div>
            <div className="space-y-2">
              {RP_MINIAPP_LANGS.map((l) => (
                <div
                  key={l.id}
                  className={`rp-card p-4 flex items-center justify-between ${lang === l.id ? 'border-indigo-200 bg-indigo-50/30' : ''}`}
                  onClick={() => {
                    setLang(l.id)
                    setShowLangModal(false)
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{l.label}</div>
                    <div className="text-[10px] text-gray-400">{rpMiniAppGetLangLabel(l.id)}</div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-500">{l.id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="fixed left-0 right-0 bottom-24 z-[70] max-w-md mx-auto px-4 pointer-events-none">
          <div className="bg-black/80 text-white rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="text-sm font-bold">{toast.title}</div>
            <div className="text-[11px] opacity-90 mt-0.5 truncate">{toast.desc}</div>
          </div>
        </div>
      ) : null}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
