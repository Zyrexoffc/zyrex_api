let settings = {};
let allApiItems = [];

const categoryIcons = {
    'Downloader': 'folder',
    'Imagecreator': 'image',
    'Openai': 'smart_toy',
    'Random': 'shuffle',
    'Search': 'search',
    'Stalker': 'visibility',
    'Tools': 'build',
    'Orderkuota': 'paid',
    'AI Tools': 'psychology',
    'Fun': 'sentiment_satisfied'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        initTheme();
        settings = await loadSettings();
        setupUI();
        await loadAPIData();
        setupEventListeners();
        setupThemeToggle();
        updateActiveUsers();
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage(error);
    } finally {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/settings');
        if (!response.ok) throw new Error('Settings not found');
        return await response.json();
    } catch (error) {
        return getDefaultSettings();
    }
}

function getDefaultSettings() {
    return {
        name: "Zyrex API",
        creator: "Zyrex Official",
        description: "Interactive API documentation with real-time testing",
        categories: []
    };
}

function setupUI() {
    const titleApi = document.getElementById("titleApi");
    const descApi = document.getElementById("descApi");
    const footer = document.getElementById("footer");
    
    if (titleApi) titleApi.textContent = settings.name || "Zyrex API";
    if (descApi) descApi.textContent = settings.description || "Interactive API documentation with real-time testing";
    if (footer) footer.textContent = `© ${new Date().getFullYear()} ${settings.creator || "Zyrex"} - ${settings.name || "Zyrex API"}`;
    
    const telegramLink = document.getElementById('telegramLink');
    const whatsappLink = document.getElementById('whatsappLink');
    const youtubeLink = document.getElementById('youtubeLink');
    const Information = document.getElementById("contactCustomerBtn");
    const apiAvatar = document.getElementById("apiAvatar");
    
    if (telegramLink) telegramLink.href = settings.linkTelegram || '#';
    if (whatsappLink) whatsappLink.href = settings.linkWhatsapp || '#';
    if (Information) Information.href = settings.linkWhatsapp || '#';
    if (youtubeLink) youtubeLink.href = settings.linkYoutube || '#';
    if (apiAvatar) apiAvatar.src = settings.avatarUrl || apiAvatar.getAttribute('src') || '';
}

function updateActiveUsers() {
    const el = document.getElementById('activeUsers');
    if (el) {
        const users = Math.floor(Math.random() * 5000) + 1000;
        el.textContent = users.toLocaleString();
    }
}

let originalCategories = [];

async function loadAPIData() {
    console.log('Loading API data...');
    
    try {
        if (!settings.categories || settings.categories.length === 0) {
            console.log('No categories found, using default');
            settings.categories = [];
        }
        
        originalCategories = JSON.parse(JSON.stringify(settings.categories || []));
        console.log('Original categories saved:', originalCategories.length);
        
        renderAPIData(originalCategories);
        
    } catch (error) {
        console.error('Error loading API data:', error);
        renderAPIData([]);
    }
}

function renderAPIData(categories) {
    console.log('Rendering API data:', categories.length, 'categories');
    
    const apiList = document.getElementById('apiList');
    if (!apiList) {
        console.error('apiList element not found!');
        return;
    }
    
    apiList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        apiList.innerHTML = '<div class="text-center py-10"><div class="panel p-7" style="color: var(--muted);">No API data available</div></div>';
        return;
    }
    
    let html = '';
    
    categories.forEach((category, catIndex) => {
        if (!category || !category.items) return;
        
        const icon = categoryIcons[category.name] || 'folder';
        const itemCount = category.items.length || 0;
        
        html += `
        <div class="category-group" data-category="${(category.name || '').toLowerCase()}">
            <div class="panel overflow-hidden">
                <button onclick="toggleCategory(${catIndex})" class="w-full px-4 sm:px-5 py-4 text-left flex items-center justify-between transition-colors duration-150" style="background: rgba(255,255,255,.02);">
                    <h2 class="flex items-center min-w-0">
                        <span class="material-icons text-lg mr-3" style="color: var(--muted);">${icon}</span>
                        <span class="truncate max-w-xs text-sm sm:text-base font-semibold" style="color: var(--text);">${category.name || 'Unnamed Category'}</span>
                        <span class="ml-2 text-xs" style="color: var(--muted2);">(${itemCount})</span>
                    </h2>
                    <span class="material-icons transition-transform duration-150" id="category-icon-${catIndex}" style="color: var(--muted);">expand_less</span>
                </button>
                
                <div id="category-${catIndex}">`;
        
        category.items.forEach((item, endpointIndex) => {
    if (!item) return;

    const method = item.method || 'GET';
    const pathParts = (item.path || '').split('?');
    const path = pathParts[0] || '';
    const itemName = item.name || 'Unnamed Endpoint';
    const itemDesc = item.desc || 'No description';

    const status = (item.status || 'ready').toLowerCase();
    const statusClass =
        status.includes('error')
            ? 'status-error'
            : status.includes('update')
            ? 'status-update'
            : 'status-ready';

    html += `
    <div class="border-t api-item transition-all duration-200"
         style="border-color: var(--stroke);"
         data-method="${method.toLowerCase()}"
         data-path="${path}"
         data-alias="${itemName}"
         data-description="${itemDesc}"
         data-category="${(category.name || '').toLowerCase()}">

        <!-- HEADER -->
        <button
            onclick="toggleEndpoint(${catIndex}, ${endpointIndex})"
            class="w-full px-4 sm:px-5 py-4 text-left flex items-center justify-between gap-3
                   hover:bg-white/5 active:bg-white/10 transition-colors duration-150">

            <div class="flex items-center min-w-0 flex-1 gap-3">

                <!-- METHOD -->
                <span
                    class="inline-flex items-center justify-center px-3 py-1 text-xs text-white
                           rounded-xl font-semibold tracking-wide flex-shrink-0
                           method-${method.toLowerCase()}">
                    ${method}
                </span>

                <!-- PATH & META -->
                <div class="flex flex-col min-w-0 flex-1 gap-0.5">
                    <span
                        class="truncate font-mono text-sm leading-snug"
                        title="${path}"
                        style="color: var(--text);">
                        ${path || '/'}
                    </span>

                    <div class="flex items-center gap-2 min-w-0">
                        <span
                            class="text-[13px] truncate max-w-[90%]"
                            title="${itemName}"
                            style="color: var(--muted);">
                            ${itemName}
                        </span>

                        <span
                            class="px-2 py-0.5 text-[11px] font-medium rounded-full ${statusClass}">
                            ${item.status || 'ready'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- ICON -->
            <span
                class="material-icons transition-transform duration-200 flex-shrink-0"
                id="endpoint-icon-${catIndex}-${endpointIndex}"
                style="color: var(--muted);">
                expand_more
            </span>
        </button>

        <!-- EXPAND -->
        <div
            id="endpoint-${catIndex}-${endpointIndex}"
            class="hidden border-t expand-transition"
            style="border-color: var(--stroke); background: rgba(255,255,255,.025);">

            <div class="p-4 sm:p-5 space-y-5">

                <!-- DESC -->
                <div class="text-[13px] leading-relaxed"
                     style="color: var(--muted);">
                    ${itemDesc}
                </div>

                <!-- FORM -->
                <form id="form-${catIndex}-${endpointIndex}" class="space-y-5">

                    <!-- PARAMS -->
                    <div id="params-container-${catIndex}-${endpointIndex}"
                         class="space-y-3"></div>

                    <!-- REQUEST URL -->
                    <div class="space-y-2">
                        <div class="font-semibold text-[12px] flex items-center gap-1"
                             style="color: var(--text);">
                            <span class="material-icons text-[14px]"
                                  style="color: var(--muted);">link</span>
                            REQUEST URL
                        </div>

                        <div class="flex items-center gap-2">
                            <div
                                class="flex-1 min-w-0 rounded-2xl px-3 py-2
                                       overflow-x-auto scrollbar-thin"
                                style="background: rgba(0,0,0,.18);
                                       border: 1px solid var(--stroke);">
                                <code
                                    id="url-display-${catIndex}-${endpointIndex}"
                                    class="block text-[13px] font-mono whitespace-nowrap"
                                    style="color: var(--text);">
                                    ${window.location.origin}${item.path || ''}
                                </code>
                            </div>

                            <button
                                type="button"
                                onclick="copyUrl(${catIndex}, ${endpointIndex})"
                                class="copy-btn rounded-2xl px-3 py-2 text-[13px]
                                       hover:bg-white/10 transition"
                                style="border: 1px solid var(--stroke);
                                       color: var(--text);">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <!-- ACTIONS -->
                    <div class="flex gap-2 flex-wrap">
                        <button
                            type="button"
                            onclick="executeRequest(event, ${catIndex}, ${endpointIndex}, '${method}', '${path}', 'application/json')"
                            class="btn-gradient text-white px-6 py-2.5 rounded-2xl
                                   text-xs font-semibold flex items-center gap-2">
                            <i class="fas fa-play"></i>
                            Execute
                        </button>

                        <button
                            type="button"
                            onclick="clearResponse(${catIndex}, ${endpointIndex})"
                            class="px-6 py-2.5 rounded-2xl text-xs font-semibold
                                   flex items-center gap-2 hover:bg-white/10 transition"
                            style="border: 1px solid var(--stroke);
                                   color: var(--text);">
                            <i class="fas fa-times"></i>
                            Clear
                        </button>
                    </div>
                </form>

                <!-- RESPONSE -->
                <div id="response-${catIndex}-${endpointIndex}" class="hidden space-y-2">

                    <div class="font-semibold text-[12px] flex items-center gap-1"
                         style="color: var(--text);">
                        <span class="material-icons text-[14px]"
                              style="color: var(--muted);">code</span>
                        RESPONSE
                    </div>

                    <div class="rounded-2xl overflow-hidden"
                         style="border: 1px solid var(--stroke);
                                background: rgba(0,0,0,.14);">

                        <div class="px-4 py-3 flex items-center justify-between"
                             style="background: rgba(255,255,255,.03);
                                    border-bottom: 1px solid var(--stroke);">

                            <div class="flex items-center gap-2">
                                <span
                                    id="response-status-${catIndex}-${endpointIndex}"
                                    class="text-[12px] px-2 py-1 rounded-xl">
                                    200 OK
                                </span>
                                <span
                                    id="response-time-${catIndex}-${endpointIndex}"
                                    class="text-[12px]"
                                    style="color: var(--muted);">
                                    0ms
                                </span>
                            </div>

                            <button
                                onclick="copyResponse(${catIndex}, ${endpointIndex})"
                                class="copy-btn text-[13px] px-2 py-1 rounded-xl
                                       hover:bg-white/10 transition"
                                style="color: var(--muted);">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>

                        <div class="p-0 max-h-96 overflow-auto scrollbar-thin">
                            <div
                                id="response-content-${catIndex}-${endpointIndex}"
                                class="response-media-container">
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </div>`;
});

html += `</div></div>`;
    });
    
    apiList.innerHTML = html;
    
    setTimeout(() => {
        if (categories && categories.length > 0) {
            categories.forEach((category, catIndex) => {
                if (category && category.items) {
                    category.items.forEach((item, endpointIndex) => {
                        if (item) {
                            initializeEndpointParameters(catIndex, endpointIndex, item);
                        }
                    });
                }
            });
        }
    }, 100);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) {
        console.warn('Search input not found');
        return;
    }
    
    searchInput.addEventListener('input', function() {
        handleSearch(this.value);
    });
}

function handleSearch(searchTerm) {
    const searchTermLower = (searchTerm || '').toLowerCase().trim();
    const noResults = document.getElementById('noResults');
    
    if (!searchTermLower) {
        console.log('Empty search, showing all');
        renderAPIData(originalCategories);
        if (noResults) noResults.classList.add('hidden');
        return;
    }
    
    console.log('Searching for:', searchTermLower);
    
    const filteredData = [];
    
    originalCategories.forEach(category => {
        if (!category || !category.items) return;
        
        const filteredItems = [];
        
        category.items.forEach(item => {
            if (!item) return;
            
            const matches = 
                (item.name || '').toLowerCase().includes(searchTermLower) ||
                (item.desc || '').toLowerCase().includes(searchTermLower) ||
                (item.path || '').toLowerCase().includes(searchTermLower) ||
                (item.method || '').toLowerCase().includes(searchTermLower) ||
                (category.name || '').toLowerCase().includes(searchTermLower);
            
            if (matches) {
                filteredItems.push(item);
            }
        });
        
        if (filteredItems.length > 0) {
            filteredData.push({
                ...category,
                items: filteredItems
            });
        }
    });
    
    console.log('Filtered results:', filteredData.length, 'categories');
    
    if (filteredData.length === 0) {
        const apiList = document.getElementById('apiList');
        if (apiList) apiList.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
    } else {
        renderAPIData(filteredData);
        if (noResults) noResults.classList.add('hidden');
    }
}

function initializeEndpointParameters(catIndex, endpointIndex, item) {
    const paramsContainer = document.getElementById(`params-container-${catIndex}-${endpointIndex}`);
    if (!paramsContainer) return;
    
    const params = extractParameters(item.path);
    
    if (params.length === 0) {
        paramsContainer.innerHTML = `
            <div class="text-center py-4 rounded-2xl" style="background: rgba(255,255,255,.04); border: 1px solid var(--stroke);">
                <i class="fas fa-check text-xs mb-1" style="color: rgba(34,197,94,.95);"></i>
                <p class="text-xxs" style="color: var(--muted);">No parameters required</p>
            </div>
        `;
        return;
    }
    
    let paramsHtml = '';
    params.forEach(param => {
        const isRequired = param.required;
        paramsHtml += `<div class="rounded-2xl p-3" style="background: rgba(255,255,255,.03); border: 1px solid var(--stroke);">
            <div class="flex items-center justify-between mb-1.5">
                <label class="block text-[13px] font-semibold" style="color: var(--text);">${param.name} ${isRequired ? '<span style="color: rgba(239,68,68,.95)">*</span>' : ''}</label>
                <span class="text-[12px]" style="color: var(--muted2);">${param.type}</span>
            </div>
            <input 
                type="text" 
                name="${param.name}" 
                class="w-full px-3 py-2 rounded-xl text-[13px] input-luxe font-mono"
                placeholder="Input ${param.name}..."
                ${isRequired ? 'required' : ''}
                oninput="updateRequestUrl(${catIndex}, ${endpointIndex})"
                id="param-${catIndex}-${endpointIndex}-${param.name}"
            >
        </div>`;
    });
    
    paramsContainer.innerHTML = paramsHtml;
    
    setTimeout(() => {
        updateRequestUrl(catIndex, endpointIndex);
    }, 50);
}

function extractParameters(path) {
    const params = [];
    if (!path) return params;
    
    const queryString = path.split('?')[1];
    
    if (!queryString) return params;
    
    try {
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams) {
            if (value === '' || value === 'YOUR_API_KEY') {
                params.push({
                    name: key,
                    required: true,
                    type: getParamType(key),
                    description: getParamDescription(key)
                });
            }
        }
    } catch (error) {
        console.error('Error parsing query string:', error);
    }
    
    return params;
}

function getParamType(paramName) {
    const types = {
        'apikey': 'string',
        'url': 'string',
        'question': 'string',
        'query': 'string',
        'prompt': 'string',
        'format': 'string',
        'quality': 'string',
        'size': 'string',
        'limit': 'number'
    };
    return types[paramName] || 'string';
}

function getParamDescription(paramName) {
    const descriptions = {
        'apikey': 'Your API key for authentication',
        'url': 'URL of the content to download/process',
        'question': 'Question or message to ask the AI',
        'query': 'Search query or keywords',
        'prompt': 'Text description for image generation',
        'format': 'Output format (mp4, mp3, jpg, png)',
        'quality': 'Video quality (360p, 720p, 1080p)',
        'size': 'Image dimensions (512x512, 1024x1024)',
        'limit': 'Number of results to return'
    };
    return descriptions[paramName] || paramName;
}

function toggleCategory(index) {
    const category = document.getElementById(`category-${index}`);
    const icon = document.getElementById(`category-icon-${index}`);
    if (category && icon) {
        if (category.classList.contains('hidden')) {
            category.classList.remove('hidden');
            icon.textContent = 'expand_less';
        } else {
            category.classList.add('hidden');
            icon.textContent = 'expand_more';
        }
    }
}

function toggleEndpoint(catIndex, endpointIndex) {
    const endpoint = document.getElementById(`endpoint-${catIndex}-${endpointIndex}`);
    const icon = document.getElementById(`endpoint-icon-${catIndex}-${endpointIndex}`);
    if (endpoint && icon) {
        if (endpoint.classList.contains('hidden')) {
            endpoint.classList.remove('hidden');
            icon.textContent = 'expand_less';
        } else {
            endpoint.classList.add('hidden');
            icon.textContent = 'expand_more';
        }
    }
}

function updateRequestUrl(catIndex, endpointIndex) {
    const form = document.getElementById(`form-${catIndex}-${endpointIndex}`);
    if (!form) return { url: '', hasErrors: false };

    const urlDisplay = document.getElementById(`url-display-${catIndex}-${endpointIndex}`);
    if (!urlDisplay) return { url: '', hasErrors: false };

    let hasErrors = false;
    if (!urlDisplay.dataset.baseUrl) {
        const full = urlDisplay.textContent.trim();
        const [base, query] = full.split('?');
        urlDisplay.dataset.baseUrl = base;
        urlDisplay.dataset.defaultQuery = query || '';
    }
    const baseUrl = urlDisplay.dataset.baseUrl;
    const params = new URLSearchParams(urlDisplay.dataset.defaultQuery);

    const inputs = form.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        const name = input.name;
        const value = input.value.trim();

        input.classList.remove('border-red-500');

        if (input.required && !value) {
            hasErrors = true;
            input.classList.add('border-red-500');
        }
        params.set(name, value);
    });

    const finalUrl = baseUrl + '?' + params.toString();
    urlDisplay.textContent = finalUrl;

    return { url: finalUrl, hasErrors };
}

async function executeRequest(event, catIndex, endpointIndex, method, path, produces) {
    event.preventDefault();
    
    const { url, hasErrors } = updateRequestUrl(catIndex, endpointIndex);
    
    if (hasErrors) {
        showToast('Please fill in all required parameters', 'error');
        return;
    }
    
    const responseDiv = document.getElementById(`response-${catIndex}-${endpointIndex}`);
    const responseContent = document.getElementById(`response-content-${catIndex}-${endpointIndex}`);
    const responseStatus = document.getElementById(`response-status-${catIndex}-${endpointIndex}`);
    const responseTime = document.getElementById(`response-time-${catIndex}-${endpointIndex}`);
    
    if (!responseDiv || !responseContent || !responseStatus || !responseTime) {
        showToast('Error: Response elements not found', 'error');
        return;
    }
    
    responseDiv.classList.remove('hidden');
    responseContent.innerHTML = '<div class="loader mx-auto mt-8"></div>';
    responseStatus.textContent = 'Loading...';
    responseStatus.className = 'text-xs px-2 py-1 rounded-xl';
    responseStatus.style.background = 'rgba(148,163,184,.14)';
    responseStatus.style.color = 'var(--muted)';
    responseStatus.style.border = '1px solid var(--stroke)';
    responseTime.textContent = '';
    
    const startTime = Date.now();
    
    try {
        console.log('Request URL:', url);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Piantech-API-Docs'
            }
        });
        
        const responseTimeMs = Date.now() - startTime;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        
        responseStatus.textContent = `${response.status} OK`;
        responseStatus.className = 'text-xs px-2 py-1 rounded-xl';
        responseStatus.style.background = 'rgba(34,197,94,.12)';
        responseStatus.style.color = 'rgba(34,197,94,.95)';
        responseStatus.style.border = '1px solid rgba(34,197,94,.18)';
        responseTime.textContent = `${responseTimeMs}ms`;
        
        if (contentType.startsWith('image/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <img src="${blobUrl}" alt="Image Response" class="max-w-full max-h-full object-contain rounded-2xl">
            `;
            
        } else if (contentType.includes('audio/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <audio controls autoplay class="w-full max-w-md">
                    <source src="${blobUrl}" type="${contentType}">
                </audio>
            `;
            
        } else if (contentType.includes('video/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <video controls autoplay class="w-full h-full object-contain rounded-2xl">
                    <source src="${blobUrl}" type="${contentType}">
                </video>
            `;
            
        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data && typeof data === 'object' && data.error) {
                throw new Error(`API Error: ${data.error}`);
            }
            
            const formattedResponse = JSON.stringify(data, null, 2);
            responseContent.innerHTML = `
<pre class="block whitespace-pre-wrap text-xs px-4 pt-3 pb-3 overflow-x-auto leading-relaxed font-mono" style="color: var(--text);">${formattedResponse}</pre>`;
           
        } else if (contentType.includes('text/')) {
            const text = await response.text();
            responseContent.innerHTML = `
                <pre class="text-xs p-4 overflow-x-auto whitespace-pre-wrap font-mono" style="color: var(--text);">${escapeHtml(text)}</pre>
            `;
            
        } else {
            const text = await response.text();
            responseContent.innerHTML = `
                <pre class="text-xs p-4 overflow-x-auto whitespace-pre-wrap font-mono" style="color: var(--text);">${escapeHtml(text)}</pre>
            `;
        }
        
        showToast('Request successful!', 'success');
        
    } catch (error) {
        console.error('API Request Error:', error);
        
        const errorMessage = error.message || 'Unknown error occurred';
        responseContent.innerHTML = `
            <div class="text-center py-10">
                <i class="fas fa-exclamation-triangle text-2xl mb-3" style="color: rgba(239,68,68,.95);"></i>
                <div class="text-sm font-semibold" style="color: rgba(239,68,68,.95);">Error</div>
                <div class="text-xs mt-1" style="color: var(--muted);">${escapeHtml(errorMessage)}</div>
            </div>
        `;
        responseStatus.textContent = 'Error';
        responseStatus.className = 'text-xs px-2 py-1 rounded-xl';
        responseStatus.style.background = 'rgba(239,68,68,.12)';
        responseStatus.style.color = 'rgba(239,68,68,.95)';
        responseStatus.style.border = '1px solid rgba(239,68,68,.18)';
        responseTime.textContent = '0ms';
        
        showToast(`Request failed: ${errorMessage}`, 'error');
    }
}

function clearResponse(catIndex, endpointIndex) {
    const form = document.getElementById(`form-${catIndex}-${endpointIndex}`);
    const responseDiv = document.getElementById(`response-${catIndex}-${endpointIndex}`);
    
    if (!form || !responseDiv) return;
    
    const inputs = form.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('border-red-500');
    });
    
    responseDiv.classList.add('hidden');
    updateRequestUrl(catIndex, endpointIndex);
    showToast('Form cleared', 'info');
}

function copyUrl(catIndex, endpointIndex) {
    const urlDisplay = document.getElementById(`url-display-${catIndex}-${endpointIndex}`);
    if (!urlDisplay) return;
    
    const url = urlDisplay.textContent.trim();
    
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL copied!', 'success');
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        showToast('Failed to copy URL', 'error');
    });
}

function copyResponse(catIndex, endpointIndex) {
    const responseContent = document.getElementById(`response-content-${catIndex}-${endpointIndex}`);
    if (!responseContent) return;
    
    const text = responseContent.textContent || responseContent.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Response copied!', 'success');
    }).catch(err => {
        console.error('Failed to copy response:', err);
        showToast('Failed to copy response', 'error');
    });
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    const color = {
        'success': '#22c55e',
        'error': '#ef4444',
        'info': '#3b82f6'
    }[type] || '#3b82f6';
    
    toast.innerHTML = `
        <i class="fas ${icon} text-sm" style="color: ${color}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(err = undefined) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    loadingScreen.innerHTML = `
        <div class="text-center panel px-8 py-7">
            <i class="fas fa-wifi text-3xl mb-4" style="color: var(--muted);"></i>
            <p class="text-sm" style="color: var(--muted);">${err ? err : "Using demo configuration"}</p>
        </div>
    `;
    
    settings = getDefaultSettings();
    setupUI();
    
    originalCategories = [];
    renderAPIData([]);
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            handleSearch(this.value);
        });
    }
    
    updateActiveUsers();
    
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 300);
    }, 1000);
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    const html = document.documentElement;
    if (saved === 'light') {
        html.classList.add('light');
        html.classList.remove('dark');
    } else {
        html.classList.add('dark');
        html.classList.remove('light');
    }
}

function setupThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    updateThemeUI();
    btn.addEventListener('click', () => {
        toggleTheme();
        updateThemeUI();
    });
}

function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.classList.contains('light');
    if (isLight) {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.add('light');
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

function updateThemeUI() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    const isLight = html.classList.contains('light');

    if (icon) icon.textContent = isLight ? 'light_mode' : 'dark_mode';
    if (label) label.textContent = isLight ? 'Light' : 'Dark';
}

window.toggleCategory = toggleCategory;
window.toggleEndpoint = toggleEndpoint;
window.executeRequest = executeRequest;
window.clearResponse = clearResponse;
window.copyUrl = copyUrl;
window.copyResponse = copyResponse;
window.updateRequestUrl = updateRequestUrl;