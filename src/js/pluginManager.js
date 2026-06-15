import { showToast } from './utils.js';
import Chart from 'chart.js/auto';
import { PluginStorage } from './pluginStorage.js';

/**
 * 在 iframe 內執行的啟動腳本（透過 srcdoc 注入）
 * 建立基於 postMessage 的 context Proxy，讓插件享有與舊版相同的 API 表面
 */
const IFRAME_BOOTSTRAP = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body>
<script type="module">
const _pending = new Map();
const _callbacks = {};
let _cbCounter = 1;

function call(channelId, ns, method, args) {
  const callId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    _pending.set(callId, { resolve, reject });
    window.parent.postMessage(
      { type: 'pm_api_call', channelId, callId, ns, method, args },
      '*'
    );
  });
}

window.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.callId && _pending.has(d.callId)) {
    const p = _pending.get(d.callId);
    _pending.delete(d.callId);
    if (d.error) p.reject(new Error(d.error));
    else p.resolve(d.result);
  }
  if (d.type === 'pm_render_call') {
    const fn = _callbacks[d.callbackId];
    if (fn) {
      Promise.resolve(fn(...d.args)).then(
        (result) => e.source.postMessage({ type: 'pm_render_result', channelId: d.channelId, callbackId: d.callbackId, result }, '*'),
        (err) => e.source.postMessage({ type: 'pm_render_result', channelId: d.channelId, callbackId: d.callbackId, error: err.message }, '*')
      );
    }
  }
});

function createContext(channelId) {
  return {
    appName: 'Easy Accounting',
    version: '',
    activeLedgerId: () => call(channelId, 'meta', 'activeLedgerId', []),
    lib: {},
    storage: {
      getItem:   (k) => call(channelId, 'storage', 'getItem', [k]),
      setItem:   (k,v) => call(channelId, 'storage', 'setItem', [k,v]),
      removeItem:(k) => call(channelId, 'storage', 'removeItem', [k]),
      clear:     () => call(channelId, 'storage', 'clear', []),
      getJSON:   (k) => call(channelId, 'storage', 'getJSON', [k]),
      setJSON:   (k,v) => call(channelId, 'storage', 'setJSON', [k,v]),
    },
    data: {
      getRecords:    () => call(channelId, 'data', 'getRecords', []),
      getDebts:      () => call(channelId, 'data', 'getDebts', []),
      getContacts:   () => call(channelId, 'data', 'getContacts', []),
      getAccounts:   () => call(channelId, 'data', 'getAccounts', []),
      getCategories: (t) => call(channelId, 'data', 'getCategories', [t]),
      getCategory:   (t,i) => call(channelId, 'data', 'getCategory', [t,i]),
      addRecord:     (r) => call(channelId, 'data', 'addRecord', [r]),
      addDebt:       (d) => call(channelId, 'data', 'addDebt', [d]),
      addContact:    (c) => call(channelId, 'data', 'addContact', [c]),
    },
    ui: {
      showToast:  (m,t) => call(channelId, 'ui', 'showToast', [m,t]),
      showConfirm:(t,m) => call(channelId, 'ui', 'showConfirm', [t,m]),
      showAlert:  (t,m) => call(channelId, 'ui', 'showAlert', [t,m]),
      navigateTo: (h) => call(channelId, 'ui', 'navigateTo', [h]),
      openAddPage:(d) => call(channelId, 'ui', 'openAddPage', [d]),
      registerPage: (routeId, title, renderFn) => {
        const cbId = 'cb_' + (_cbCounter++);
        _callbacks[cbId] = renderFn;
        return call(channelId, 'ui', 'registerPage', [routeId, title, cbId]);
      },
      registerHomeWidget: (id, renderFn) => {
        const cbId = 'cb_' + (_cbCounter++);
        _callbacks[cbId] = renderFn;
        return call(channelId, 'ui', 'registerHomeWidget', [id, cbId]);
      },
    },
    events: {
      on: (hookName, callback) => {
        const cbId = 'cb_' + (_cbCounter++);
        _callbacks[cbId] = callback;
        return call(channelId, 'events', 'on', [hookName, cbId]);
      },
      off: (hookName) => call(channelId, 'events', 'off', [hookName]),
    },
    hooks: {},
  };
}

window.addEventListener('message', async (e) => {
  if (e.data && e.data.type === 'pm_init') {
    const { channelId, pluginCode, version, lib } = e.data;
    try {
      const b64 = btoa(unescape(encodeURIComponent(pluginCode)));
      const url = 'data:text/javascript;base64,' + b64;
      const mod = await import(url);
      const ctx = createContext(channelId);
      ctx.version = version || '';
      ctx.lib = lib || {};
      if (mod.default && typeof mod.default.init === 'function') {
        mod.default.init(ctx);
        e.source.postMessage({ type: 'pm_ready', channelId }, '*');
      } else {
        e.source.postMessage({ type: 'pm_error', channelId, error: 'Plugin has no init function' }, '*');
      }
    } catch (err) {
      e.source.postMessage({ type: 'pm_error', channelId, error: err.message }, '*');
    }
  }
});
</script>
</body></html>
`;

export class PluginManager {
  constructor(dataService, app) {
    this.dataService = dataService;
    this.app = app;
    this.plugins = new Map();
    this.customPages = new Map();
    this.homeWidgets = new Map();
    this.widgetOrder = [];
    this.hiddenWidgets = [];
    this.hooks = new Map();

    // V2 iframe sandbox state
    this.sandboxV2Enabled = false;
    this._iframeChannels = new Map(); // channelId -> { iframe, pluginId, callbacks, pendingCalls }
    this._nextCallbackId = 1;

    // Parent-side message handler for iframe channels
    this._iframeMessageHandler = this._handleIframeMessage.bind(this);
  }

  async init() {
    const savedOrder = await this.dataService.getSetting('widgetOrder');
    this.widgetOrder = savedOrder ? savedOrder.value : [];
    const savedHidden = await this.dataService.getSetting('hiddenWidgets');
    this.hiddenWidgets = savedHidden ? savedHidden.value : [];

    // 10.1 載入沙盒 V2 功能開關
    const flagSetting = await this.dataService.getSetting('pluginSandboxV2');
    this.sandboxV2Enabled = flagSetting?.value === true;

    await this.loadInstalledPlugins();
  }

  /** 啟用 V2 沙盒模式 */
  isSandboxV2Enabled() { return this.sandboxV2Enabled; }

  // ==================== 安全工具 ====================

  /** 防止 XSS：將 HTML 特殊字元轉義 */
  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 權限強制工具 ====================

  /** 建立拒絕存取的 Proxy 替身（僅用於舊版沙盒） */
  _denied(group, permNeeded) {
    const label = PluginManager.PERMISSION_LABELS[permNeeded]?.label || permNeeded;
    return new Proxy({}, {
      get: (_, prop) => () => {
        throw new Error(`Permission Denied: 此插件未取得「${label}」權限，無法呼叫 context.${group}.${prop}()`);
      }
    });
  }

  /** 建立舊版插件 context（僅用於舊版沙盒） */
  createPluginContext(pluginId, permissions = [], initializedStorage = null) {
    const has = (perm) => permissions.includes(perm);

    const storage = has('storage') && pluginId && initializedStorage
      ? initializedStorage
      : this._denied('storage', 'storage');

    const dataRead = has('data:read') ? {
      getRecords: () => this.dataService.getRecords(),
      getDebts: () => this.dataService.getDebts(),
      getContacts: () => this.dataService.getContacts(),
      getAccounts: () => this.dataService.getAccounts(),
      getCategories: (type) => this.app.categoryManager.getAllCategories(type),
      getCategory: (type, id) => this.app.categoryManager.getCategoryById(type, id),
      getCategoryGroups: (type) => this.app.categoryManager.getGroupedCategories(type)
    } : {};

    const dataWrite = has('data:write') ? {
      addRecord: (record) => this.dataService.addRecord(record),
      addDebt: (debt) => this.dataService.addDebt(debt),
      addContact: (contact) => this.dataService.addContact(contact),
    } : {};

    const dataApi = (has('data:read') || has('data:write'))
      ? { ...dataRead, ...dataWrite }
      : this._denied('data', 'data:read');

    if (has('data:read') && !has('data:write')) {
      const writeDenied = this._denied('data', 'data:write');
      dataApi.addRecord = writeDenied.addRecord;
      dataApi.addDebt = writeDenied.addDebt;
      dataApi.addContact = writeDenied.addContact;
    }
    if (has('data:write') && !has('data:read')) {
      const readDenied = this._denied('data', 'data:read');
      dataApi.getRecords = readDenied.getRecords;
      dataApi.getDebts = readDenied.getDebts;
      dataApi.getContacts = readDenied.getContacts;
      dataApi.getAccounts = readDenied.getAccounts;
      dataApi.getCategories = readDenied.getCategories;
      dataApi.getCategory = readDenied.getCategory;
    }

    const uiApi = has('ui') ? {
      showToast: (msg, type) => showToast(msg, type),
      registerPage: (routeId, title, renderFn) => this.registerPage(routeId, title, renderFn),
      registerHomeWidget: (id, renderFn) => this.registerHomeWidget(id, renderFn),
      navigateTo: (hash) => { window.location.hash = hash; },
      openAddPage: (data) => {
           if (data) sessionStorage.setItem('temp_add_data', JSON.stringify(data));
           window.location.hash = `#add?t=${Date.now()}`;
      },
      showConfirm: (title, message) => this.showConfirmModal(title, message),
      showAlert: (title, message) => this.showAlertModal(title, message)
    } : this._denied('ui', 'ui');

    const eventsApi = {
      on: (hookName, callback) => this.registerHook(hookName, callback),
      off: (hookName, callback) => this.unregisterHook(hookName, callback)
    };

    return {
      appName: 'Easy Accounting',
      version: __APP_VERSION__,
      activeLedgerId: () => this.dataService.activeLedgerId,
      lib: { Chart: Chart },
      storage,
      data: dataApi,
      ui: uiApi,
      events: eventsApi,
      hooks: {}
    };
  }

  async loadInstalledPlugins() {
    try {
        const tx = this.dataService.db.transaction('plugins', 'readonly');
        const store = tx.objectStore('plugins');
        const plugins = await store.getAll();
        
        for (const pluginData of plugins) {
            if (pluginData.enabled) {
                await this.loadPlugin(pluginData);
            }
        }
    } catch (e) {
        // If store doesn't exist (schema not upgraded yet?), ignore
        console.warn('Plugins store access failed (might be first run with new version):', e);
    }
  }

  // ==================== 沙盒包裝器 ====================

  /** 生成沙盒前綴程式碼，根據權限阻擋全域儲存、危險 API 與網路存取 */
  _getSandboxWrapper(permissions = []) {
    const hasNetwork = permissions.includes('network');

    // 網路 API 阻擋（僅在無 network 權限時生成）
    const networkBlock = hasNetwork ? '' : `
      const fetch = () => { throw new Error("Permission Denied: 此插件未取得「網路存取」權限，無法使用 fetch()") };
      const XMLHttpRequest = function() { throw new Error("Permission Denied: 此插件未取得「網路存取」權限，無法使用 XMLHttpRequest") };
      const WebSocket = function() { throw new Error("Permission Denied: 此插件未取得「網路存取」權限，無法使用 WebSocket") };
      const EventSource = function() { throw new Error("Permission Denied: 此插件未取得「網路存取」權限，無法使用 EventSource") };
    `;

    // Proxy 中要阻擋的網路屬性清單
    const networkProxyBlock = hasNetwork ? '' : `
           if (prop === 'fetch' || prop === 'XMLHttpRequest' || prop === 'WebSocket' || prop === 'EventSource') {
               throw new Error("Permission Denied: 此插件未取得「網路存取」權限");
           }
    `;

    return `
      // ===== Plugin Sandbox =====
      // 最先取得真正的全域物件（必須在 Function 被覆蓋前執行）
      const _realGlobal = (new Function("return this"))();

      const localStorage = {
        getItem: () => { throw new Error("Access Denied: Please use context.storage.getItem()") },
        setItem: () => { throw new Error("Access Denied: Please use context.storage.setItem()") },
        removeItem: () => { throw new Error("Access Denied: Please use context.storage.removeItem()") },
        clear: () => { throw new Error("Access Denied: Please use context.storage.clear()") },
        key: () => { throw new Error("Access Denied: Please use context.storage") },
        length: 0
      };
      const sessionStorage = {
        getItem: () => { throw new Error("Access Denied: Please use context.storage") },
        setItem: () => { throw new Error("Access Denied: Please use context.storage") },
        removeItem: () => { throw new Error("Access Denied: Please use context.storage") },
        clear: () => { throw new Error("Access Denied: Please use context.storage") }
      };
      const indexedDB = {
        open: () => { throw new Error("Access Denied: IndexedDB is not allowed in plugins.") },
        deleteDatabase: () => { throw new Error("Access Denied: IndexedDB is not allowed in plugins.") }
      };

      // 網路 API 阻擋（根據權限動態生成）
      ${networkBlock}

      // 注意：Function/eval 透過 Proxy 攔截 window.Function / window.eval

      const _windowProxyHandler = {
        get(target, prop) {
           if (prop === 'localStorage' || prop === 'sessionStorage' || prop === 'indexedDB') {
               throw new Error("Access Denied: Please use context.storage");
           }
           if (prop === 'Function') {
               throw new Error("Access Denied: Function constructor is not allowed in plugins.");
           }
           if (prop === 'eval') {
               throw new Error("Access Denied: eval() is not allowed in plugins.");
           }
           ${networkProxyBlock}
           let value = Reflect.get(target, prop);
           if (typeof value === 'function') {
              return value.bind(target);
           }
           return value;
        },
        set(target, prop, value) {
           if (prop === 'localStorage' || prop === 'sessionStorage' || prop === 'indexedDB') {
                throw new Error("Access Denied: Cannot overwrite global storage");
           }
           return Reflect.set(target, prop, value);
        }
      };

      const window = new Proxy(_realGlobal, _windowProxyHandler);
      const self = window;
      const globalThis = window;
      // ===== End Sandbox =====
    `;
  }

  async loadPlugin(pluginData) {
    if (this.sandboxV2Enabled) {
      return this._loadPluginInIframe(pluginData);
    }
    return this._loadPluginLegacy(pluginData);
  }

  /** 舊版沙盒：Proxy + Blob URL */
  async _loadPluginLegacy(pluginData) {
    try {
        if (pluginData.scriptHash) {
            const computedHash = await this._computeSHA256(pluginData.script);
            if (computedHash !== pluginData.scriptHash) {
                console.warn(`Plugin ${pluginData.name}: Script hash mismatch (possible tampering). Expected ${pluginData.scriptHash}, got ${computedHash}.`);
                showToast(`插件「${pluginData.name}」檔案已遭篡改，載入中止`, 'error');
                return;
            }
        }

        const perms = pluginData.permissions || [];
        const sandboxedScript = `
          ${this._getSandboxWrapper(perms)}
          ${pluginData.script}
        `;

        const blob = new Blob([sandboxedScript], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const module = await import(url);
        if (module.default && typeof module.default.init === 'function') {
            let storage = null;
            if (perms.includes('storage')) {
                storage = new PluginStorage(pluginData.id, this.dataService);
                await storage.init();
            }

            const context = this.createPluginContext(pluginData.id, perms, storage);
            module.default.init(context);
            this.plugins.set(pluginData.id, module.default);
            console.log(`Plugin loaded (legacy): ${pluginData.name}`);
        } else {
            console.warn(`Plugin ${pluginData.name} has no init function.`);
        }
        
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error(`Error loading plugin ${pluginData.name}:`, e);
        showToast(`插件 ${pluginData.name} 載入失敗`, 'error');
    }
  }

  // ==================== V2 iframe 沙盒 ====================

  /**
   * 10.2 在 sandboxed iframe 中載入插件
   * 10.7 若 iframe 建立失敗則退回舊版沙盒
   */
  async _loadPluginInIframe(pluginData) {
    let channelId = null;
    try {
        if (pluginData.scriptHash) {
            const computedHash = await this._computeSHA256(pluginData.script);
            if (computedHash !== pluginData.scriptHash) {
                console.warn(`Plugin ${pluginData.name}: Script hash mismatch (possible tampering). Expected ${pluginData.scriptHash}, got ${computedHash}.`);
                showToast(`插件「${pluginData.name}」檔案已遭篡改，載入中止`, 'error');
                return;
            }
        }

        channelId = crypto.randomUUID();
        const iframe = document.createElement('iframe');

        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.style.display = 'none';
        iframe.srcdoc = IFRAME_BOOTSTRAP;

        // 註冊 channel（10.4：使用 channelId 驗證，而非 event.origin）
        const channelEntry = {
            iframe,
            pluginId: pluginData.id,
            pluginName: pluginData.name,
            permissions: pluginData.permissions || [],
            pendingCalls: new Map(),
            callbacks: new Map(), // callbackId -> function
            ready: false,
        };
        this._iframeChannels.set(channelId, channelEntry);

        // 如果已註冊，先移除舊的 listener
        window.removeEventListener('message', this._iframeMessageHandler);
        window.addEventListener('message', this._iframeMessageHandler);

        document.body.appendChild(iframe);

        // 等待 iframe 載入完成後發送初始化訊息
        await new Promise((resolve) => {
            iframe.onload = () => {
                const targetOrigin = '*'; // sandboxed iframe 的 origin 為 null
                iframe.contentWindow.postMessage({
                    type: 'pm_init',
                    channelId,
                    pluginCode: pluginData.script,
                    version: __APP_VERSION__,
                    lib: { /* Chart 無法序列化，留空由插件自行 import */ },
                }, targetOrigin);
                resolve();
            };
            // 若 iframe 已載入，onload 可能不會觸發
            if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
                iframe.onload();
            }
        });

        // 等待插件回覆 ready 或 error
        const result = await Promise.race([
            this._waitForChannelMessage(channelId, 'pm_ready', 10000),
            this._waitForChannelMessage(channelId, 'pm_error', 10000),
        ]);

        if (result.type === 'pm_error') {
            throw new Error(`Plugin iframe init error: ${result.error}`);
        }

        channelEntry.ready = true;
        this.plugins.set(pluginData.id, { _iframeChannel: channelId });
        console.log(`Plugin loaded (iframe V2): ${pluginData.name}`);

    } catch (e) {
        console.error(`Error loading plugin ${pluginData.name} in iframe:`, e);
        showToast(`插件 ${pluginData.name} iframe 載入失敗，使用舊版沙盒`, 'error');

        // 10.7 退回舊版沙盒
        if (this._iframeChannels.has(channelId)) {
            const entry = this._iframeChannels.get(channelId);
            if (entry.iframe && entry.iframe.parentNode) {
                entry.iframe.parentNode.removeChild(entry.iframe);
            }
            this._iframeChannels.delete(channelId);
        }

        return this._loadPluginLegacy(pluginData);
    }
  }

  /**
   * 等待來自 iframe 的特定類型訊息
   */
  _waitForChannelMessage(channelId, type, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${type}`)), timeout);
        const handler = (e) => {
            const data = e.data || {};
            if (data.channelId === channelId && data.type === type) {
                clearTimeout(timer);
                window.removeEventListener('message', handler);
                resolve(data);
            }
        };
        window.addEventListener('message', handler);
    });
  }

  /**
   * 10.3 + 10.4 處理 iframe 的 API 呼叫與渲染回呼
   * 驗證 channelId 後分派到對應的實際實作
   */
  async _handleIframeMessage(event) {
    const data = event.data || {};
    const { channelId, callId, type } = data;

    if (!channelId || !this._iframeChannels.has(channelId)) return;

    const channel = this._iframeChannels.get(channelId);
    const perms = channel.permissions;
    const has = (perm) => perms.includes(perm);
    const iframe = channel.iframe;
    const targetWindow = iframe && iframe.contentWindow;

    const sendResponse = (result) => {
        if (targetWindow) targetWindow.postMessage({ type: 'pm_api_response', channelId, callId, result }, '*');
    };
    const sendError = (error) => {
        if (targetWindow) targetWindow.postMessage({ type: 'pm_api_response', channelId, callId, error: error.message || String(error) }, '*');
    };

    // ── API 呼叫 ──
    if (type === 'pm_api_call') {
        const { ns, method, args = [] } = data;
        try {
            let result;
            switch (ns) {
                case 'storage': {
                    if (!has('storage')) throw new Error('Permission Denied: storage');
                    const storage = new PluginStorage(channel.pluginId, this.dataService);
                    await storage.init();
                    if (method === 'getItem') result = storage.getItem(args[0]);
                    else if (method === 'setItem') { storage.setItem(args[0], args[1]); result = undefined; }
                    else if (method === 'removeItem') { storage.removeItem(args[0]); result = undefined; }
                    else if (method === 'clear') { storage.clear(); result = undefined; }
                    else if (method === 'getJSON') result = storage.getJSON(args[0]);
                    else if (method === 'setJSON') { storage.setJSON(args[0], args[1]); result = undefined; }
                    else throw new Error(`Unknown storage method: ${method}`);
                    break;
                }
                case 'data': {
                    if (method.startsWith('get') && !has('data:read')) throw new Error('Permission Denied: data:read');
                    if (method.startsWith('add') && !has('data:write')) throw new Error('Permission Denied: data:write');
                    if (method === 'getRecords') result = await this.dataService.getRecords();
                    else if (method === 'getDebts') result = await this.dataService.getDebts();
                    else if (method === 'getContacts') result = await this.dataService.getContacts();
                    else if (method === 'getAccounts') result = await this.dataService.getAccounts();
                    else if (method === 'getCategories') result = this.app.categoryManager.getAllCategories(args[0]);
                    else if (method === 'getCategoryGroups') result = this.app.categoryManager.getGroupedCategories(args[0]);
                    else if (method === 'getCategory') result = this.app.categoryManager.getCategoryById(args[0], args[1]);
                    else if (method === 'addRecord') { await this.dataService.addRecord(args[0]); result = undefined; }
                    else if (method === 'addDebt') { await this.dataService.addDebt(args[0]); result = undefined; }
                    else if (method === 'addContact') { await this.dataService.addContact(args[0]); result = undefined; }
                    else throw new Error(`Unknown data method: ${method}`);
                    break;
                }
                case 'ui': {
                    if (!has('ui')) throw new Error('Permission Denied: ui');
                    if (method === 'showToast') { showToast(args[0], args[1]); result = undefined; }
                    else if (method === 'showConfirm') result = await this.showConfirmModal(args[0], args[1]);
                    else if (method === 'showAlert') result = await this.showAlertModal(args[0], args[1]);
                    else if (method === 'navigateTo') { window.location.hash = args[0]; result = undefined; }
                    else if (method === 'openAddPage') {
                        if (args[0]) sessionStorage.setItem('temp_add_data', JSON.stringify(args[0]));
                        window.location.hash = `#add?t=${Date.now()}`;
                        result = undefined;
                    }
                    else if (method === 'registerPage') {
                        const [routeId, title, cbId] = args;
                        this.registerPage(routeId, title, async (container) => {
                            try {
                                const res = await this._callIframeCallback(channelId, cbId, [container.outerHTML || '']);
                                if (res && typeof res === 'string') container.innerHTML = res;
                            } catch (e) { console.error('Error rendering iframe page:', e); }
                        });
                        result = undefined;
                    }
                    else if (method === 'registerHomeWidget') {
                        const [id, cbId] = args;
                        this.registerHomeWidget(id, async (container) => {
                            try {
                                const res = await this._callIframeCallback(channelId, cbId, ['']);
                                if (res && typeof res === 'string') container.innerHTML = res;
                            } catch (e) { console.error('Error rendering iframe widget:', e); }
                        });
                        result = undefined;
                    }
                    else throw new Error(`Unknown ui method: ${method}`);
                    break;
                }
                case 'events': {
                    if (method === 'on') {
                        const [hookName, cbId] = args;
                        this.registerHook(hookName, async (payload) => {
                            const res = await this._callIframeCallback(channelId, cbId, [payload]);
                            return res;
                        });
                        result = undefined;
                    } else if (method === 'off') {
                        this.unregisterHook(args[0], null);
                        result = undefined;
                    } else throw new Error(`Unknown events method: ${method}`);
                    break;
                }
                case 'meta': {
                    if (method === 'activeLedgerId') result = this.dataService.activeLedgerId;
                    else throw new Error(`Unknown meta method: ${method}`);
                    break;
                }
                default:
                    throw new Error(`Unknown namespace: ${ns}`);
            }
            sendResponse(result);
        } catch (e) {
            sendError(e);
        }
        return;
    }

    // ── 渲染結果回呼 ──
    if (type === 'pm_render_result') {
        const { callbackId, result, error } = data;
        const pending = channel.pendingCalls.get(callbackId);
        if (pending) {
            channel.pendingCalls.delete(callbackId);
            if (error) pending.reject(new Error(error));
            else pending.resolve(result);
        }
    }
  }

  /**
   * 註冊一個 iframe 中的回呼函數，回傳 callbackId
   */
  _registerCallback(channelId, fn) {
    if (typeof fn !== 'function') return null;
    const callbackId = `cb_${channelId}_${this._nextCallbackId++}`;
    const channel = this._iframeChannels.get(channelId);
    if (channel) {
        channel.callbacks.set(callbackId, fn);
    }
    return callbackId;
  }

  /**
   * 呼叫 iframe 中的回呼函數（透過 postMessage）
   */
  async _callIframeCallback(channelId, callbackId, args) {
    const channel = this._iframeChannels.get(channelId);
    if (!channel || !channel.iframe || !channel.iframe.contentWindow) {
        throw new Error('Channel or iframe not available');
    }
    return new Promise((resolve, reject) => {
        const callId = callbackId + '_' + Date.now();
        channel.pendingCalls.set(callId, { resolve, reject });
        channel.iframe.contentWindow.postMessage({
            type: 'pm_render_call',
            channelId,
            callbackId,
            callId,
            args,
        }, '*');
        // 5秒超時
        setTimeout(() => {
            if (channel.pendingCalls.has(callId)) {
                channel.pendingCalls.delete(callId);
                reject(new Error('Callback timeout'));
            }
        }, 5000);
    });
  }

  // ==================== 權限同意 ====================

  /** 權限標籤對照表 */
  static PERMISSION_LABELS = {
    'storage':    { icon: 'fa-database',       label: '儲存空間',     desc: '允許在本機存取插件專屬的儲存空間' },
    'data:read':  { icon: 'fa-eye',            label: '讀取帳務資料', desc: '允許讀取記帳紀錄、帳戶、欠款、分類等資料' },
    'data:write': { icon: 'fa-pen-to-square',  label: '寫入帳務資料', desc: '允許新增或修改記帳紀錄、欠款、聯絡人' },
    'ui':         { icon: 'fa-window-maximize', label: '使用者介面',   desc: '允許註冊頁面、顯示通知、首頁小工具' },
    'network':    { icon: 'fa-globe',           label: '網路存取',     desc: '允許與外部伺服器通訊（如匯率查詢）' },
    'camera':     { icon: 'fa-camera',          label: '相機權限',     desc: '允許透過相機掃描條碼或讀取影像' },
  };

  /**
   * 顯示權限同意對話框
   * @param {object} meta - 插件的 meta 資訊
   * @param {string[]} permissions - 權限列表
   * @returns {Promise<boolean>} 使用者是否同意
   */
  showPermissionConsent(meta, permissions = [], isUpdate = false) {
    return new Promise((resolve) => {
      const safeName = this._escapeHTML(meta.name || '未知插件');
      const safeAuthor = this._escapeHTML(meta.author || '未知作者');
      const safeDesc = this._escapeHTML(meta.description || '');

      const permListHtml = permissions.length > 0
        ? permissions.map(p => {
            const info = PluginManager.PERMISSION_LABELS[p] || { icon: 'fa-question', label: p, desc: '未知權限' };
            return `
              <div class="flex items-start gap-3 py-2">
                <div class="text-wabi-primary shrink-0 mt-0.5"><i class="fa-solid ${info.icon}"></i></div>
                <div>
                  <p class="text-sm font-medium text-wabi-text-primary">${this._escapeHTML(info.label)}</p>
                  <p class="text-xs text-wabi-text-secondary">${this._escapeHTML(info.desc)}</p>
                </div>
              </div>
            `;
          }).join('')
        : '<p class="text-sm text-wabi-text-secondary py-2">此插件未聲明任何特殊權限。</p>';

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animation-fade-in';
      modal.innerHTML = `
        <div class="bg-wabi-surface rounded-xl max-w-sm w-full shadow-xl transform transition-all scale-100 overflow-hidden border border-wabi-border">
          <div class="p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="bg-wabi-primary/10 text-wabi-primary rounded-lg size-12 flex items-center justify-center text-xl">
                <i class="fa-solid ${meta.icon || 'fa-puzzle-piece'}"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-wabi-text-primary">${safeName}</h3>
                <p class="text-xs text-wabi-text-secondary">${safeAuthor}</p>
              </div>
            </div>
            ${safeDesc ? `<p class="text-sm text-wabi-text-secondary mb-4">${safeDesc}</p>` : ''}
            <div class="bg-wabi-bg rounded-lg p-3 mb-4 border border-wabi-border">
              <h4 class="text-xs font-bold text-wabi-text-secondary uppercase tracking-wider mb-2">${isUpdate ? '此更新新增了以下權限' : '此插件將要求以下權限'}</h4>
              <div class="divide-y divide-wabi-border">${permListHtml}</div>
            </div>
          </div>
          <div class="flex border-t border-wabi-border">
            <button id="pm-perm-cancel" class="flex-1 py-3 text-wabi-text-secondary font-medium hover:bg-wabi-bg transition-colors border-r border-wabi-border">取消</button>
            <button id="pm-perm-accept" class="flex-1 py-3 text-wabi-surface font-medium bg-wabi-primary hover:bg-wabi-primary/90 transition-colors">${isUpdate ? '同意並更新' : '安裝'}</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const close = (result) => { modal.remove(); resolve(result); };
      modal.querySelector('#pm-perm-cancel').addEventListener('click', () => close(false));
      modal.querySelector('#pm-perm-accept').addEventListener('click', () => close(true));
    });
  }

  async installPlugin(file, storePluginInfo = null) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const scriptContent = e.target.result;
            
            // 如果從商店安裝且有提供 sha256 hash，驗證完整性
            if (storePluginInfo?.sha256) {
                const computedHash = await this._computeSHA256(scriptContent);
                if (computedHash !== storePluginInfo.sha256) {
                    reject(new Error('插件檔案完整性驗證失敗：SHA-256 hash 不符'));
                    return;
                }
            }

            // 計算 SHA-256 hash 並儲存（供後續載入時驗證）
            const scriptHash = await this._computeSHA256(scriptContent);
            
            // 驗證時也套用沙盒（驗證階段全面封鎖網路）
             const sandboxedValidation = `
               ${this._getSandboxWrapper([])}
               ${scriptContent}
             `;
             const blob = new Blob([sandboxedValidation], { type: 'text/javascript' });
             const url = URL.createObjectURL(blob);
             let meta = {};
             try {
                 // @ts-ignore
        /* @vite-ignore */
        const module = await import(url);
                 meta = module.default?.meta || {};
             } catch(err) {
                 URL.revokeObjectURL(url);
                 reject(new Error('無法解析插件檔案'));
                 return;
             }
             URL.revokeObjectURL(url);

            // 取得權限清單（優先從商店資訊，否則從 meta）
            const permissions = storePluginInfo?.permissions || meta.permissions || [];

            // 檢查是否為更新，並比對權限差異
            let existingPlugin = null;
            try {
                const tx = this.dataService.db.transaction('plugins', 'readonly');
                existingPlugin = await tx.store.get(meta.id);
            } catch(e) { /* ignore */ }

            if (existingPlugin) {
                // 更新：比對新增的權限
                const oldPerms = new Set(existingPlugin.permissions || []);
                const newPerms = permissions.filter(p => !oldPerms.has(p));

                if (newPerms.length > 0) {
                    // 有新增權限，需要使用者同意
                    const accepted = await this.showPermissionConsent(
                      { ...meta, icon: storePluginInfo?.icon },
                      newPerms,
                      true // isUpdate flag
                    );
                    if (!accepted) {
                        reject(new Error('使用者取消更新'));
                        return;
                    }
                }
            } else {
                // 首次安裝：顯示完整權限同意
                const accepted = await this.showPermissionConsent(
                  { ...meta, icon: storePluginInfo?.icon },
                  permissions
                );
                if (!accepted) {
                    reject(new Error('使用者取消安裝'));
                    return;
                }
            }

            const pluginData = {
                id: meta.id || `plugin-${Date.now()}`,
                name: meta.name || file.name,
                version: meta.version || '1.0',
                description: meta.description || '',
                permissions: permissions,
                script: scriptContent,
                scriptHash: scriptHash,  // SHA-256 hash for tamper detection
                enabled: existingPlugin ? existingPlugin.enabled : true,
                installedAt: existingPlugin ? existingPlugin.installedAt : Date.now(),
                ...(existingPlugin && existingPlugin.storage ? { storage: existingPlugin.storage } : {})
            };

            const tx = this.dataService.db.transaction('plugins', 'readwrite');
            await tx.store.put(pluginData);
            await tx.done;
            
            await this.loadPlugin(pluginData);
            resolve(pluginData);
        };
        reader.onerror = () => reject(new Error('讀取失敗'));
        reader.readAsText(file);
    });
  }

  /**
   * 計算字串的 SHA-256 hash（十六進位）
   */
  async _computeSHA256(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async uninstallPlugin(id) {
      const tx = this.dataService.db.transaction('plugins', 'readwrite');
      await tx.store.delete(id);
      await tx.done;
      this.plugins.delete(id);
      showToast('插件已移除，請重新整理頁面');
  }
    
  async getInstalledPlugins() {
      const tx = this.dataService.db.transaction('plugins', 'readonly');
      return await tx.store.getAll();
  }

  registerPage(routeId, title, renderFn) {
      if (this.customPages.has(routeId)) {
          console.warn(`Plugin page route '${routeId}' already exists. Overwriting.`);
      }
      this.customPages.set(routeId, { title, renderFn });
      console.log(`Registered custom page: #${routeId}`);
  }

  registerHomeWidget(id, renderFn) {
      if (typeof id !== 'string') {
          console.warn('registerHomeWidget now expects (id, renderFn). Ignoring registration.');
          return;
      }
      this.homeWidgets.set(id, renderFn);
      
      // If not in order list, append
      if (!this.widgetOrder.includes(id)) {
          this.widgetOrder.push(id);
      }
      console.log(`Plugin home widget registered: ${id}`);
  }

  renderHomeWidgets(container) {
      if (!container || this.homeWidgets.size === 0) return;
      container.innerHTML = ''; // Clear container first

      // 1. Render based on order
      this.widgetOrder.forEach(id => {
          if (this.hiddenWidgets.includes(id)) return;
          const renderFn = this.homeWidgets.get(id);
          if (renderFn) {
              this.renderSingleWidget(container, id, renderFn);
          }
      });

      // 2. Render any active widgets NOT in widgetOrder (cleanup/fallback)
      this.homeWidgets.forEach((renderFn, id) => {
          if (this.hiddenWidgets.includes(id)) return;
          if (!this.widgetOrder.includes(id)) {
              this.renderSingleWidget(container, id, renderFn);
          }
      });
  }

  renderSingleWidget(container, id, renderFn) {
      const widget = document.createElement('div');
      widget.className = 'plugin-widget mb-4';
      widget.dataset.pluginId = id;
      try {
          renderFn(widget);
          container.appendChild(widget);
      } catch (e) {
          console.error(`Error rendering plugin widget ${id}:`, e);
      }
  }

  async moveWidget(id, direction) {
      const index = this.widgetOrder.indexOf(id);
      if (index === -1) return;
      
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= this.widgetOrder.length) return;
      
      // Swap
      [this.widgetOrder[index], this.widgetOrder[newIndex]] = [this.widgetOrder[newIndex], this.widgetOrder[index]];
      await this.saveWidgetOrder();
  }

  async saveWidgetOrder() {
      await this.dataService.saveSetting({ key: 'widgetOrder', value: this.widgetOrder });
  }

  async saveHiddenWidgets() {
      await this.dataService.saveSetting({ key: 'hiddenWidgets', value: this.hiddenWidgets });
  }

  getCustomPage(routeId) {
      return this.customPages.get(routeId);
  }

  getPluginName(id) {
      const plugin = this.plugins.get(id);
      return plugin ? plugin.meta.name : null;
  }

  registerHook(hookName, callback) {
      if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, new Set());
      }
      this.hooks.get(hookName).add(callback);
      console.log(`Hook registered: ${hookName}`);
  }

  unregisterHook(hookName, callback) {
      if (this.hooks.has(hookName)) {
          this.hooks.get(hookName).delete(callback);
      }
  }

  async triggerHook(hookName, payload) {
      if (!this.hooks.has(hookName)) return payload;
      
      let currentPayload = payload;
      for (const callback of this.hooks.get(hookName)) {
          try {
              // Hooks can modify payload by returning new value (for 'before' hooks)
              // Or just execute side effects (for 'after' hooks)
              const result = await callback(currentPayload);
              
              // If hook returns null explicitly, it means "cancel" or "stop"
              if (result === null) {
                  return null;
              }

              if (result !== undefined) {
                  currentPayload = result;
              }
          } catch (e) {
              console.error(`Error in hook ${hookName}:`, e);
          }
      }
      return currentPayload;
  }

  /**
   * Compare two version strings.
   * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
   */
  compareVersions(v1, v2) {
      if (!v1 || !v2) return 0;
      const p1 = v1.split('.').map(Number);
      const p2 = v2.split('.').map(Number);
      const len = Math.max(p1.length, p2.length);
      
      for (let i = 0; i < len; i++) {
          const num1 = p1[i] || 0;
          const num2 = p2[i] || 0;
          if (num1 > num2) return 1;
          if (num1 < num2) return -1;
      }
      return 0;
  }

  createModalBase(title, message, buttons) {
      // 防止 XSS：轉義來自插件的 title 與 message
      const safeTitle = this._escapeHTML(title);
      const safeMessage = this._escapeHTML(message);

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animation-fade-in';
      modal.innerHTML = `
          <div class="bg-wabi-surface rounded-xl max-w-sm w-full p-6 shadow-xl transform transition-all scale-100 border border-wabi-border">
              <h3 class="text-xl font-bold text-wabi-text-primary mb-2">${safeTitle}</h3>
              <p class="text-wabi-text-secondary mb-6">${safeMessage}</p>
              <div class="flex gap-3 justify-end">
                  ${buttons}
              </div>
          </div>
      `;
      document.body.appendChild(modal);
      return modal;
  }

  showConfirmModal(title, message) {
      return new Promise((resolve) => {
          const btns = `
              <button class="px-4 py-2 rounded-lg text-wabi-text-secondary hover:bg-wabi-bg font-medium transition-colors border border-wabi-border" id="pm-modal-cancel">取消</button>
              <button class="px-4 py-2 rounded-lg bg-wabi-primary text-wabi-surface hover:bg-opacity-90 font-medium transition-colors" id="pm-modal-confirm">確定</button>
          `;
          const modal = this.createModalBase(title, message, btns);
          
          const close = (result) => {
              modal.remove();
              resolve(result);
          };

          modal.querySelector('#pm-modal-cancel').addEventListener('click', () => close(false));
          modal.querySelector('#pm-modal-confirm').addEventListener('click', () => close(true));
      });
  }

  showAlertModal(title, message) {
      return new Promise((resolve) => {
          const btns = `
              <button class="px-4 py-2 rounded-lg bg-wabi-primary text-wabi-surface hover:bg-opacity-90 font-medium transition-colors" id="pm-modal-ok">確定</button>
          `;
          const modal = this.createModalBase(title, message, btns);
          
          modal.querySelector('#pm-modal-ok').addEventListener('click', () => {
              modal.remove();
              resolve(true);
          });
      });
  }
}
