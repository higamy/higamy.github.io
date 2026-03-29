// TW Nav - Shared sidebar and header for higamy's TW tools
// Include this script in every tool page: <script src="tw-nav.js"></script>
// It injects the sidebar + header bar into the page automatically.

(function() {
    const TOOLS = [
        { id: 'stats',    label: 'Stats',              href: 'main.html',            icon: '📊' },
        { id: 'mint',     label: 'Mint Optimizer',     href: 'mintOptimizer.html',   icon: '🪙' },
        { id: 'church',   label: 'Church Optimizer',   href: 'churchOptimizer.html', icon: '⛪' },
    ];

    // Determine which page is active based on current URL
    const currentFile = window.location.pathname.split('/').pop() || 'main.html';
    const activeTool = TOOLS.find(t => currentFile === t.href || currentFile === t.href.replace('.html', ''));

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        .tw-nav-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 44px;
            background: #1a1a2e;
            border-bottom: 2px solid #533483;
            display: flex;
            align-items: center;
            padding: 0 16px;
            z-index: 1000;
            font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
        }
        [data-theme="light"] .tw-nav-header {
            background: #5d4037;
            border-bottom: 2px solid #3e2723;
        }
        .tw-nav-brand {
            color: #e94560;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            white-space: nowrap;
            user-select: none;
        }
        [data-theme="light"] .tw-nav-brand {
            color: #ffcc80;
        }
        .tw-nav-toggle {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #e0e0e0;
            font-size: 20px;
            margin-right: 12px;
            border-radius: 4px;
            user-select: none;
        }
        .tw-nav-toggle:hover {
            background: rgba(255,255,255,0.1);
        }
        [data-theme="light"] .tw-nav-toggle {
            color: #fff;
        }
        [data-theme="light"] .tw-nav-toggle:hover {
            background: rgba(255,255,255,0.15);
        }
        .tw-nav-page-title {
            color: #a8d8ea;
            font-size: 13px;
            margin-left: 16px;
        }
        [data-theme="light"] .tw-nav-page-title {
            color: #ffcc80;
        }

        .tw-nav-sidebar {
            position: fixed;
            top: 44px;
            left: 0;
            bottom: 0;
            width: 200px;
            background: #16213e;
            border-right: 1px solid #533483;
            z-index: 999;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
            overflow-y: auto;
        }
        [data-theme="light"] .tw-nav-sidebar {
            background: #4e342e;
            border-right: 1px solid #3e2723;
        }
        .tw-nav-sidebar.open {
            transform: translateX(0);
        }
        .tw-nav-sidebar-section {
            padding: 12px 0 4px 16px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #667;
        }
        [data-theme="light"] .tw-nav-sidebar-section {
            color: #bcaaa4;
        }
        .tw-nav-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            color: #e0e0e0;
            text-decoration: none;
            font-size: 14px;
            transition: background 0.15s;
        }
        .tw-nav-link:hover {
            background: rgba(255,255,255,0.06);
        }
        .tw-nav-link.active {
            background: rgba(233, 69, 96, 0.15);
            color: #e94560;
            font-weight: 600;
            border-left: 3px solid #e94560;
            padding-left: 13px;
        }
        [data-theme="light"] .tw-nav-link {
            color: #efebe9;
        }
        [data-theme="light"] .tw-nav-link:hover {
            background: rgba(255,255,255,0.08);
        }
        [data-theme="light"] .tw-nav-link.active {
            background: rgba(255,204,128,0.2);
            color: #ffcc80;
            border-left-color: #ffcc80;
        }
        .tw-nav-link-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
        }
        .tw-nav-overlay {
            position: fixed;
            top: 44px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.3);
            z-index: 998;
            display: none;
        }
        .tw-nav-overlay.open {
            display: block;
        }

        /* Push page content down for the header */
        body.tw-tool {
            padding-top: 64px !important;
        }
        .tw-nav-theme-btn {
            margin-left: auto;
            cursor: pointer;
            font-size: 18px;
            padding: 4px 10px;
            border-radius: 4px;
            user-select: none;
            color: #e0e0e0;
        }
        .tw-nav-theme-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        [data-theme="light"] .tw-nav-theme-btn {
            color: #fff;
        }
    `;
    document.head.appendChild(style);

    // Apply saved theme (light is default)
    const savedTheme = localStorage.getItem('tw-tools-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Build header
    const header = document.createElement('div');
    header.className = 'tw-nav-header';
    const themeIcon = savedTheme === 'dark' ? '☼' : '☾';
    header.innerHTML = `
        <div class="tw-nav-toggle" id="twNavToggle">☰</div>
        <div class="tw-nav-brand">higamy's tools</div>
        <div class="tw-nav-page-title">${activeTool ? '— ' + activeTool.label : ''}</div>
        <div class="tw-nav-theme-btn" id="twNavThemeBtn" title="Toggle dark/light mode">${themeIcon}</div>
    `;

    // Build sidebar
    const sidebar = document.createElement('nav');
    sidebar.className = 'tw-nav-sidebar';
    sidebar.id = 'twNavSidebar';

    let linksHTML = '<div class="tw-nav-sidebar-section">Tools</div>';
    for (const tool of TOOLS) {
        const isActive = tool === activeTool ? ' active' : '';
        linksHTML += `<a class="tw-nav-link${isActive}" href="${tool.href}">
            <span class="tw-nav-link-icon">${tool.icon}</span>
            ${tool.label}
        </a>`;
    }
    sidebar.innerHTML = linksHTML;

    // Build overlay
    const overlay = document.createElement('div');
    overlay.className = 'tw-nav-overlay';
    overlay.id = 'twNavOverlay';

    // Insert into DOM
    document.body.prepend(overlay);
    document.body.prepend(sidebar);
    document.body.prepend(header);

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }

    document.getElementById('twNavToggle').addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Theme toggle
    document.getElementById('twNavThemeBtn').addEventListener('click', function() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        localStorage.setItem('tw-tools-theme', next);
        this.textContent = next === 'dark' ? '☼' : '☾';

        // Call page-specific redraw if available
        if (typeof redrawChart === 'function') redrawChart();
        if (typeof toggleTheme === 'function' && typeof toggleTheme._skip === 'undefined') {
            // Don't call page toggleTheme as we've already toggled
        }
    });
})();
