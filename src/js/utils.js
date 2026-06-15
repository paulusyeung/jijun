// 工具函數模組
import { getCurrentLanguage } from './i18n.js';

function _resolveLocale() {
  const lang = getCurrentLanguage();
  if (lang === 'zh-TW') return 'zh-TW';
  if (lang === 'zh-CN') return 'zh-CN';
  return 'en-US';
}

/**
 * 轉義 HTML 特殊字元，防止 XSS 攻擊
 * @param {string} str - 要轉義的字串
 * @returns {string} 轉義後的安全字串
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const DANGEROUS_HTML_TAGS = new Set(['script', 'object', 'embed', 'iframe', 'link', 'style'])
const SVG_ALLOWED_TAGS = new Set([
  'svg', 'g', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'a',
  'defs', 'lineargradient', 'radialgradient', 'stop', 'symbol', 'use', 'clippath',
  'mask', 'pattern', 'image', 'text', 'tspan', 'title', 'desc'
])
const URL_ATTRS = new Set(['href', 'src', 'xlink:href'])

function stripUnsafeAttributes(element) {
  for (const attr of [...element.attributes]) {
    const attrName = attr.name.toLowerCase()
    const attrValue = attr.value.trim()

    if (attrName.startsWith('on')) {
      element.removeAttribute(attr.name)
      continue
    }

    if (URL_ATTRS.has(attrName) && /^javascript:/i.test(attrValue)) {
      element.removeAttribute(attr.name)
    }
  }
}

function sanitizeNodeTree(root, options = {}) {
  const { allowedTags = null, removeTags = null } = options
  if (root.nodeType === Node.ELEMENT_NODE) {
    const rootTagName = root.tagName.toLowerCase()

    if (removeTags?.has(rootTagName)) {
      root.remove()
      return
    }

    if (!allowedTags || allowedTags.has(rootTagName)) {
      stripUnsafeAttributes(root)
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  const nodes = []

  while (walker.nextNode()) {
    nodes.push(walker.currentNode)
  }

  for (const element of nodes) {
    const tagName = element.tagName.toLowerCase()

    if (removeTags?.has(tagName)) {
      element.remove()
      continue
    }

    if (allowedTags && !allowedTags.has(tagName)) {
      element.remove()
      continue
    }

    stripUnsafeAttributes(element)
  }
}

export function escAttr(str) {
  return escapeHTML(str)
}

export function sanitizeHTML(str) {
  if (str === null || str === undefined) return ''

  const template = document.createElement('template')
  template.innerHTML = String(str)
  sanitizeNodeTree(template.content, { removeTags: DANGEROUS_HTML_TAGS })
  return template.innerHTML
}

export function sanitizeSVG(svgString) {
  if (svgString === null || svgString === undefined) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(String(svgString), 'image/svg+xml')
  if (doc.querySelector('parsererror')) {
    return ''
  }

  sanitizeNodeTree(doc.documentElement, { allowedTags: SVG_ALLOWED_TAGS, removeTags: DANGEROUS_HTML_TAGS })
  return new XMLSerializer().serializeToString(doc.documentElement)
}

export function sanitizeText(str) {
  return escapeHTML(str)
}

/**
 * 格式化日期為 YYYY-MM-DD 格式（避免時區問題）
 * @param {Date} date - 日期對象
 * @returns {string} 格式化後的日期字串
 */
export function formatDateToString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化貨幣顯示
 * @param {number} amount - 金額
 * @returns {string} 格式化後的貨幣字串
 */
export function customConfirm(message, title = '提示') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-wabi-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-xl transform transition-all">
                <div class="p-6">
                    <h3 class="text-lg font-bold text-wabi-text-primary mb-2">${escapeHTML(title)}</h3>
                    <p class="text-wabi-text-secondary text-sm">${escapeHTML(message)}</p>
                </div>
                <div class="flex border-t border-wabi-border">
                    <button class="custom-confirm-cancel flex-1 py-3 text-wabi-text-secondary font-medium hover:bg-wabi-bg transition-colors border-r border-wabi-border">取消</button>
                    <button class="custom-confirm-ok flex-1 py-3 text-wabi-primary font-bold hover:bg-wabi-bg transition-colors">確定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.custom-confirm-cancel').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });

        modal.querySelector('.custom-confirm-ok').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
    });
}

export function customAlert(message, title = '提示') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-wabi-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-xl transform transition-all">
                <div class="p-6">
                    <h3 class="text-lg font-bold text-wabi-text-primary mb-2">${escapeHTML(title)}</h3>
                    <p class="text-wabi-text-secondary text-sm">${escapeHTML(message)}</p>
                </div>
                <div class="flex border-t border-wabi-border">
                    <button class="custom-alert-ok flex-1 py-3 text-wabi-primary font-bold hover:bg-wabi-bg transition-colors">確定</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.custom-alert-ok').addEventListener('click', () => {
            modal.remove();
            resolve();
        });
    });
}

export function formatCurrency(amount) {
  if (isNaN(amount)) return '0'
  return new Intl.NumberFormat(_resolveLocale(), {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('NT$', '$')
}

/**
 * 格式化日期顯示
 * @param {string|Date} date - 日期
 * @param {string} format - 格式類型 ('short', 'long', 'month-day')
 * @returns {string} 格式化後的日期字串
 */
export function formatDate(date, format = 'short') {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(_resolveLocale(), {
        month: '2-digit',
        day: '2-digit'
      })
    case 'long':
      return dateObj.toLocaleDateString(_resolveLocale(), {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    case 'month-day':
      return dateObj.toLocaleDateString(_resolveLocale(), {
        month: 'short',
        day: 'numeric'
      })
    default:
      return dateObj.toLocaleDateString(_resolveLocale())
  }
}

/**
 * 顯示提示訊息
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 ('success', 'error', 'info')
 * @param {number} duration - 顯示時間（毫秒）
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastMessage) {
        console.error('Toast elements not found in the DOM.');
        return;
    }

    // Set message
    toastMessage.textContent = message;

    // Reset classes
    toast.classList.remove('bg-wabi-income', 'bg-wabi-expense', 'bg-wabi-primary', 'toast-hide', 'text-wabi-surface', 'text-wabi-surface');

    // Apply new classes based on type
    switch (type) {
        case 'success':
            toast.classList.add('bg-wabi-income', 'text-wabi-surface');
            break;
        case 'error':
            toast.classList.add('bg-wabi-expense', 'text-wabi-surface');
            break;
        case 'warning':
            toast.classList.add('bg-yellow-500', 'text-wabi-surface');
            break;
        case 'info':
        default:
            toast.classList.add('bg-wabi-primary', 'text-wabi-surface');
            break;
    }

    // Show toast
    toast.classList.add('toast-show');

    // Hide after duration
    setTimeout(() => {
        toast.classList.replace('toast-show', 'toast-hide');
    }, duration);
}

/**
 * 防抖函數
 * @param {Function} func - 要防抖的函數
 * @param {number} wait - 等待時間（毫秒）
 * @returns {Function} 防抖後的函數
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 節流函數
 * @param {Function} func - 要節流的函數
 * @param {number} limit - 時間限制（毫秒）
 * @returns {Function} 節流後的函數
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 深拷貝對象
 * @param {any} obj - 要拷貝的對象
 * @returns {any} 拷貝後的對象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 生成唯一 ID
 * @returns {string} 唯一 ID
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback：舊瀏覽器
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 驗證日期格式
 * @param {string} dateString - 日期字串
 * @returns {boolean} 是否為有效日期
 */
export function isValidDate(dateString) {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * 獲取日期範圍
 * @param {string} period - 期間類型 ('today', 'week', 'month', 'year')
 * @returns {object} 包含 startDate 和 endDate 的對象
 */
export function getDateRange(period) {
  const today = new Date()
  
  switch (period) {
    case 'last7days': {
      // 近七日
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6) // 包含今天，所以是 -6
      return {
        startDate: formatDateToString(sevenDaysAgo),
        endDate: formatDateToString(today)
      }
    }
    case 'lastmonth': {
      // 上月
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        startDate: formatDateToString(lastMonthStart),
        endDate: formatDateToString(lastMonthEnd)
      }
    }
    case 'year': {
      // 今年
      const yearStart = new Date(today.getFullYear(), 0, 1)
      const yearEnd = new Date(today.getFullYear(), 11, 31)
      return {
        startDate: formatDateToString(yearStart),
        endDate: formatDateToString(yearEnd)
      }
    }
    case 'today': {
      const todayStr = formatDateToString(today)
      return {
        startDate: todayStr,
        endDate: todayStr
      }
    }
    case 'week': {
      // 本週
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return {
        startDate: formatDateToString(startOfWeek),
        endDate: formatDateToString(endOfWeek)
      }
    }
    case 'month': {
      // 本月 - 使用年月直接構造，避免時區問題
      const year = today.getFullYear()
      const month = today.getMonth() + 1 // getMonth() 返回 0-11，需要 +1
      const startOfMonth = `${year}-${month.toString().padStart(2, '0')}-01`
      
      // 計算本月最後一天
      const lastDay = new Date(year, month, 0).getDate() // month 參數這裡不用 +1，因為 Date 構造函數中 month 是 0-based
      const endOfMonth = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
      
      return {
        startDate: startOfMonth,
        endDate: endOfMonth
      }
    }
    default: {
      const defaultStr = formatDateToString(today)
      return {
        startDate: defaultStr,
        endDate: defaultStr
      }
    }
  }
}

/**
 * 獲取指定年月的日期範圍
 * @param {number} year - 年份
 * @param {number} monthIndex - 月份 (0-11)
 * @returns {object} 包含 startDate 和 endDate 的對象
 */
export function getMonthRange(year, monthIndex) {
  const startOfMonth = new Date(year, monthIndex, 1);
  const endOfMonth = new Date(year, monthIndex + 1, 0);
  return {
    startDate: formatDateToString(startOfMonth),
    endDate: formatDateToString(endOfMonth)
  };
}

/**
 * 計算下一個週期性交易日期
 * @param {string} currentDueDate - 當前到期日期 (YYYY-MM-DD)
 * @param {string} frequency - 頻率 ('daily', 'weekly', 'monthly', 'yearly')
 * @param {number} interval - 間隔 (例如：每 2 週)
 * @returns {string} 下一個到期日期 (YYYY-MM-DD)
 */
export function calculateNextDueDate(currentDueDate, frequency, interval) {
  const date = new Date(currentDueDate);
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (interval * 7));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval);
      break;
    default:
      throw new Error('Invalid frequency');
  }
  return formatDateToString(date);
}

/**
 * 檢查日期是否應根據規則列表跳過
 * @param {Date} date - 要檢查的日期對象
 * @param {Array|null} skipRules - 略過規則對象的陣列
 * @returns {boolean} 如果應跳過則為 true
 */
export function shouldSkipDate(date, skipRules) {
  if (!skipRules || !Array.isArray(skipRules) || skipRules.length === 0) {
    return false;
  }

  for (const rule of skipRules) {
    if (!rule.values || rule.values.length === 0) {
      continue;
    }
    const { type, values } = rule;
    let match = false;
    switch (type) {
      case 'dayOfWeek':
        match = values.includes(date.getDay()); // 0 (Sun) to 6 (Sat)
        break;
      case 'dayOfMonth':
        match = values.includes(date.getDate()); // 1 to 31
        break;
      case 'monthOfYear':
        match = values.includes(date.getMonth()); // 0 (Jan) to 11 (Dec)
        break;
    }
    if (match) {
      return true; // If any rule matches, skip the date
    }
  }

  return false; // If no rules matched, do not skip
}

// ── 原生平台偵測 ──────────────────────────────────────
const _isNative = typeof window !== 'undefined'
    && window.Capacitor?.isNativePlatform?.() === true;

// ── Haptic Feedback ──────────────────────────────────
let _hapticEnabled = true;
let _hapticLastCall = 0;

/**
 * 設定 haptic feedback 啟用狀態
 * @param {boolean} enabled
 */
export function setHapticEnabled(enabled) {
    _hapticEnabled = enabled;
}

/**
 * 觸發震動回饋（debound 50ms），僅原生平台有效
 */
export function triggerHaptic() {
    if (!_isNative || !_hapticEnabled) return;
    const now = Date.now();
    if (now - _hapticLastCall < 50) return;
    _hapticLastCall = now;
    import('@capacitor/haptics').then(({ Haptics }) => {
        Haptics.vibrate({ duration: 20 });
    }).catch(() => {});
}

// ── Native Share Sheet ───────────────────────────────

/**
 * 使用原生分享面板分享內容
 * @param {object} options - { title, text, url }
 */
export async function nativeShare(options) {
    if (_isNative) {
        try {
            const { Share } = await import('@capacitor/share');
            await Share.share(options);
            return true;
        } catch (e) {
            console.warn('Native share failed:', e);
            return false;
        }
    }
    if (navigator.share) {
        try {
            await navigator.share(options);
            return true;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.warn('Web share failed:', e);
            }
            return false;
        }
    }
    if (options.url) {
        try {
            await navigator.clipboard.writeText(options.url);
            showToast('已複製連結至剪貼簿', 'success');
            return true;
        } catch (e) {
            console.warn('Clipboard failed:', e);
        }
    }
    return false;
}

// ── Native File Picker ───────────────────────────────

/**
 * 使用原生檔案選擇器選取檔案
 * @param {object} options - { accept: string }
 * @returns {Promise<File|null>}
 */
export async function nativeFilePicker(options = { accept: '.json,.csv' }) {
    if (_isNative) {
        try {
            const { Filesystem } = await import('@capacitor/filesystem');
            const result = await Filesystem.pickFile(options);
            if (result && result.path) {
                const response = await fetch(result.path);
                const blob = await response.blob();
                return new File([blob], result.name || 'imported_file', { type: blob.type });
            }
            return null;
        } catch (e) {
            console.warn('Native file picker failed:', e);
        }
    }
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = options.accept || '.json,.csv';
        input.onchange = () => {
            resolve(input.files?.[0] || null);
        };
        input.click();
    });
}

/**
 * 使用原生儲存檔案功能
 * @param {string} fileName
 * @param {string} content
 * @param {string} mimeType
 */
export async function nativeSaveFile(fileName, content, mimeType = 'application/json') {
    if (_isNative) {
        try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const result = await Filesystem.writeFile({
                path: `Download/${fileName}`,
                data: content,
                directory: Directory.External,
            });
            showToast(`已儲存至「下載」資料夾: ${fileName}`, 'success');
            return result;
        } catch (e) {
            console.warn('Native save failed:', e);
        }
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Status Bar ───────────────────────────────────────

/**
 * 設定狀態列樣式
 * @param {boolean} isDark - 是否為深色/暗色主題
 */
export async function setStatusBarStyle(isDark) {
    if (!_isNative) return;
    try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        if (isDark) {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
        } else {
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: '#F5F5F3' });
        }
    } catch (e) {
        console.warn('StatusBar style failed:', e);
    }
}

/**
 * 計算攤提/分期/折舊的每期金額與理論總額
 * @param {number} principal - 本金 (總額 - 首付)
 * @param {number} periods - 總期數
 * @param {number} annualRate - 年利率 (百分比，例如 3.5 = 3.5%)
 * @param {string} frequency - 扣款頻率 ('monthly', 'weekly', 'yearly')
 * @param {string} decimalStrategy - 小數點處理 ('round', 'ceil', 'floor', 'keep')
 * @returns {object} { amountPerPeriod, exactTotalToPay }
 */
export function calculateAmortizationDetails(principal, periods, annualRate, frequency, decimalStrategy = 'round') {
  if (principal <= 0 || periods <= 0) {
    return { amountPerPeriod: 0, exactTotalToPay: 0 };
  }

  let exactPMT;
  let exactTotalToPay;

  if (annualRate > 0) {
    let periodRate = annualRate / 100 / 12;
    if (frequency === 'weekly') periodRate = annualRate / 100 / 52;
    else if (frequency === 'yearly') periodRate = annualRate / 100;
    
    exactPMT = principal * (periodRate * Math.pow(1 + periodRate, periods)) / (Math.pow(1 + periodRate, periods) - 1);
    exactTotalToPay = exactPMT * periods;
  } else {
    exactPMT = principal / periods;
    exactTotalToPay = principal;
  }

  let amountPerPeriod;
  if (decimalStrategy === 'ceil') amountPerPeriod = Math.ceil(exactPMT);
  else if (decimalStrategy === 'floor') amountPerPeriod = Math.floor(exactPMT);
  else if (decimalStrategy === 'round') amountPerPeriod = Math.round(exactPMT);
  else amountPerPeriod = Math.round(exactPMT * 100) / 100;

  return { amountPerPeriod, exactTotalToPay };
}

// ── Token Encryption (Web Crypto PBKDF2 + AES-GCM) ───

/**
 * 使用 PBKDF2 從 deviceSecret + salt 推導 AES-GCM 金鑰
 * @param {string} deviceSecret - 裝置專屬密鑰材料（如 deviceId）
 * @param {Uint8Array} salt - 隨機鹽值（16 bytes）
 * @param {number} iterations - PBKDF2 迭代次數（預設 100000）
 * @returns {Promise<CryptoKey>}
 */
export async function deriveDeviceKey(deviceSecret, salt, iterations = 100000) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(deviceSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用 AES-GCM 加密資料
 * @param {string} plaintext - 明文
 * @param {CryptoKey} key - AES-GCM 金鑰
 * @returns {Promise<{ iv: Uint8Array, ciphertext: ArrayBuffer }>}
 */
export async function encryptData(plaintext, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  return { iv, ciphertext };
}

/**
 * 使用 AES-GCM 解密資料
 * @param {ArrayBuffer} ciphertext - 密文
 * @param {CryptoKey} key - AES-GCM 金鑰
 * @param {Uint8Array} iv - 初始向量
 * @returns {Promise<string>}
 */
export async function decryptData(ciphertext, key, iv) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * 將 Uint8Array 轉為 base64url 字串
 */
export function bufferToBase64URL(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 將 base64url 字串轉為 Uint8Array
 */
export function base64URLToBuffer(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}