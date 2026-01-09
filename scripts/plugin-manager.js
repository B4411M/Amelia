/**
 * ============================================
 * AMELIA AI - PLUGIN SYSTEM
 * Core plugin architecture for extensibility
 * ============================================
 */

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = new Map();
        this.commands = new Map();
        this.events = new EventTarget();
        this.initialized = false;
        
        // Plugin directories
        this.pluginDirs = ['plugins'];
        
        // Settings
        this.settings = {
            autoLoad: true,
            validatePlugins: true,
            maxPlugins: 50
        };
    }

    async init() {
        console.log('[PluginManager] Initializing...');
        this.registerBuiltInPlugins();
        
        if (this.settings.autoLoad) {
            await this.loadAllPlugins();
        }
        
        this.initialized = true;
        console.log(`[PluginManager] Ready! ${this.plugins.size} plugins loaded`);
        return this;
    }

    registerBuiltInPlugins() {
        // Calculator Plugin
        this.register({
            name: 'calculator',
            version: '1.0.0',
            author: 'B41M',
            description: 'Kalkulator matematika',
            commands: [
                { name: 'calc', handler: 'calculate' },
                { name: 'calculate', handler: 'calculate' }
            ],
            onLoad: () => console.log('[Calculator] Plugin loaded'),
            calculate: (input) => this.runCalculator(input)
        });

        // Translator Plugin
        this.register({
            name: 'translator',
            version: '1.0.0',
            author: 'B41M',
            description: 'Penerjemah multi-bahasa',
            commands: [
                { name: 'translate', handler: 'translate' },
                { name: 'terjemahkan', handler: 'translate' }
            ],
            onLoad: () => console.log('[Translator] Plugin loaded'),
            translate: (input) => this.runTranslator(input)
        });

        // Code Highlight Plugin
        this.register({
            name: 'code-highlight',
            version: '1.0.0',
            author: 'B41M',
            description: 'Syntax highlighting',
            onLoad: () => console.log('[CodeHighlight] Plugin loaded')
        });

        // Image Editor Plugin
        this.register({
            name: 'image-editor',
            version: '1.0.0',
            author: 'B41M',
            description: 'Editing gambar dasar',
            commands: [
                { name: 'crop', handler: 'crop' },
                { name: 'resize', handler: 'resize' }
            ],
            onLoad: () => console.log('[ImageEditor] Plugin loaded'),
            crop: (input) => 'Crop: ' + input,
            resize: (input) => 'Resize: ' + input
        });

        // PDF Reader Plugin
        this.register({
            name: 'pdf-reader',
            version: '1.0.0',
            author: 'B41M',
            description: 'Baca file PDF',
            commands: [
                { name: 'pdf', handler: 'readPDF' }
            ],
            onLoad: () => console.log('[PDFReader] Plugin loaded'),
            readPDF: (input) => 'PDF Reader: ' + input
        });
    }

    register(plugin) {
        if (this.plugins.has(plugin.name)) {
            console.warn(`Plugin ${plugin.name} already registered`);
            return false;
        }

        const pluginInstance = {
            ...plugin,
            id: plugin.name,
            enabled: true,
            loaded: false,
            commands: new Map(),
            hooks: new Map()
        };

        if (plugin.commands) {
            plugin.commands.forEach(cmd => {
                pluginInstance.commands.set(cmd.name, cmd);
                this.commands.set(cmd.name, { plugin: plugin.name, handler: cmd.handler });
            });
        }

        this.plugins.set(plugin.name, pluginInstance);
        
        if (this.initialized && plugin.onLoad) {
            try {
                plugin.onLoad();
                pluginInstance.loaded = true;
            } catch (error) {
                console.error(`Error loading plugin ${plugin.name}:`, error);
            }
        }

        console.log(`Registered: ${plugin.name} v${plugin.version}`);
        return true;
    }

    unregister(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) return false;
        
        plugin.commands.forEach((_, name) => this.commands.delete(name));
        this.plugins.delete(pluginName);
        console.log(`Unregistered: ${pluginName}`);
        return true;
    }

    async execute(command, input) {
        const cmd = this.commands.get(command);
        if (!cmd) return { success: false, error: `Command '${command}' not found` };

        const plugin = this.plugins.get(cmd.plugin);
        if (!plugin || !plugin.enabled) return { success: false, error: 'Plugin not available' };

        const handler = plugin[cmd.handler];
        if (!handler) return { success: false, error: 'Handler not found' };

        try {
            const result = await handler(input);
            return { success: true, result, plugin: cmd.plugin };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    registerHook(hookName, callback, priority = 0) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push({ callback, priority });
    }

    async executeHooks(hookName, data) {
        const hooks = this.hooks.get(hookName);
        if (!hooks || hooks.length === 0) return data;
        
        let result = data;
        for (const hook of hooks) {
            try {
                result = await hook.callback(result);
            } catch (error) {
                console.error(`Hook error (${hookName}):`, error);
            }
        }
        return result;
    }

    on(event, callback) {
        this.events.addEventListener(event, callback);
    }

    emit(event, data) {
        this.events.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    async runCalculator(input) {
        try {
            const sanitized = input.replace(/[^0-9+\-*/().\s]/g, '');
            const result = Function('"use strict"; return (' + sanitized + ')')();
            return `Hasil: ${Number.isInteger(result) ? result : result.toFixed(4)}`;
        } catch (error) {
            return `Error: ${error.message}`;
        }
    }

    async runTranslator(input) {
        return `Terjemahan: "${input}" - [Menggunakan layanan penerjemah]`;
    }

    enablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (plugin) {
            plugin.enabled = true;
            return true;
        }
        return false;
    }

    disablePlugin(pluginName) {
        const plugin = this.plugins.get(pluginName);
        if (plugin) {
            plugin.enabled = false;
            return true;
        }
        return false;
    }

    getStatus() {
        const enabled = [];
        const disabled = [];
        this.plugins.forEach((p, n) => {
            if (p.enabled) enabled.push({ name: n, version: p.version });
            else disabled.push({ name: n, version: p.version });
        });
        return { totalPlugins: this.plugins.size, enabledPlugins: enabled, disabledPlugins: disabled };
    }

    getPluginList() {
        const list = [];
        this.plugins.forEach((p, n) => {
            list.push({ name: n, version: p.version, author: p.author, enabled: p.enabled });
        });
        return list;
    }

    destroy() {
        this.plugins.forEach((_, n) => this.unregister(n));
        this.hooks.clear();
        this.commands.clear();
        this.initialized = false;
    }
}

window.PluginManager = PluginManager;

