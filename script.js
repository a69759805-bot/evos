document.addEventListener("DOMContentLoaded", function () {
    const menuKey = "evosAdminMenu";
    const analyticsKey = "evosLocalAnalytics";
    const categories = [
        { id: "chizzi", name: "Chizzi Chizz", icon: "🧀" },
        { id: "lavash", name: "Lavash", icon: "🌯" },
        { id: "shaurma", name: "Shaurma", icon: "🥙" },
        { id: "burger", name: "Burger", icon: "🍔" },
        { id: "xot-dog", name: "Xot Dog", icon: "🌭" },
        { id: "salatlar", name: "Salatlar", icon: "🥗" },
        { id: "ichimliklar", name: "Ichimliklar", icon: "🥤" }
    ];
    const foodImages = {
        chizzi: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop",
        lavash: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop",
        shaurma: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop",
        burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop",
        "xot-dog": "https://images.unsplash.com/photo-1612392062798-2dbaa9e5e9f2?w=600&auto=format&fit=crop",
        salatlar: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop",
        ichimliklar: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop"
    };
    const starterMenu = [
        ["Chizzi mol go'shtli combo", "chizzi", 82000], ["Chizzi tovuqli combo", "chizzi", 76000],
        ["Chizzi burger", "chizzi", 49000], ["Chizzi lavash", "chizzi", 45000],
        ["Macho lavash", "lavash", 63000], ["Mol go'shtli pishloqli lavash L", "lavash", 45000],
        ["Mol go'shtli lavash L", "lavash", 42000], ["Qalampirli lavash", "lavash", 42000],
        ["Tovuq go'shtli pishloqli lavash", "lavash", 40000], ["Lavashello", "lavash", 37000],
        ["Mol go'shtli shaurma", "shaurma", 39000], ["Tovuqli shaurma", "shaurma", 35000],
        ["Pishloqli shaurma", "shaurma", 42000], ["Achchiq shaurma", "shaurma", 39000],
        ["Chizburger", "burger", 30000], ["Dablburger", "burger", 41000],
        ["Gamburger", "burger", 28000], ["Chicken burger", "burger", 32000],
        ["Sub mol go'shtidan", "xot-dog", 27000], ["Klassik xot-dog", "xot-dog", 22000],
        ["Sezar salat", "salatlar", 33000], ["Grek salati", "salatlar", 29000],
        ["Coca-Cola 0.5L", "ichimliklar", 12000], ["Ice Tea 0.5L", "ichimliklar", 11000],
        ["Suv 0.5L", "ichimliklar", 5000], ["Kartoshka fri", "burger", 18000]
    ].map(function (item, index) {
        return {
            id: "seed-" + index,
            name: item[0],
            category: item[1],
            price: item[2],
            image: foodImages[item[1]],
            description: "Yangi masalliqlardan tayyorlangan mazali " + item[0] + "."
        };
    });

    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            console.error("Saqlangan ma'lumotni o'qib bo'lmadi:", error);
            return fallback;
        }
    }

    function saveStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Ma'lumotni brauzerda saqlab bo'lmadi:", error);
            showToast("Saqlash imkoni bo'lmadi. Brauzer xotirasini tekshiring.");
            return false;
        }
    }

    let menu = readStorage(menuKey, starterMenu);
    if (!Array.isArray(menu)) {
        menu = starterMenu;
    }

    async function loadMenuFromDatabase() {
        try {
            const response = await fetch("./api.php/products");
            if (!response.ok) throw new Error("Database API response failed");
            const data = await response.json();
            if (Array.isArray(data.products)) {
                menu = data.products;
                saveStorage(menuKey, menu);
                renderMenu();
                if (typeof updateDashboard === "function") {
                    updateDashboard();
                }
                if (document.getElementById("adminMenuList")) {
                    renderAdminMenu();
                }
            }
        } catch (error) {
            console.error("Bazadan menyuni yuklab bo'lmadi:", error);
        }
    }
    loadMenuFromDatabase();

    let analytics = readStorage(analyticsKey, { visits: 0, exits: 0, orderClicks: 0 });
    if (!analytics || typeof analytics.visits !== "number") {
        analytics = { visits: 0, exits: 0, orderClicks: 0 };
    }
    analytics.visits += 1;
    saveStorage(analyticsKey, analytics);
    let exitRecorded = false;
    window.addEventListener("pagehide", function () {
        if (exitRecorded) return;
        exitRecorded = true;
        analytics.exits += 1;
        saveStorage(analyticsKey, analytics);
    });

    function formatPrice(price) {
        return Number(price).toLocaleString("uz-UZ") + " so'm";
    }

    function showToast(message) {
        let toast = document.querySelector(".site-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "site-toast";
            toast.setAttribute("role", "status");
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("visible");
        window.clearTimeout(showToast.timeout);
        showToast.timeout = window.setTimeout(function () {
            toast.classList.remove("visible");
        }, 2800);
    }

    function renderMenu() {
        const nav = document.querySelector(".category-list");
        const area = document.querySelector(".products-area");
        nav.innerHTML = "";
        area.innerHTML = "";
        categories.forEach(function (category, index) {
            const link = document.createElement("a");
            link.href = "#" + category.id;
            link.className = "category-item" + (index === 0 ? " active" : "");
            link.innerHTML = '<span class="cat-icon"></span><span class="cat-name"></span>';
            link.querySelector(".cat-icon").textContent = category.icon;
            link.querySelector(".cat-name").textContent = category.name;
            nav.appendChild(link);

            const section = document.createElement("section");
            section.id = category.id;
            section.className = "menu-section";
            section.innerHTML = '<div class="category-header"><span class="header-icon"></span><h2></h2></div><div class="products-grid"></div>';
            section.querySelector(".header-icon").textContent = category.icon;
            section.querySelector("h2").textContent = category.name;
            area.appendChild(section);
        });

        menu.forEach(function (product) {
            const category = categories.find(function (item) { return item.id === product.category; });
            const grid = document.querySelector("#" + (category ? category.id : categories[0].id) + " .products-grid");
            const card = document.createElement("article");
            card.className = "product-card";
            const imageWrap = document.createElement("div");
            imageWrap.className = "product-img";
            const image = document.createElement("img");
            image.src = product.image || foodImages[product.category] || foodImages.lavash;
            image.alt = product.name;
            image.loading = "lazy";
            image.onerror = function () { image.src = foodImages.lavash; };
            imageWrap.appendChild(image);
            const title = document.createElement("h3");
            title.className = "product-title";
            title.textContent = product.name;
            const description = document.createElement("p");
            description.className = "product-description";
            description.textContent = product.description || "";
            const bottom = document.createElement("div");
            bottom.className = "product-bottom";
            const price = document.createElement("p");
            price.className = "product-price";
            price.textContent = formatPrice(product.price);
            const addButton = document.createElement("button");
            addButton.className = "add-to-cart-btn";
            addButton.type = "button";
            addButton.textContent = "Savatga";
            bottom.append(price, addButton);
            card.append(imageWrap, title, description, bottom);
            grid.appendChild(card);
        });

        document.querySelectorAll(".category-item").forEach(function (link) {
            link.addEventListener("click", function () {
                document.querySelectorAll(".category-item").forEach(function (item) { item.classList.remove("active"); });
                link.classList.add("active");
            });
        });
    }

    renderMenu();

    const searchBtn = document.getElementById("searchBtn");
    const searchContainer = document.getElementById("searchContainer");
    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");
    const closeSearch = document.getElementById("closeSearch");
    if (searchBtn && searchContainer && searchInput && searchResults) {
        searchBtn.addEventListener("click", function () {
            searchContainer.classList.add("active");
            searchInput.focus();
        });
        if (closeSearch) {
            closeSearch.addEventListener("click", function () {
                searchContainer.classList.remove("active");
                searchInput.value = "";
                searchResults.innerHTML = "";
                searchResults.classList.remove("show");
            });
        }
        searchInput.addEventListener("input", function () {
            const query = searchInput.value.trim().toLocaleLowerCase();
            searchResults.innerHTML = "";
            if (!query) {
                searchResults.classList.remove("show");
                return;
            }
            const matches = Array.from(document.querySelectorAll(".product-card")).filter(function (card) {
                return card.querySelector(".product-title").textContent.toLocaleLowerCase().includes(query);
            });
            matches.forEach(function (card) {
                const result = document.createElement("button");
                result.type = "button";
                result.className = "result-item";
                result.innerHTML = '<span class="result-info"><span class="result-name"></span><span class="result-price"></span></span>';
                result.querySelector(".result-name").textContent = card.querySelector(".product-title").textContent;
                result.querySelector(".result-price").textContent = card.querySelector(".product-price").textContent;
                result.addEventListener("click", function () {
                    searchContainer.classList.remove("active");
                    card.scrollIntoView({ behavior: "smooth", block: "center" });
                });
                searchResults.appendChild(result);
            });
            if (!matches.length) {
                const empty = document.createElement("div");
                empty.className = "no-results";
                empty.textContent = "Mahsulot topilmadi";
                searchResults.appendChild(empty);
            }
            searchResults.classList.add("show");
        });
    }

    document.addEventListener("click", function (event) {
        const addButton = event.target.closest(".add-to-cart-btn");
        if (!addButton) return;
        analytics.orderClicks = (analytics.orderClicks || 0) + 1;
        saveStorage(analyticsKey, analytics);
        showToast("Mahsulot savatga qo'shildi");
    });

    const adminMarkup = `
        <div class="admin-backdrop" id="adminBackdrop">
            <section class="admin-panel" role="dialog" aria-modal="true" aria-labelledby="adminTitle">
                <div class="admin-auth" id="adminAuth">
                    <div class="auth-card">
                        <span class="auth-mark">E</span>
                        <p class="admin-eyebrow">HIMOYALANGAN KIRISH</p>
                        <h2>Admin panelga kirish</h2>
                        <p class="auth-description">Davom etish uchun login va parolni kiriting.</p>
                        <form id="adminLoginForm">
                            <label>Login<input name="username" autocomplete="username" required></label>
                            <label>Parol<input name="password" type="password" autocomplete="current-password" required></label>
                            <p class="admin-auth-error" id="adminAuthError" aria-live="polite"></p>
                            <button class="primary-admin-btn" type="submit">Kirish</button>
                        </form>
                        <small class="auth-security-note">Eslatma: bu statik demo kirishi; haqiqiy himoya uchun serverda autentifikatsiya kerak.</small>
                    </div>
                </div>
                <header class="admin-header">
                    <div><span class="admin-eyebrow">EVOS BOSHQARUV</span><h2 id="adminTitle">Admin panel</h2></div>
                    <button class="admin-close" type="button" aria-label="Yopish">&times;</button>
                </header>
                <div class="admin-notice">Statistika faqat shu brauzerda yig'iladi. Haqiqiy ko'p foydalanuvchili hisob uchun server/analytics ulash kerak.</div>
                <nav class="admin-tabs" aria-label="Admin bo'limlari">
                    <button type="button" class="admin-tab active" data-tab="overview">Umumiy</button>
                    <button type="button" class="admin-tab" data-tab="menu">Menyu boshqaruvi</button>
                </nav>
                <div class="admin-content">
                    <div class="admin-view" data-view="overview">
                        <div class="admin-welcome"><div><p class="admin-eyebrow">BUGUNGI HOLAT</p><h3>Biznes ko'rsatkichlari</h3></div><span class="live-pill">● Jonli</span></div>
                        <div class="stats-grid">
                            <article class="stat-card"><span>Saytga kirishlar</span><strong id="statVisits">0</strong><small>Ushbu brauzerda qayd etilgan</small></article>
                            <article class="stat-card"><span>Chiqishlar</span><strong id="statExits">0</strong><small id="statExitRate">0% kirishlardan</small></article>
                            <article class="stat-card"><span>Buyurtma bosishlari</span><strong id="statOrders">0</strong><small id="statOrderRate">0% kirishlardan</small></article>
                            <article class="stat-card"><span>Menyudagi taomlar</span><strong id="statProducts">0</strong><small>Faol katalog mahsulotlari</small></article>
                        </div>
                        <div class="analytics-card"><div class="analytics-heading"><div><h3>Tashriflar tahlili</h3><p>Kirish va chiqishlar taqqoslanishi</p></div><span class="analytics-range">Jami</span></div>
                            <div class="bar-row"><span>Kirishlar</span><div class="bar-track"><i id="visitBar"></i></div><b id="visitPercent">0%</b></div>
                            <div class="bar-row"><span>Chiqishlar</span><div class="bar-track exit-track"><i id="exitBar"></i></div><b id="exitPercent">0%</b></div>
                            <p class="analytics-footnote">Chiqishlar — sahifa yopilganda yoki yangilanganda qayd etiladigan brauzer hodisalari.</p>
                        </div>
                    </div>
                    <div class="admin-view" data-view="menu" hidden>
                        <div class="admin-welcome"><div><p class="admin-eyebrow">KATALOG</p><h3>Mahsulotlarni boshqarish</h3></div><button class="primary-admin-btn" id="newProductBtn" type="button">＋ Mahsulot qo'shish</button></div>
                        <div class="menu-toolbar"><input id="adminSearch" type="search" placeholder="Taom qidirish..."><span id="menuCount"></span></div>
                        <div class="admin-menu-list" id="adminMenuList"></div>
                    </div>
                </div>
            </section>
        </div>
        <div class="admin-form-backdrop" id="productFormBackdrop" hidden>
            <form class="admin-form" id="productForm" aria-labelledby="productFormTitle">
                <div class="form-heading"><div><p class="admin-eyebrow">KATALOG</p><h3 id="productFormTitle">Yangi taom</h3></div><button class="form-close" type="button" aria-label="Yopish">&times;</button></div>
                <label>Taom nomi<input name="name" required maxlength="70" placeholder="Masalan, Mol go'shtli lavash"></label>
                <div class="form-row"><label>Kategoriya<select name="category" required></select></label><label>Narxi (so'm)<input name="price" type="number" min="1000" step="1000" required placeholder="45000"></label></div>
                <label>Mahsulot rasmi (havola)<input name="image" type="url" id="productImage" placeholder="https://..."></label>
                <div class="product-image-preview"><img id="productImagePreview" alt="Mahsulot rasmi ko'rinishi"><span>Rasm ko'rinishi</span></div>
                <label>Ta'rif<textarea name="description" rows="3" maxlength="180" placeholder="Taom tarkibi va qisqa ma'lumot"></textarea></label>
                <div class="form-actions"><button class="secondary-admin-btn" type="button" id="cancelProduct">Bekor qilish</button><button class="primary-admin-btn" type="submit">Saqlash</button></div>
            </form>
        </div>`;
    document.body.insertAdjacentHTML("beforeend", adminMarkup);

    const adminBackdrop = document.getElementById("adminBackdrop");
    const productFormBackdrop = document.getElementById("productFormBackdrop");
    const productForm = document.getElementById("productForm");
    const adminAuth = document.getElementById("adminAuth");
    let isAdminAuthenticated = false;
    const categorySelect = productForm.elements.category;
    categories.forEach(function (category) {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });

    function updateDashboard() {
        const visits = Math.max(analytics.visits || 0, 0);
        const exits = Math.max(analytics.exits || 0, 0);
        const orders = Math.max(analytics.orderClicks || 0, 0);
        const exitRate = visits ? Math.min(100, Math.round(exits / visits * 100)) : 0;
        const orderRate = visits ? Math.round(orders / visits * 100) : 0;
        document.getElementById("statVisits").textContent = visits.toLocaleString("uz-UZ");
        document.getElementById("statExits").textContent = exits.toLocaleString("uz-UZ");
        document.getElementById("statOrders").textContent = orders.toLocaleString("uz-UZ");
        document.getElementById("statProducts").textContent = menu.length.toLocaleString("uz-UZ");
        document.getElementById("statExitRate").textContent = exitRate + "% kirishlardan";
        document.getElementById("statOrderRate").textContent = orderRate + "% kirishlardan";
        document.getElementById("visitPercent").textContent = (visits ? 100 : 0) + "%";
        document.getElementById("exitPercent").textContent = exitRate + "%";
        document.getElementById("visitBar").style.width = (visits ? 100 : 0) + "%";
        document.getElementById("exitBar").style.width = exitRate + "%";
    }

    function renderAdminMenu() {
        const query = document.getElementById("adminSearch").value.trim().toLocaleLowerCase();
        const list = document.getElementById("adminMenuList");
        list.innerHTML = "";
        const filtered = menu.filter(function (product) {
            return product.name.toLocaleLowerCase().includes(query);
        });
        document.getElementById("menuCount").textContent = menu.length + " ta taom";
        if (!filtered.length) {
            const empty = document.createElement("p");
            empty.className = "admin-empty";
            empty.textContent = "Taom topilmadi.";
            list.appendChild(empty);
            return;
        }
        filtered.forEach(function (product) {
            const row = document.createElement("article");
            row.className = "admin-menu-row";
            const image = document.createElement("img");
            image.src = product.image || foodImages[product.category] || foodImages.lavash;
            image.alt = "";
            image.onerror = function () { image.src = foodImages.lavash; };
            const details = document.createElement("div");
            details.className = "admin-menu-details";
            const title = document.createElement("strong");
            title.textContent = product.name;
            const category = categories.find(function (item) { return item.id === product.category; });
            const meta = document.createElement("span");
            meta.textContent = (category ? category.name : "Menyu") + " · " + formatPrice(product.price);
            details.append(title, meta);
            const actions = document.createElement("div");
            actions.className = "row-actions";
            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "edit-product";
            edit.textContent = "Tahrirlash";
            edit.dataset.productId = product.id;
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "delete-product";
            remove.textContent = "O'chirish";
            remove.dataset.productId = product.id;
            actions.append(edit, remove);
            row.append(image, details, actions);
            list.appendChild(row);
        });
    }

    function closeProductForm() {
        productFormBackdrop.hidden = true;
        productForm.reset();
        updateProductImagePreview("");
        delete productForm.dataset.editingId;
        document.getElementById("productFormTitle").textContent = "Yangi taom";
    }

    function openProductForm(product) {
        productForm.reset();
        updateProductImagePreview("");
        if (product) {
            productForm.elements.name.value = product.name;
            productForm.elements.category.value = product.category;
            productForm.elements.price.value = product.price;
            productForm.elements.image.value = product.image || "";
            productForm.elements.description.value = product.description || "";
            updateProductImagePreview(product.image || "");
            productForm.dataset.editingId = product.id;
            document.getElementById("productFormTitle").textContent = "Taomni tahrirlash";
        } else {
            delete productForm.dataset.editingId;
            document.getElementById("productFormTitle").textContent = "Yangi taom";
        }
        productFormBackdrop.hidden = false;
        productForm.elements.name.focus();
    }

    document.getElementById("adminOpenBtn").addEventListener("click", function () {
        adminBackdrop.classList.add("open");
        document.body.classList.add("admin-open");
        adminAuth.hidden = isAdminAuthenticated;
        if (isAdminAuthenticated) {
            updateDashboard();
            renderAdminMenu();
        } else {
            document.querySelector('#adminLoginForm [name="username"]').focus();
        }
    });
    document.getElementById("adminLoginForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const username = String(values.get("username")).trim();
        const password = String(values.get("password"));
        if (username === "ABDULLOH" && password === "ABDULLOH") {
            isAdminAuthenticated = true;
            adminAuth.hidden = true;
            document.getElementById("adminAuthError").textContent = "";
            updateDashboard();
            renderAdminMenu();
            return;
        }
        document.getElementById("adminAuthError").textContent = "Login yoki parol noto'g'ri.";
    });
    function closeAdmin() {
        adminBackdrop.classList.remove("open");
        document.body.classList.remove("admin-open");
        closeProductForm();
    }
    adminBackdrop.querySelector(".admin-close").addEventListener("click", closeAdmin);
    adminBackdrop.addEventListener("click", function (event) {
        if (event.target === adminBackdrop) closeAdmin();
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeAdmin();
            searchContainer && searchContainer.classList.remove("active");
        }
    });
    document.querySelectorAll(".admin-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".admin-tab").forEach(function (item) { item.classList.toggle("active", item === tab); });
            document.querySelectorAll(".admin-view").forEach(function (view) { view.hidden = view.dataset.view !== tab.dataset.tab; });
        });
    });
    document.getElementById("newProductBtn").addEventListener("click", function () { openProductForm(); });
    function updateProductImagePreview(url) {
        const preview = document.getElementById("productImagePreview");
        if (!preview) return;
        const fallback = foodImages[productForm.elements.category.value] || foodImages.lavash;
        preview.src = url || fallback;
        preview.onerror = function () { preview.src = fallback; };
    }
    document.getElementById("productImage").addEventListener("input", function (event) {
        updateProductImagePreview(event.currentTarget.value.trim());
    });
    productForm.elements.category.addEventListener("change", function () {
        if (!productForm.elements.image.value.trim()) {
            updateProductImagePreview("");
        }
    });
    document.getElementById("adminSearch").addEventListener("input", renderAdminMenu);
    document.getElementById("cancelProduct").addEventListener("click", closeProductForm);
    productFormBackdrop.querySelector(".form-close").addEventListener("click", closeProductForm);
    productFormBackdrop.addEventListener("click", function (event) {
        if (event.target === productFormBackdrop) closeProductForm();
    });
    document.getElementById("adminMenuList").addEventListener("click", function (event) {
        const editButton = event.target.closest(".edit-product");
        const deleteButton = event.target.closest(".delete-product");
        if (editButton) {
            const product = menu.find(function (item) { return item.id === editButton.dataset.productId; });
            if (product) openProductForm(product);
        }
        if (deleteButton) {
            const product = menu.find(function (item) { return item.id === deleteButton.dataset.productId; });
            if (product && window.confirm('"' + product.name + '" taomini o\'chirishni xohlaysizmi?')) {
                fetch("./api.php/products/" + encodeURIComponent(product.id), { method: "DELETE" })
                    .then(function (response) {
                        if (!response.ok) throw new Error("Mahsulotni o'chirib bo'lmadi");
                        menu = menu.filter(function (item) { return item.id !== product.id; });
                        if (saveStorage(menuKey, menu)) {
                            renderMenu();
                            renderAdminMenu();
                            updateDashboard();
                            showToast("Taom bazadan o'chirildi");
                        }
                    })
                    .catch(function (error) {
                        console.error(error);
                        showToast("Bazaga ulanishda xatolik yuz berdi");
                    });
            }
        }
    });
    productForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const formData = new FormData(productForm);
        const product = {
            id: productForm.dataset.editingId || "item-" + Date.now(),
            name: formData.get("name").trim(),
            category: formData.get("category"),
            price: Number(formData.get("price")),
            image: formData.get("image").trim() || foodImages[formData.get("category")],
            description: formData.get("description").trim() || "Yangi tayyorlangan mazali taom."
        };
        if (!product.name || !Number.isFinite(product.price) || product.price <= 0) {
            showToast("Taom nomi va narxini to'g'ri kiriting.");
            return;
        }
        const editing = Boolean(productForm.dataset.editingId);
        const url = editing
            ? "./api.php/products/" + encodeURIComponent(product.id)
            : "./api.php/products";

        fetch(url, {
            method: editing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        })
            .then(function (response) {
                if (!response.ok) throw new Error("Mahsulotni saqlab bo'lmadi");
                return response.json();
            })
            .then(function (data) {
                if (!editing && data.id) product.id = data.id;
                if (editing) {
                    menu = menu.map(function (item) { return item.id === product.id ? product : item; });
                } else {
                    menu.unshift(product);
                }
                if (saveStorage(menuKey, menu)) {
                    renderMenu();
                    renderAdminMenu();
                    updateDashboard();
                    closeProductForm();
                    showToast(editing ? "Taom ma'lumotlari yangilandi" : "Yangi taom bazaga qo'shildi");
                }
            })
            .catch(function (error) {
                console.error(error);
                showToast("Bazaga ulanishda xatolik yuz berdi");
            });
    });
});
