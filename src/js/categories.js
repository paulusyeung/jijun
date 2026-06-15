// 分類配置模組
import { t } from './i18n.js';

export const CATEGORIES = {
  expense: [
    { id: 'food',           name: '飲食',     icon: 'fas fa-utensils',         color: 'bg-red-500',   groupId: 'dining', nameKey: 'categories:food' },
    { id: 'life',           name: '日常',     icon: 'fas fa-home',             color: 'bg-blue-500',  groupId: 'living', nameKey: 'categories:life' },
    { id: 'traffic',        name: '交通',     icon: 'fas fa-car',              color: 'bg-green-500', groupId: 'transport', nameKey: 'categories:traffic' },
    { id: 'fun',            name: '娛樂',     icon: 'fas fa-gamepad',          color: 'bg-purple-500',groupId: 'entertainment', nameKey: 'categories:fun' },
    { id: 'medi',           name: '醫療',     icon: 'fas fa-hospital',         color: 'bg-pink-500',  groupId: 'medical', nameKey: 'categories:medi' },
    { id: 'edu',            name: '教育',     icon: 'fas fa-book',             color: 'bg-indigo-500',groupId: 'education', nameKey: 'categories:edu' },
    { id: 'debt_repayment', name: '還款',     icon: 'fas fa-hand-holding-usd', color: 'bg-orange-500', groupId: 'finance', nameKey: 'categories:debt_repayment' },
    { id: 'another',        name: '其他',     icon: 'fas fa-box',              color: 'bg-gray-500',  groupId: 'other', nameKey: 'categories:another' }
  ],
  income: [
    { id: 'salary',          name: '薪水',     icon: 'fas fa-money-bill-wave',  color: 'bg-green-600', groupId: 'salary', nameKey: 'categories:salary' },
    { id: 'bonus',           name: '獎金',     icon: 'fas fa-gift',             color: 'bg-yellow-500',groupId: 'extra_income', nameKey: 'categories:bonus' },
    { id: 'pocket',          name: '零用錢',   icon: 'fas fa-wallet',           color: 'bg-pink-400',  groupId: 'extra_income', nameKey: 'categories:pocket' },
    { id: 'parttime',        name: '兼職',     icon: 'fas fa-clock',            color: 'bg-blue-400',  groupId: 'extra_income', nameKey: 'categories:parttime' },
    { id: 'invest',          name: '投資',     icon: 'fas fa-chart-line',       color: 'bg-emerald-500', groupId: 'investment', nameKey: 'categories:invest' },
    { id: 'interest',        name: '利息',     icon: 'fas fa-university',       color: 'bg-cyan-500',  groupId: 'investment', nameKey: 'categories:interest' },
    { id: 'debt_collection', name: '欠款回收', icon: 'fas fa-hand-holding-usd', color: 'bg-orange-500', groupId: 'finance_income', nameKey: 'categories:debt_collection' },
    { id: 'another',         name: '其他',     icon: 'fas fa-box',              color: 'bg-gray-500',  groupId: 'other_income', nameKey: 'categories:another_income' }
  ]
}

export function getCategoryById(type, id) {
  let category = CATEGORIES[type].find(cat => cat.id === id)
  if (!category && window.app && window.app.categoryManager) {
    const customCategories = window.app.categoryManager.customCategories[type] || []
    category = customCategories.find(cat => cat.id === id)
  }
  return category
}

export function getCategoryName(type, id) {
  const category = getCategoryById(type, id)
  if (!category) return t('categories:unknown', '未知分類');
  return category.nameKey ? t(category.nameKey) : category.name;
}

export function getCategoryIcon(type, id) {
  const category = getCategoryById(type, id)
  return category ? category.icon : 'fas fa-question'
}