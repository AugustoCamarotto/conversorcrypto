// Variáveis globais para estado da aplicação
let currentUser = null; // Armazenará { username, token }
let coinsList = [];
let favorites = [];

const API_BASE_URL = "http://localhost:3000/api"; // URL base para o backend Node.js

// Elemento principal da aplicação onde o conteúdo será renderizado
const appContainer = document.getElementById("app");

// Função para obter o token JWT do localStorage
function getToken() {
    return localStorage.getItem("jwtToken");
}

// Função para definir o token JWT no localStorage
function setToken(token) {
    if (token) {
        localStorage.setItem("jwtToken", token);
    } else {
        localStorage.removeItem("jwtToken");
    }
}

// Função para fazer requisições à API
async function apiRequest(endpoint, method = "GET", body = null) {
    const headers = {
        "Content-Type": "application/json",
    };
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (response.status === 401) { // Não autorizado ou token expirado
            setToken(null); // Limpa o token inválido
            currentUser = null;
            renderLoginPage("Sessão expirada ou inválida. Faça login novamente.");
            return null;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `Erro ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`Erro na requisição API para ${endpoint}:`, error);
        // Não limpar o token aqui, pois pode ser um erro de rede ou servidor, não necessariamente de autenticação
        displayMessage(error.message, "error");
        return null;
    }
}

// Funções de renderização de tela
function renderLoginPage(message = "") {
    appContainer.innerHTML = `
        <div class="section" id="login-section">
            <h2>Login</h2>
            ${message ? `<p class="${message.includes("sucesso") ? "success-message" : "error-message"}">${message}</p>` : ""}
            <form id="loginForm">
                <div>
                    <label for="loginUsername">Usuário:</label>
                    <input type="text" id="loginUsername" name="username" required>
                </div>
                <div>
                    <label for="loginPassword">Senha:</label>
                    <input type="password" id="loginPassword" name="password" required>
                </div>
                <button type="submit">Entrar</button>
            </form>
            <p>Não tem uma conta? <button onclick="renderRegisterPage()" class="link-button">Registre-se</button></p>
        </div>
    `;
    document.getElementById("loginForm").addEventListener("submit", handleLogin);
}

function renderRegisterPage(message = "") {
    appContainer.innerHTML = `
        <div class="section" id="register-section">
            <h2>Cadastro</h2>
            ${message ? `<p class="${message.includes("sucesso") ? "success-message" : "error-message"}">${message}</p>` : ""}
            <form id="registerForm">
                <div>
                    <label for="registerUsername">Usuário:</label>
                    <input type="text" id="registerUsername" name="username" required>
                </div>
                <div>
                    <label for="registerPassword">Senha:</label>
                    <input type="password" id="registerPassword" name="password" required>
                </div>
                <button type="submit">Registrar</button>
            </form>
            <p>Já tem uma conta? <button onclick="renderLoginPage()" class="link-button">Faça Login</button></p>
        </div>
    `;
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
}

async function renderMainPage() {
    if (!currentUser || !currentUser.token) { // Verifica se há um token válido
        renderLoginPage("Você precisa estar logado para acessar esta página.");
        return;
    }

    appContainer.innerHTML = `
        <h1>Simulador de Criptomoedas</h1>
        <nav>
            <button onclick="renderSimulatorPage()" id="nav-simulator" class="active">Simulador</button>
            <button onclick="renderHistoryPage()" id="nav-history">Histórico</button>
            <button onclick="renderFavoritesPage()" id="nav-favorites">Favoritos</button>
            <button onclick="handleLogout()">Sair (${currentUser.username})</button>
        </nav>
        <div id="page-content"></div>
    `;
    await renderSimulatorPage(); // Página inicial padrão após login
}

async function renderSimulatorPage() {
    setActiveNav("simulator");
    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    if (coinsList.length === 0) {
        const fetchedCoins = await apiRequest("/crypto/coins_list");
        if (fetchedCoins) {
            // A API Node.js já retorna a lista de moedas, não um objeto com uma chave "coins"
            coinsList = fetchedCoins.sort((a, b) => a.name.localeCompare(b.name));
        }
    }
    await loadFavorites(); // Garante que os favoritos estão carregados

    const options = coinsList.map(coin => {
        const isFavorite = favorites.some(fav => fav.coin_id === coin.id);
        return `<option value="${coin.id}">${coin.name} (${coin.symbol.toUpperCase()}) ${isFavorite ? "★" : "☆"}</option>`;
    }).join("");

    pageContent.innerHTML = `
        <div class="section" id="simulator-section">
            <h2>Simulador de Conversão</h2>
            <form id="conversionForm">
                <div class="favorite-dropdown-container">
                    <select id="coinSelect" name="coin_id" required>
                        <option value="">Selecione uma Criptomoeda</option>
                        ${options}
                    </select>
                    <button type="button" id="toggleFavoriteBtn" title="Favoritar/Desfavoritar">☆</button>
                </div>
                <div>
                    <label for="amount">Quantidade:</label>
                    <input type="number" id="amount" name="amount" step="any" required>
                </div>
                <button type="submit">Converter</button>
            </form>
            <div id="conversionResult"></div>
            <div id="message-area"></div>
        </div>
    `;

    const coinSelect = document.getElementById("coinSelect");
    const toggleFavoriteBtn = document.getElementById("toggleFavoriteBtn");

    coinSelect.addEventListener("change", () => updateFavoriteButtonVisual(coinSelect.value));
    toggleFavoriteBtn.addEventListener("click", () => handleToggleFavorite(coinSelect.value));
    document.getElementById("conversionForm").addEventListener("submit", handleConversion);
    if(coinSelect.value) updateFavoriteButtonVisual(coinSelect.value); 
}

async function updateFavoriteButtonVisual(coinId) {
    const toggleFavoriteBtn = document.getElementById("toggleFavoriteBtn");
    if (!toggleFavoriteBtn || !coinId) {
        if(toggleFavoriteBtn) toggleFavoriteBtn.innerHTML = "☆";
        return;
    }
    const isFavorite = favorites.some(fav => fav.coin_id === coinId);
    toggleFavoriteBtn.innerHTML = isFavorite ? "★" : "☆";
    toggleFavoriteBtn.title = isFavorite ? "Desfavoritar" : "Favoritar";
}

async function renderHistoryPage() {
    setActiveNav("history");
    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    const historyData = await apiRequest("/crypto/history");
    let historyHtml = "<p>Nenhum histórico de conversão encontrado.</p>";

    if (historyData && historyData.length > 0) {
        historyHtml = `<ul class="item-list">`;
        historyData.forEach(item => {
            historyHtml += `
                <li>
                    <div>
                        <strong>${item.coin_id.toUpperCase()}</strong>: ${item.amount} <br>
                        Valor em BRL: ${parseFloat(item.brl_value).toFixed(2)} (Taxa: ${parseFloat(item.brl_rate).toFixed(2)})<br>
                        Valor em USD: ${parseFloat(item.usd_value).toFixed(2)} (Taxa: ${parseFloat(item.usd_rate).toFixed(2)})<br>
                        Data: ${new Date(item.timestamp).toLocaleString("pt-BR")}
                    </div>
                </li>
            `;
        });
        historyHtml += `</ul>`;
    }

    pageContent.innerHTML = `
        <div class="section" id="history-section">
            <h2>Histórico de Conversões</h2>
            ${historyHtml}
        </div>
    `;
}

async function renderFavoritesPage() {
    setActiveNav("favorites");
    const pageContent = document.getElementById("page-content");
    if (!pageContent) return;

    await loadFavorites();
    let favoritesHtml = "<p>Nenhuma criptomoeda favoritada.</p>";

    if (favorites && favorites.length > 0) {
        favoritesHtml = `<ul class="item-list">`;
        favorites.forEach(fav => {
            const coinDetail = coinsList.find(c => c.id === fav.coin_id);
            const displayName = coinDetail ? `${coinDetail.name} (${coinDetail.symbol.toUpperCase()})` : fav.coin_id;
            favoritesHtml += `
                <li>
                    <span>${displayName}</span>
                    <div class="actions">
                        <button onclick="handleRemoveFavoriteFromListPage(\'${fav.coin_id}\')">Desfavoritar</button>
                    </div>
                </li>
            `;
        });
        favoritesHtml += `</ul>`;
    }

    pageContent.innerHTML = `
        <div class="section" id="favorites-section">
            <h2>Criptomoedas Favoritadas</h2>
            ${favoritesHtml}
             <div id="message-area"></div>
        </div>
    `;
}

// Funções de manipulação de eventos
async function handleLogin(event) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const result = await apiRequest("/auth/login", "POST", { username, password });
    if (result && result.token) {
        setToken(result.token);
        currentUser = { username: result.username, token: result.token };
        await loadFavorites(); // Carregar favoritos após login bem-sucedido
        renderMainPage();
    } else if (result) { // Se houver resultado, mas sem token, exibir mensagem de erro do backend
        renderLoginPage(result.message || "Falha no login.");
    } else {
        // Erro já tratado por apiRequest e mensagem exibida
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = event.target.username.value;
    const password = event.target.password.value;
    const result = await apiRequest("/auth/register", "POST", { username, password });
    if (result && result.token) { // O backend Node.js retorna token no registro também
        renderLoginPage("Usuário registrado com sucesso! Faça o login.");
    } else if (result) {
        renderRegisterPage(result.message || "Falha no registro.");
    } else {
        // Erro já tratado por apiRequest
    }
}

async function handleLogout() {
    // Não há endpoint de logout explícito com JWT no backend, apenas invalidamos no frontend
    setToken(null);
    currentUser = null;
    coinsList = [];
    favorites = [];
    renderLoginPage("Logout realizado com sucesso.");
}

async function handleConversion(event) {
    event.preventDefault();
    const coin_id = event.target.coin_id.value;
    const amount = parseFloat(event.target.amount.value);

    if (!coin_id || isNaN(amount) || amount <= 0) {
        displayMessage("Por favor, selecione uma moeda e insira uma quantidade válida.", "error", "conversionResult");
        return;
    }

    const result = await apiRequest("/crypto/convert", "POST", { coin_id, amount });
    const resultDiv = document.getElementById("conversionResult");
    if (result && resultDiv) {
        resultDiv.innerHTML = `
            <p><strong>${amount} ${coin_id.toUpperCase()} equivalem a:</strong></p>
            <p>BRL: ${parseFloat(result.brl_value).toFixed(2)} (cotação: ${parseFloat(result.brl_rate).toFixed(2)})</p>
            <p>USD: ${parseFloat(result.usd_value).toFixed(2)} (cotação: ${parseFloat(result.usd_rate).toFixed(2)})</p>
        `;
        displayMessage(result.message || "Conversão bem-sucedida!", "success", "message-area");
    } else if (resultDiv) {
        resultDiv.innerHTML = ""; 
    }
}

async function handleToggleFavorite(coinId) {
    if (!coinId) {
        displayMessage("Selecione uma moeda para favoritar.", "error", "message-area");
        return;
    }

    const isCurrentlyFavorite = favorites.some(fav => fav.coin_id === coinId);
    let result;
    if (isCurrentlyFavorite) {
        result = await apiRequest(`/crypto/favorites/${coinId}`, "DELETE");
    } else {
        result = await apiRequest("/crypto/favorites", "POST", { coin_id: coinId });
    }

    if (result) {
        displayMessage(result.message, "success", "message-area");
        await loadFavorites(); 
        await refreshCoinListDropdown(); 
        updateFavoriteButtonVisual(coinId); 
    }
}

async function handleRemoveFavoriteFromListPage(coinId) {
    const result = await apiRequest(`/crypto/favorites/${coinId}`, "DELETE");
    if (result) {
        displayMessage(result.message, "success", "message-area");
        await renderFavoritesPage(); 
        await refreshCoinListDropdown(); 
    }
}

// Funções auxiliares
async function loadFavorites() {
    if (!currentUser || !currentUser.token) return;
    const favData = await apiRequest("/crypto/favorites");
    if (favData) {
        favorites = favData;
    }
}

async function refreshCoinListDropdown() {
    const coinSelect = document.getElementById("coinSelect");
    if (!coinSelect) return;

    const currentSelectedCoin = coinSelect.value;
    if (coinsList.length === 0) {
        const fetchedCoins = await apiRequest("/crypto/coins_list");
        if (fetchedCoins) {
            coinsList = fetchedCoins.sort((a, b) => a.name.localeCompare(b.name));
        }
    }
    
    const options = coinsList.map(coin => {
        const isFavorite = favorites.some(fav => fav.coin_id === coin.id);
        return `<option value="${coin.id}" ${coin.id === currentSelectedCoin ? 'selected' : ''}>${coin.name} (${coin.symbol.toUpperCase()}) ${isFavorite ? "★" : "☆"}</option>`;
    }).join("");

    coinSelect.innerHTML = `<option value="">Selecione uma Criptomoeda</option>${options}`;
    updateFavoriteButtonVisual(currentSelectedCoin);
}

function displayMessage(message, type = "info", containerId = "message-area") {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<p class="${type}-message">${message}</p>`;
        setTimeout(() => { container.innerHTML = ""; }, 5000); 
    }
}

function setActiveNav(pageId) {
    const navButtons = document.querySelectorAll("nav button");
    navButtons.forEach(button => {
        button.classList.remove("active");
        if (button.id === `nav-${pageId}`) {
            button.classList.add("active");
        }
    });
}

async function checkLoginStatus() {
    const token = getToken();
    if (token) {
        // Tentar obter o status do usuário com o token existente
        const status = await apiRequest("/auth/status"); // apiRequest já inclui o token
        if (status && status.logged_in) {
            currentUser = { username: status.username, token: token, id: status.id };
            await loadFavorites();
            renderMainPage();
        } else {
            setToken(null); // Token inválido ou expirado
            currentUser = null;
            renderLoginPage("Sua sessão expirou. Por favor, faça login novamente.");
        }
    } else {
        currentUser = null;
        renderLoginPage();
    }
}

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", checkLoginStatus);

