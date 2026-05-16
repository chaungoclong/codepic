// --- MULTI-LANGUAGE (i18n) DICTIONARY ---
const translations = {
    vi: {
        app_title: "CodePic",
        ui_lang_title: "Ngôn ngữ giao diện",
        lang_select_title: "Ngôn ngữ Lập trình",
        theme_select_title: "Theme Code",
        bg_select_title: "Màu nền",
        padding_label: "Padding",
        btn_format: "Format",
        btn_export: "Lưu ảnh",
        tool_edit_title: "Chỉnh sửa Code",
        tool_text_title: "Chữ",
        tool_rect_title: "Hình vuông",
        tool_circle_title: "Hình tròn",
        tool_arrow_title: "Mũi tên",
        tool_color_title: "Chọn màu vẽ",
        undo_title: "Hoàn tác (Undo)",
        redo_title: "Làm lại (Redo)",
        clear_draw_title: "Xóa tất cả hình vẽ",
        theme_toggle_title: "Bật/Tắt Chế Độ Tối",
        placeholder_temp_text: "Gõ chữ & Enter",
        msg_exporting: "Đang lưu...",
        err_format: "Có lỗi cú pháp khi format code.",
        err_format_unsupported: "Ngôn ngữ này chưa được hỗ trợ format tự động.",
        err_export: "Có lỗi xảy ra khi lưu ảnh.",
        bg_purple: "Tím Hoàng Hôn",
        bg_blue: "Đại Dương Xanh",
        bg_candy: "Kẹo Ngọt",
        bg_green: "Xanh Lá Tươi",
        bg_solid: "Xám Đậm (Solid)",
        bg_transparent: "Trong suốt"
    },
    en: {
        app_title: "CodePic",
        ui_lang_title: "UI Language",
        lang_select_title: "Programming Language",
        theme_select_title: "Code Theme",
        bg_select_title: "Background",
        padding_label: "Padding",
        btn_format: "Format",
        btn_export: "Export",
        tool_edit_title: "Code Editor",
        tool_text_title: "Text",
        tool_rect_title: "Rectangle",
        tool_circle_title: "Circle",
        tool_arrow_title: "Arrow",
        tool_color_title: "Choose Color",
        undo_title: "Undo",
        redo_title: "Redo",
        clear_draw_title: "Clear all drawings",
        theme_toggle_title: "Toggle Light/Dark Mode",
        placeholder_temp_text: "Type & press Enter",
        msg_exporting: "Exporting...",
        err_format: "Syntax error while formatting code.",
        err_format_unsupported: "This language is not supported for automatic formatting.",
        err_export: "Error while exporting image.",
        bg_purple: "Purple Sunset",
        bg_blue: "Blue Ocean",
        bg_candy: "Sweet Candy",
        bg_green: "Fresh Green",
        bg_solid: "Dark Gray (Solid)",
        bg_transparent: "Transparent"
    }
};

let currentUILang = 'vi';
let tempTextPlaceholder = translations['vi'].placeholder_temp_text;

function applyTranslations(lang) {
    currentUILang = lang;
    document.documentElement.lang = lang;
    const dict = translations[lang];

    // Update text contents
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });

    // Update title attributes (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) el.title = dict[key];
    });

    tempTextPlaceholder = dict.placeholder_temp_text || "Type & Enter";
    localStorage.setItem('uiLang', lang);
}

// Initialize UI Language
const uiLangSelect = document.getElementById('ui-lang-select');
const savedLang = localStorage.getItem('uiLang');
const browserLang = navigator.language.startsWith('en') ? 'en' : 'vi';
const initLang = savedLang || browserLang;

uiLangSelect.value = initLang;
applyTranslations(initLang);

uiLangSelect.addEventListener('change', (e) => {
    applyTranslations(e.target.value);
});

// --- Mobile Menu Toggle ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const settingsGroup = document.getElementById('settings-group');

mobileMenuBtn.addEventListener('click', () => {
    settingsGroup.classList.toggle('hidden');
    settingsGroup.classList.toggle('flex');
});

// Đóng menu mobile khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!settingsGroup.contains(e.target) && !mobileMenuBtn.contains(e.target) && !settingsGroup.classList.contains('hidden') && window.innerWidth < 640) {
        settingsGroup.classList.add('hidden');
        settingsGroup.classList.remove('flex');
    }
});

// --- DOM Elements ---
const editor = document.getElementById('code-editor');
const display = document.getElementById('highlight-display');
const langSelect = document.getElementById('lang-select');
const themeSelect = document.getElementById('theme-select');
const bgSelect = document.getElementById('bg-select');
const paddingSlider = document.getElementById('padding-slider');
const macWindow = document.getElementById('mac-window');
const exportContainer = document.getElementById('export-container');
const hljsThemeLink = document.getElementById('hljs-theme');
const drawLayer = document.getElementById('draw-layer');
const toolBtns = document.querySelectorAll('.tool-btn');
const colorPicker = document.getElementById('draw-color');

// --- Dark/Light Mode Logic ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Cập nhật để Dark Mode trở thành mặc định nếu user chưa có settings
if (!('theme' in localStorage) || localStorage.theme === 'dark') {
    htmlElement.classList.add('dark');
} else {
    htmlElement.classList.remove('dark');
}

themeToggle.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    localStorage.theme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
    syncThemeBackground(); // Ensure caret color syncs correctly
});

// Initialize Highlight
hljs.highlightElement(display);
syncThemeBackground();

// --- History Management ---
let history = [];
let historyIndex = -1;
let isRestoring = false;
let saveTimeout;

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    undoBtn.classList.toggle('opacity-50', historyIndex <= 0);
    undoBtn.classList.toggle('cursor-not-allowed', historyIndex <= 0);

    redoBtn.classList.toggle('opacity-50', historyIndex >= history.length - 1);
    redoBtn.classList.toggle('cursor-not-allowed', historyIndex >= history.length - 1);
}

function saveState(delay = 0) {
    if (isRestoring) return;
    clearTimeout(saveTimeout);
    const executeSave = () => {
        const state = { code: editor.value, svg: drawLayer.innerHTML, fileName: document.getElementById('file-title').textContent };
        if (historyIndex >= 0 && history[historyIndex].code === state.code && history[historyIndex].svg === state.svg && history[historyIndex].fileName === state.fileName) return;
        history = history.slice(0, historyIndex + 1);
        history.push(state);
        if (history.length > 50) history.shift(); else historyIndex++;
        updateUndoRedoButtons();
    };
    delay > 0 ? saveTimeout = setTimeout(executeSave, delay) : executeSave();
}

function undo() { if (historyIndex > 0) restoreState(history[--historyIndex]); }
function redo() { if (historyIndex < history.length - 1) restoreState(history[++historyIndex]); }

function restoreState(state) {
    isRestoring = true;
    editor.value = state.code;
    drawLayer.innerHTML = state.svg;
    document.getElementById('file-title').textContent = state.fileName;
    updateCode();
    updateUndoRedoButtons();
    isRestoring = false;
}

document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);
saveState();

document.addEventListener('keydown', (e) => {
    if (e.target.id === 'file-title' || e.target.id === 'temp-text-input') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault(); e.shiftKey ? redo() : undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); redo();
    }
});

// --- Code Editor Logic ---
function updateCode() {
    display.textContent = editor.value || " ";
    delete display.dataset.highlighted;
    display.className = `language-${langSelect.value} block`;
    hljs.highlightElement(display);
    syncThemeBackground();
}

editor.addEventListener('input', () => { updateCode(); saveState(500); });
editor.addEventListener('paste', () => setTimeout(() => { updateCode(); saveState(); }, 10));
editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart, end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        updateCode(); saveState();
    }
});

// Mảng cấu hình code mẫu & file name theo từng ngôn ngữ
// Đã được mã hóa an toàn bằng decodeURIComponent để chống lỗi format của các nền tảng web/CMS
const languageDefaults = {
    javascript: { file: "untitled.js", code: decodeURIComponent("const%20greeting%20%3D%20%22Xin%20ch%C3%A0o%20c%C3%A1c%20nh%C3%A0%20ph%C3%A1t%20tri%E1%BB%83n!%22%3B%0A%0Afunction%20createBeautifulCode()%20%7B%0A%20%20%20%20%2F%2F%201.%20G%C3%B5%20code%20c%E1%BB%A7a%20b%E1%BA%A1n%20v%C3%A0o%20%C4%91%C3%A2y%0A%20%20%20%20%2F%2F%202.%20S%E1%BB%AD%20d%E1%BB%A5ng%20thanh%20c%C3%B4ng%20c%E1%BB%A5%20b%C3%AAn%20d%C6%B0%E1%BB%9Bi%20%C4%91%E1%BB%83%20v%E1%BA%BD%0A%20%20%20%20%2F%2F%203.%20%C4%90%E1%BB%95i%20giao%20di%E1%BB%87n%2C%20m%C3%A0u%20n%E1%BB%81n%20%E1%BB%9F%20tr%C3%AAn%20c%C3%B9ng%0A%20%20%20%20return%20%7B%0A%20%20%20%20%20%20%20%20success%3A%20true%2C%0A%20%20%20%20%20%20%20%20message%3A%20greeting%0A%20%20%20%20%7D%3B%0A%7D") },
    html: { file: "index.html", code: decodeURIComponent("%3C!DOCTYPE%20html%3E%0A%3Chtml%20lang%3D%22vi%22%3E%0A%3Chead%3E%0A%20%20%20%20%3Ctitle%3ETrang%20Web%20C%E1%BB%A7a%20T%C3%B4i%3C%2Ftitle%3E%0A%3C%2Fhead%3E%0A%3Cbody%3E%0A%20%20%20%20%3Ch1%3EXin%20ch%C3%A0o%20th%E1%BA%BF%20gi%E1%BB%9Bi!%3C%2Fh1%3E%0A%20%20%20%20%3Cp%3EB%E1%BA%AFt%20%C4%91%E1%BA%A7u%20vi%E1%BA%BFt%20code%20HTML%20t%E1%BA%A1i%20%C4%91%C3%A2y.%3C%2Fp%3E%0A%3C%2Fbody%3E%0A%3C%2Fhtml%3E") },
    css: { file: "style.css", code: decodeURIComponent("body%20%7B%0A%20%20%20%20background-color%3A%20%23f0f0f0%3B%0A%20%20%20%20font-family%3A%20'Inter'%2C%20sans-serif%3B%0A%7D%0A%0A.container%20%7B%0A%20%20%20%20max-width%3A%201200px%3B%0A%20%20%20%20margin%3A%200%20auto%3B%0A%20%20%20%20padding%3A%2020px%3B%0A%7D") },
    python: { file: "main.py", code: decodeURIComponent("def%20greet(name)%3A%0A%20%20%20%20%22%22%22H%C3%A0m%20ch%C3%A0o%20h%E1%BB%8Fi%20c%C6%A1%20b%E1%BA%A3n%22%22%22%0A%20%20%20%20print(f%22Xin%20ch%C3%A0o%2C%20%7Bname%7D!%22)%0A%0Aif%20__name__%20%3D%3D%20%22__main__%22%3A%0A%20%20%20%20greet(%22L%E1%BA%ADp%20tr%C3%ACnh%20vi%C3%AAn%22)") },
    java: { file: "Main.java", code: decodeURIComponent("public%20class%20Main%20%7B%0A%20%20%20%20public%20static%20void%20main(String%5B%5D%20args)%20%7B%0A%20%20%20%20%20%20%20%20System.out.println(%22Xin%20ch%C3%A0o%2C%20th%E1%BA%BF%20gi%E1%BB%9Bi!%22)%3B%0A%20%20%20%20%7D%0A%7D") },
    cpp: { file: "main.cpp", code: decodeURIComponent("%23include%20%3Ciostream%3E%0A%0Aint%20main()%20%7B%0A%20%20%20%20std%3A%3Acout%20%3C%3C%20%22Xin%20ch%C3%A0o%2C%20th%E1%BA%BF%20gi%E1%BB%9Bi!%22%20%3C%3C%20std%3A%3Aendl%3B%0A%20%20%20%20return%200%3B%0A%7D") },
    csharp: { file: "Program.cs", code: decodeURIComponent("using%20System%3B%0A%0Anamespace%20HelloWorld%0A%7B%0A%20%20%20%20class%20Program%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20static%20void%20Main(string%5B%5D%20args)%0A%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Console.WriteLine(%22Xin%20ch%C3%A0o%2C%20th%E1%BA%BF%20gi%E1%BB%9Bi!%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D") },
    php: { file: "index.php", code: decodeURIComponent("%3C%3Fphp%0A%24greeting%20%3D%20%22Xin%20ch%C3%A0o%20th%E1%BA%BF%20gi%E1%BB%9Bi%22%3B%0Aecho%20%22%3Ch1%3E%22%20.%20%24greeting%20.%20%22!%3C%2Fh1%3E%22%3B%0A%3F%3E") },
    ruby: { file: "script.rb", code: decodeURIComponent("def%20greet(name)%0A%20%20puts%20%22Xin%20ch%C3%A0o%2C%20%23%7Bname%7D!%22%0Aend%0A%0Agreet(%22Th%E1%BA%BF%20gi%E1%BB%9Bi%22)") },
    go: { file: "main.go", code: decodeURIComponent("package%20main%0A%0Aimport%20%22fmt%22%0A%0Afunc%20main()%20%7B%0A%20%20%20%20fmt.Println(%22Xin%20ch%C3%A0o%2C%20th%E1%BA%BF%20gi%E1%BB%9Bi!%22)%0A%7D") },
    rust: { file: "main.rs", code: decodeURIComponent("fn%20main()%20%7B%0A%20%20%20%20println!(%22Xin%20ch%C3%A0o%2C%20th%E1%BA%BF%20gi%E1%BB%9Bi!%22)%3B%0A%7D") },
    sql: { file: "query.sql", code: decodeURIComponent("SELECT%20id%2C%20name%2C%20email%0AFROM%20users%0AWHERE%20status%20%3D%20'active'%0AORDER%20BY%20created_at%20DESC%3B") },
    json: { file: "data.json", code: decodeURIComponent("%7B%0A%20%20%20%20%22name%22%3A%20%22CodePic%22%2C%0A%20%20%20%20%22version%22%3A%20%221.0.0%22%2C%0A%20%20%20%20%22description%22%3A%20%22Tr%C3%ACnh%20t%E1%BA%A1o%20%E1%BA%A3nh%20code%20%C4%91%E1%BA%B9p%20m%E1%BA%AFt%22%2C%0A%20%20%20%20%22author%22%3A%20%22B%E1%BA%A1n%22%0A%7D") },
    typescript: { file: "app.ts", code: decodeURIComponent("interface%20User%20%7B%0A%20%20%20%20name%3A%20string%3B%0A%20%20%20%20id%3A%20number%3B%0A%7D%0A%0Aconst%20user%3A%20User%20%3D%20%7B%0A%20%20%20%20name%3A%20%22John%20Doe%22%2C%0A%20%20%20%20id%3A%201%0A%7D%3B%0A%0Aconsole.log(%60Xin%20ch%C3%A0o%2C%20%24%7Buser.name%7D!%60)%3B") },
    markdown: { file: "README.md", code: decodeURIComponent("%23%20CodePic%0A%0AM%E1%BB%99t%20c%C3%B4ng%20c%E1%BB%A5%20t%E1%BA%A1o%20%E1%BA%A3nh%20snippet%20code%20tuy%E1%BB%87t%20%C4%91%E1%BA%B9p.%0A%0A%23%23%20T%C3%ADnh%20n%C4%83ng%0A*%20H%E1%BB%97%20tr%E1%BB%A3%20nhi%E1%BB%81u%20ng%C3%B4n%20ng%E1%BB%AF%0A*%20%C4%90%E1%BB%95i%20theme%20linh%20ho%E1%BA%A1t%0A*%20C%C3%B4ng%20c%E1%BB%A5%20v%E1%BA%BD%20t%C3%ADch%20h%E1%BB%A3p") },
    xml: { file: "config.xml", code: decodeURIComponent("%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%0A%3Cconfig%3E%0A%20%20%20%20%3Capp_name%3ECodePic%3C%2Fapp_name%3E%0A%20%20%20%20%3Cversion%3E1.0%3C%2Fversion%3E%0A%20%20%20%20%3Csettings%3E%0A%20%20%20%20%20%20%20%20%3Ctheme%3Edark%3C%2Ftheme%3E%0A%20%20%20%20%3C%2Fsettings%3E%0A%3C%2Fconfig%3E") }
};

// Hàm kiểm tra xem nội dung hiện tại có phải là nội dung mặc định không
function isDefaultCode(code) {
    const trimmed = code.trim();
    if (!trimmed) return true; // Nếu trống cũng coi như mặc định, cho phép điền code mẫu mới
    return Object.values(languageDefaults).some(def => def.code.trim() === trimmed);
}

// Hàm kiểm tra xem tên file hiện tại có phải là tên file mặc định không
function isDefaultTitle(title) {
    return Object.values(languageDefaults).some(def => def.file === title);
}

// Khi thay đổi ngôn ngữ -> Cập nhật tên file, nội dung code mẫu & Highlight code
langSelect.addEventListener('change', () => {
    const selectedLang = langSelect.value;
    const defaultTemplate = languageDefaults[selectedLang];

    if (defaultTemplate) {
        const titleEl = document.getElementById('file-title');

        // Chỉ ghi đè tên file nếu người dùng chưa sửa tên file (đang giữ một trong các tên mặc định)
        if (isDefaultTitle(titleEl.textContent)) {
            titleEl.textContent = defaultTemplate.file;
        }

        // Chỉ ghi đè code nếu khu vực code đang trống hoặc chứa code mặc định chưa qua chỉnh sửa
        if (isDefaultCode(editor.value)) {
            editor.value = defaultTemplate.code;
        }
    }

    updateCode();
    saveState(); // Lưu vào lịch sử Undo/Redo
});

themeSelect.addEventListener('change', () => {
    hljsThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${themeSelect.value}.min.css`;
    setTimeout(syncThemeBackground, 150);
});

function syncThemeBackground() {
    const computedStyle = window.getComputedStyle(display);
    let bgColor = computedStyle.backgroundColor;
    if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') bgColor = '#1e1e1e';
    macWindow.style.backgroundColor = bgColor;
    const rgb = bgColor.match(/\d+/g);
    if (rgb) {
        const brightness = Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000);
        if (!htmlElement.classList.contains('dark')) {
            editor.style.caretColor = brightness > 125 ? '#0f172a' : '#ffffff';
        } else {
            editor.style.caretColor = '#ffffff';
        }
    }
}

bgSelect.addEventListener('change', () => exportContainer.style.background = bgSelect.value);

if (paddingSlider) {
    paddingSlider.addEventListener('input', () => exportContainer.style.padding = `${paddingSlider.value}px`);
}

// --- Format Button ---
document.getElementById('format-btn').addEventListener('click', () => {
    let code = editor.value, lang = langSelect.value;
    try {
        if (['javascript', 'json', 'typescript'].includes(lang)) {
            code = js_beautify(code, { indent_size: 4 });
        } else if (lang === 'html' || lang === 'xml') {
            code = html_beautify(code, { indent_size: 4 });
        } else if (lang === 'css') {
            code = css_beautify(code, { indent_size: 4 });
        } else if (['java', 'cpp', 'csharp', 'php', 'rust', 'go'].includes(lang)) {
            // Sử dụng formatter của JS cho các ngôn ngữ C-style
            code = js_beautify(code, { indent_size: 4 });
        } else {
            // Từ chối format cho Ruby, Python, SQL, Markdown... vì sẽ làm hỏng code
            alert(translations[currentUILang].err_format_unsupported);
            return;
        }
        editor.value = code; updateCode(); saveState();
    } catch (err) {
        alert(translations[currentUILang].err_format);
    }
});

// --- Resize Window ---
let isResizing = false;
document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        macWindow.style.transition = 'none';
        e.preventDefault();
    });
});
document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const rect = macWindow.getBoundingClientRect();
    const newWidth = Math.max(320, Math.min(Math.abs(e.clientX - (rect.left + rect.width / 2)) * 2, window.innerWidth - 64));
    macWindow.style.width = `${newWidth}px`;
});
document.addEventListener('mouseup', () => isResizing = false);

document.getElementById('file-title').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
});

// --- DRAWING LOGIC ---
let currentTool = 'edit', isDrawing = false, currentSvgShape = null, startX = 0, startY = 0;

function activateTool(tool) {
    currentTool = tool;
    toolBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`.tool-btn[data-tool="${tool}"]`).classList.add('active');

    if (tool === 'edit') {
        drawLayer.style.pointerEvents = 'none';
        drawLayer.style.cursor = 'default';
    } else {
        drawLayer.style.pointerEvents = 'auto';
        drawLayer.style.cursor = tool === 'text' ? 'text' : 'crosshair';
    }
}

toolBtns.forEach(btn => btn.addEventListener('click', () => {
    activateTool(btn.dataset.tool === currentTool && btn.dataset.tool !== 'edit' ? 'edit' : btn.dataset.tool);
}));

document.getElementById('clear-draw-btn').addEventListener('click', () => {
    if (drawLayer.innerHTML !== '') { drawLayer.innerHTML = ''; saveState(); }
});

drawLayer.addEventListener('pointerdown', (e) => {
    if (currentTool === 'edit') return;
    e.preventDefault();
    const rect = drawLayer.getBoundingClientRect();
    startX = e.clientX - rect.left; startY = e.clientY - rect.top;
    const color = colorPicker.value, svgNS = 'http://www.w3.org/2000/svg';

    if (currentTool === 'text') {
        const oldInput = document.getElementById('temp-text-input');
        if (oldInput) oldInput.blur();

        const input = document.createElement('input');
        input.id = 'temp-text-input'; input.type = 'text'; input.placeholder = tempTextPlaceholder;
        input.style.cssText = `position:absolute; left:${startX}px; top:${startY - 10}px; color:${color}; background:transparent; border:1px dashed rgba(150,150,150,0.5); outline:none; font-family:'JetBrains Mono',monospace; font-size:15px; z-index:50; min-width:140px; border-radius:4px; padding:2px 4px;`;
        drawLayer.parentElement.appendChild(input);
        setTimeout(() => input.focus(), 10);

        input.addEventListener('input', function () { this.style.width = ((this.value.length + 2) * 9) + 'px'; });

        let isFinalized = false;
        const finalize = () => {
            if (isFinalized) return;
            isFinalized = true;
            if (input.value.trim() !== '') {
                const txt = document.createElementNS(svgNS, 'text');
                txt.setAttribute('x', startX); txt.setAttribute('y', startY + 5);
                txt.setAttribute('fill', color); txt.setAttribute('font-family', "'JetBrains Mono', monospace");
                txt.setAttribute('font-size', '15px'); txt.textContent = input.value;
                drawLayer.appendChild(txt); saveState();
            }
            input.remove();
        };
        input.addEventListener('blur', finalize);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') finalize(); if (e.key === 'Escape') { isFinalized = true; input.remove(); } });
        return;
    }

    isDrawing = true;
    if (currentTool === 'rect') {
        currentSvgShape = document.createElementNS(svgNS, 'rect');
        currentSvgShape.setAttribute('fill', 'none'); currentSvgShape.setAttribute('rx', '4');
    } else if (currentTool === 'circle') {
        currentSvgShape = document.createElementNS(svgNS, 'ellipse');
        currentSvgShape.setAttribute('fill', 'none');
    } else if (currentTool === 'arrow') {
        currentSvgShape = document.createElementNS(svgNS, 'path');
        currentSvgShape.setAttribute('fill', 'none'); currentSvgShape.setAttribute('stroke-linecap', 'round'); currentSvgShape.setAttribute('stroke-linejoin', 'round');
    }

    if (currentSvgShape) {
        currentSvgShape.setAttribute('stroke', color);
        currentSvgShape.setAttribute('stroke-width', '3');
        drawLayer.appendChild(currentSvgShape);
    }
});

drawLayer.addEventListener('pointermove', (e) => {
    if (!isDrawing || !currentSvgShape) return;
    const rect = drawLayer.getBoundingClientRect();
    const curX = e.clientX - rect.left, curY = e.clientY - rect.top;

    if (currentTool === 'rect') {
        currentSvgShape.setAttribute('x', Math.min(startX, curX)); currentSvgShape.setAttribute('y', Math.min(startY, curY));
        currentSvgShape.setAttribute('width', Math.abs(curX - startX)); currentSvgShape.setAttribute('height', Math.abs(curY - startY));
    } else if (currentTool === 'circle') {
        currentSvgShape.setAttribute('cx', startX + (curX - startX) / 2); currentSvgShape.setAttribute('cy', startY + (curY - startY) / 2);
        currentSvgShape.setAttribute('rx', Math.abs(curX - startX) / 2); currentSvgShape.setAttribute('ry', Math.abs(curY - startY) / 2);
    } else if (currentTool === 'arrow') {
        const angle = Math.atan2(curY - startY, curX - startX), headlen = 12, headAngle = Math.PI / 6;
        const x3 = curX - headlen * Math.cos(angle - headAngle), y3 = curY - headlen * Math.sin(angle - headAngle);
        const x4 = curX - headlen * Math.cos(angle + headAngle), y4 = curY - headlen * Math.sin(angle + headAngle);
        currentSvgShape.setAttribute('d', `M ${startX} ${startY} L ${curX} ${curY} M ${curX} ${curY} L ${x3} ${y3} M ${curX} ${currentY = curY} L ${x4} ${y4}`);
    }
});

const stopDrawing = () => { if (isDrawing) { isDrawing = false; if (currentSvgShape) saveState(); } currentSvgShape = null; };
drawLayer.addEventListener('pointerup', stopDrawing);
drawLayer.addEventListener('pointerleave', stopDrawing);

// --- EXPORT ---
document.getElementById('export-btn').addEventListener('click', async function () {
    const oldText = this.innerHTML;
    const loadingText = translations[currentUILang].msg_exporting;
    this.innerHTML = `<svg class="animate-spin w-4 h-4 mr-1" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>${loadingText}</span>`;
    this.disabled = true;
    editor.style.display = 'none';

    try {
        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(exportContainer, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
        const link = document.createElement('a');
        link.download = `code-snippet-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        alert(translations[currentUILang].err_export);
    } finally {
        editor.style.display = 'block';
        this.innerHTML = oldText;
        this.disabled = false;
    }
});
