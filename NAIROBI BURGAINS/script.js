
/* =====================================================
   CLADYTAGS STORE — Supabase-powered storefront
   Product gallery: multiple photos, arrows and touch swipe
   ===================================================== */

let products = [];
let cart = [];
let currentCollectionView = null;
let currentProductSlideImages = [];
let currentProductSlideIndex = 0;

const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const overlay = document.getElementById("overlay");
const searchBtn = document.getElementById("searchBtn");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");
const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");
const closeNotifications = document.getElementById("closeNotifications");
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const productModal = document.getElementById("productModal");
const productModalBody = document.getElementById("productModalBody");
const closeProductModal = document.getElementById("closeProductModal");
const checkoutBtn = document.getElementById("checkoutBtn");

document.addEventListener("DOMContentLoaded", async () => {
    await loadCustomerPromotion();
    await loadProducts();
    updateCart();
    setupStoreEvents();
});

/* -------------------- Products -------------------- */
async function loadProducts() {
    if (!window.supabaseClient) {
        console.error("Supabase client not available.");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from("products")
            .select("*")
            .eq("available", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        products = data || [];
        window.products = products;

        console.log(`Cladytags: ${products.length} products loaded.`);
        renderProducts();
    } catch (error) {
        console.error("Product loading error:", error);
    }
}

function getProductImages(product) {
    let images = product?.image_urls ?? [];

    if (typeof images === "string") {
        try {
            images = JSON.parse(images);
        } catch {
            images = images.trim() ? [images] : [];
        }
    }

    if (!Array.isArray(images)) {
        images = images ? [images] : [];
    }

    images = images.filter(
        value => typeof value === "string" && value.trim()
    );

    if (!images.length && product?.image_url) {
        images = [product.image_url];
    }

    return [...new Set(images)];
}

function getProductImage(product) {
    return getProductImages(product)[0] || "assets/cladytags-logo.png";
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-KE");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderProducts() {
    const thriftedContainer = document.getElementById("thriftedProducts");
    const newContainer = document.getElementById("newProducts");

    if (!thriftedContainer || !newContainer) return;

    renderProductGroup(
        thriftedContainer,
        products.filter(p => p.collection === "thrifted"),
        "No thrifted items available yet."
    );

    renderProductGroup(
        newContainer,
        products.filter(p => p.collection === "new"),
        "No new items available yet."
    );
}

function renderProductGroup(container, productList, emptyMessage) {
    container.innerHTML = "";

    if (!productList.length) {
        container.innerHTML = `
            <div class="empty-products">
                <h3>${escapeHtml(emptyMessage)}</h3>
                <p>New products will appear here when they are posted.</p>
            </div>`;
        return;
    }

    productList.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = getProductImage(product);
    const collectionLabel =
        product.collection === "thrifted" ? "THRIFTED" : "NEW";
    const gender = product.gender
        ? String(product.gender).toUpperCase()
        : "";
    const category = product.category
        ? String(product.category).toUpperCase()
        : "";
    const imageCount = getProductImages(product).length;

    card.innerHTML = `
        <div class="product-image">
            <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(product.name)}"
                loading="lazy"
            >
            <span class="product-badge">${collectionLabel}</span>
            ${imageCount > 1
                ? `<span class="product-photo-count">${imageCount} photos</span>`
                : ""}
        </div>

        <div class="product-info">
            <div class="product-category">
                ${escapeHtml(gender)}${gender && category ? " • " : ""}
                ${escapeHtml(category)}
            </div>

            <h3 class="product-name">${escapeHtml(product.name)}</h3>

            <div class="product-price">
                KSh ${formatPrice(product.price)}
            </div>

            ${product.size
                ? `<div class="product-size">Size: ${escapeHtml(product.size)}</div>`
                : ""}

            <div class="product-actions">
                <button
                    class="add-cart-btn"
                    type="button"
                    onclick="addToCart('${String(product.id)}')"
                >Add to Cart</button>

                <button
                    class="view-product-btn"
                    type="button"
                    onclick="showProduct('${String(product.id)}')"
                >View</button>
            </div>
        </div>`;

    return card;
}

/* -------------------- Product modal gallery -------------------- */
function showProduct(productId) {
    const product = productId && typeof productId === "object"
        ? productId
        : products.find(item => String(item.id) === String(productId));

    if (!product || !productModalBody || !productModal) return;

    currentProductSlideImages = getProductImages(product);
    currentProductSlideIndex = 0;

    const firstImage =
        currentProductSlideImages[0] || "assets/cladytags-logo.png";

    const hasMany = currentProductSlideImages.length > 1;

    const dots = hasMany
        ? currentProductSlideImages.map((_, index) => `
            <button
                type="button"
                class="product-gallery-dot ${index === 0 ? "active" : ""}"
                aria-label="Show photo ${index + 1}"
                onclick="goToProductSlide(${index})"
            ></button>
        `).join("")
        : "";

    productModalBody.innerHTML = `
        <div class="product-modal-grid">
            <div
                class="modal-image-wrapper product-gallery"
                id="productGallery"
            >
                <img
                    id="productGalleryImage"
                    src="${escapeHtml(firstImage)}"
                    alt="${escapeHtml(product.name)}"
                    class="modal-product-image"
                >

                ${hasMany ? `
                    <button
                        type="button"
                        class="product-gallery-arrow product-gallery-prev"
                        aria-label="Previous photo"
                        onclick="changeProductSlide(-1)"
                    >&#10094;</button>

                    <button
                        type="button"
                        class="product-gallery-arrow product-gallery-next"
                        aria-label="Next photo"
                        onclick="changeProductSlide(1)"
                    >&#10095;</button>

                    <div
                        class="product-gallery-counter"
                        id="productGalleryCounter"
                    >1 / ${currentProductSlideImages.length}</div>

                    <div
                        class="product-gallery-dots"
                        id="productGalleryDots"
                    >${dots}</div>
                ` : ""}
            </div>

            <div class="modal-product-info">
                <div class="product-category">
                    ${product.collection === "thrifted" ? "THRIFTED" : "NEW"}
                    ${product.gender
                        ? " • " + escapeHtml(String(product.gender).toUpperCase())
                        : ""}
                </div>

                <h2>${escapeHtml(product.name)}</h2>

                <div class="modal-product-price">
                    KSh ${formatPrice(product.price)}
                </div>

                ${product.size
                    ? `<p><strong>Size:</strong> ${escapeHtml(product.size)}</p>`
                    : ""}

                ${product.description
                    ? `<p class="modal-product-description">${escapeHtml(product.description)}</p>`
                    : ""}

                ${hasMany
                    ? `<p class="product-gallery-hint">Swipe or use the arrows to view all ${currentProductSlideImages.length} photos.</p>`
                    : ""}

                <button
                    class="modal-add-btn"
                    type="button"
                    onclick="addToCart('${String(product.id)}'); closeProduct();"
                >Add to Cart</button>
            </div>
        </div>`;

    productModal.classList.add("open");

    const gallery = document.getElementById("productGallery");

    if (gallery && hasMany) {
        let startX = 0;
        let startY = 0;

        gallery.addEventListener("touchstart", event => {
            if (!event.changedTouches.length) return;

            startX = event.changedTouches[0].clientX;
            startY = event.changedTouches[0].clientY;
        }, { passive: true });

        gallery.addEventListener("touchend", event => {
            if (!event.changedTouches.length) return;

            const dx = event.changedTouches[0].clientX - startX;
            const dy = event.changedTouches[0].clientY - startY;

            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                changeProductSlide(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
    }
}

function changeProductSlide(direction) {
    const length = currentProductSlideImages.length;
    if (length < 2) return;

    currentProductSlideIndex =
        (currentProductSlideIndex + direction + length) % length;

    updateProductGallery();
}

function goToProductSlide(index) {
    if (index < 0 || index >= currentProductSlideImages.length) return;

    currentProductSlideIndex = index;
    updateProductGallery();
}

function updateProductGallery() {
    const image = document.getElementById("productGalleryImage");
    const counter = document.getElementById("productGalleryCounter");

    if (image) {
        image.src = currentProductSlideImages[currentProductSlideIndex];
    }

    if (counter) {
        counter.textContent =
            `${currentProductSlideIndex + 1} / ${currentProductSlideImages.length}`;
    }

    document.querySelectorAll(".product-gallery-dot").forEach((dot, index) => {
        dot.classList.toggle("active", index === currentProductSlideIndex);
    });
}

function closeProduct() {
    if (productModal) productModal.classList.remove("open");
}

/* -------------------- Cart -------------------- */
function addToCart(productId) {
    const product = products.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return;

    const existing = cart.find(
        item => String(item.id) === String(productId)
    );

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    openCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => String(item.id) !== String(productId));
    updateCart();
}

function changeQuantity(productId, change) {
    const item = cart.find(
        product => String(product.id) === String(productId)
    );

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCart();
    }
}

function updateCart() {
    const totalItems = cart.reduce(
        (total, item) => total + item.quantity, 0
    );

    const totalPrice = cart.reduce(
        (total, item) => total + Number(item.price || 0) * item.quantity, 0
    );

    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `KSh ${formatPrice(totalPrice)}`;

    renderCart();
}

function renderCart() {
    if (!cartItems) return;

    if (!cart.length) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <span>🛒</span>
                <h3>Your cart is empty</h3>
                <p>Add something you love.</p>
            </div>`;
        return;
    }

    cartItems.innerHTML = "";

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";

        row.innerHTML = `
            <img
                src="${escapeHtml(getProductImage(item))}"
                alt="${escapeHtml(item.name)}"
                class="cart-item-image"
            >

            <div class="cart-item-info">
                <h4>${escapeHtml(item.name)}</h4>
                <p>KSh ${formatPrice(item.price)}</p>

                <div class="quantity-controls">
                    <button
                        type="button"
                        aria-label="Decrease quantity"
                        onclick="changeQuantity('${String(item.id)}', -1)"
                    >−</button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        aria-label="Increase quantity"
                        onclick="changeQuantity('${String(item.id)}', 1)"
                    >+</button>
                </div>

                <button
                    type="button"
                    class="remove-cart-item"
                    onclick="removeFromCart('${String(item.id)}')"
                >Remove</button>
            </div>`;

        cartItems.appendChild(row);
    });
}

function openCart() {
    if (cartSidebar) cartSidebar.classList.add("open");
    if (overlay) overlay.classList.add("show");
}

function closeCartSidebar() {
    if (cartSidebar) cartSidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("show");
}

/* -------------------- Collection browsing -------------------- */
function viewCollection(collection) {
    currentCollectionView = collection;

    const list = products.filter(
        product => product.collection === collection
    );

    showCollectionResults(
        list,
        collection === "thrifted" ? "All Thrifted Finds" : "All New Collection"
    );
}

function showCollectionResults(productList, title) {
    const thriftedSection = document.getElementById("thrifted");
    const newSection = document.getElementById("new");

    if (!thriftedSection || !newSection) return;

    thriftedSection.style.display = "none";
    newSection.style.display = "none";

    document.getElementById("fullCollectionView")?.remove();

    const view = document.createElement("section");
    view.id = "fullCollectionView";
    view.className = "full-collection-view";

    view.innerHTML = `
        <div class="full-collection-header">
            <button type="button" class="back-to-store-btn" id="backToStoreBtn">
                ← Back to Store
            </button>

            <div class="section-heading">
                <span>${currentCollectionView === "thrifted" ? "ONE-OF-A-KIND" : "FRESH ARRIVALS"}</span>
                <h2>${escapeHtml(title)}</h2>
            </div>
        </div>

        <div class="collection-search-wrapper">
            <input
                type="search"
                id="collectionSearchInput"
                class="collection-search-input"
                placeholder="Search ${currentCollectionView === "thrifted" ? "thrifted items" : "new collection"}..."
                autocomplete="off"
            >
        </div>

        <div class="collection-result-count" id="collectionResultCount"></div>
        <div class="product-grid full-collection-grid" id="fullCollectionProducts"></div>`;

    const footer = document.querySelector("footer");

    if (footer?.parentNode) {
        footer.parentNode.insertBefore(view, footer);
    } else {
        document.body.appendChild(view);
    }

    renderFullCollectionProducts(
        document.getElementById("fullCollectionProducts"),
        productList
    );

    document.getElementById("backToStoreBtn")
        ?.addEventListener("click", closeCollectionView);

    document.getElementById("collectionSearchInput")
        ?.addEventListener("input", event => searchFullCollection(event.target.value));

    view.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderFullCollectionProducts(container, productList) {
    if (!container) return;

    container.innerHTML = "";

    const count = document.getElementById("collectionResultCount");

    if (count) {
        count.textContent = `${productList.length} ${productList.length === 1 ? "item" : "items"}`;
    }

    if (!productList.length) {
        container.innerHTML = `
            <div class="empty-products">
                <h3>No products available</h3>
                <p>Check back soon for new arrivals.</p>
            </div>`;
        return;
    }

    productList.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

function searchFullCollection(searchTerm) {
    const term = String(searchTerm || "").trim().toLowerCase();

    let results = products.filter(
        product => product.collection === currentCollectionView
    );

    if (term) {
        results = results.filter(product =>
            [
                product.name,
                product.category,
                product.gender,
                product.activity_type,
                product.description,
                product.size
            ].some(value =>
                String(value || "").toLowerCase().includes(term)
            )
        );
    }

    renderFullCollectionProducts(
        document.getElementById("fullCollectionProducts"),
        results
    );
}

function closeCollectionView() {
    document.getElementById("fullCollectionView")?.remove();

    const thriftedSection = document.getElementById("thrifted");
    const newSection = document.getElementById("new");

    if (thriftedSection) thriftedSection.style.display = "";
    if (newSection) newSection.style.display = "";

    currentCollectionView = null;
    renderProducts();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* -------------------- Search and filters -------------------- */
function performSearch() {
    const term = String(searchInput?.value || "").trim().toLowerCase();

    if (!term) {
        renderProducts();
        return;
    }

    const results = products.filter(product =>
        [
            product.name,
            product.category,
            product.gender,
            product.collection,
            product.activity_type,
            product.description,
            product.size
        ].some(value =>
            String(value || "").toLowerCase().includes(term)
        )
    );

    displaySearchResults(results);
}

function displaySearchResults(results) {
    const thriftedContainer = document.getElementById("thriftedProducts");
    const newContainer = document.getElementById("newProducts");

    if (!thriftedContainer || !newContainer) return;

    renderProductGroup(
        thriftedContainer,
        results.filter(p => p.collection === "thrifted"),
        "No matching thrifted items."
    );

    renderProductGroup(
        newContainer,
        results.filter(p => p.collection === "new"),
        "No matching new items."
    );
}

function filterProducts(filters = {}) {
    const filtered = products.filter(product => {
        if (filters.category && product.category !== filters.category) return false;
        if (filters.gender && product.gender !== filters.gender) return false;
        if (filters.activity && product.activity_type !== filters.activity) return false;
        return true;
    });

    displaySearchResults(filtered);

    document.getElementById("thrifted")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* -------------------- Store events -------------------- */
function setupStoreEvents() {
    cartBtn?.addEventListener("click", openCart);
    closeCart?.addEventListener("click", closeCartSidebar);
    overlay?.addEventListener("click", closeCartSidebar);

    searchBtn?.addEventListener("click", () => {
        searchPanel?.classList.toggle("open");

        if (searchPanel?.classList.contains("open")) {
            searchInput?.focus();
        }
    });

    closeSearch?.addEventListener("click", () => {
        searchPanel?.classList.remove("open");

        if (searchInput) searchInput.value = "";

        renderProducts();
    });

    searchInput?.addEventListener("input", performSearch);

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("open");
        });

        mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("open");
            });
        });
    }

    notificationBtn?.addEventListener("click", () => {
        notificationPanel?.classList.toggle("open");
    });

    closeNotifications?.addEventListener("click", () => {
        notificationPanel?.classList.remove("open");
    });

    closeProductModal?.addEventListener("click", closeProduct);

    productModal?.addEventListener("click", event => {
        if (event.target === productModal) closeProduct();
    });

    document.querySelectorAll(".category-card").forEach(button => {
        button.addEventListener("click", () => {
            filterProducts({ category: button.dataset.category });
        });
    });

    document.querySelectorAll(".gender-card").forEach(button => {
        button.addEventListener("click", () => {
            filterProducts({ gender: button.dataset.gender });
        });
    });

    document.querySelectorAll(".activity-tags button").forEach(button => {
        button.addEventListener("click", () => {
            filterProducts({ activity: button.dataset.activity });
        });
    });

    checkoutBtn?.addEventListener("click", () => {
        if (!cart.length) {
            alert("Your cart is empty.");
            return;
        }

        showCheckoutForm();
    });

    document.querySelectorAll("[data-view-collection]").forEach(button => {
        button.addEventListener("click", () => {
            viewCollection(button.dataset.viewCollection);
        });
    });
}

/* -------------------- Checkout -------------------- */
function showCheckoutForm() {
    const totalPrice = cart.reduce(
        (total, item) => total + Number(item.price || 0) * item.quantity,
        0
    );

    const itemsHtml = cart.map(item => `
        <div class="checkout-item">
            <img
                src="${escapeHtml(getProductImage(item))}"
                alt="${escapeHtml(item.name)}"
                class="checkout-item-image"
            >

            <div class="checkout-item-details">
                <strong>${escapeHtml(item.name)}</strong>
                <span class="checkout-item-size">
                    Size: ${item.size ? escapeHtml(item.size) : "Not specified"}
                </span>
                <span class="checkout-item-quantity">
                    Quantity: ${item.quantity}
                </span>
            </div>

            <strong class="checkout-item-price">
                KSh ${formatPrice(Number(item.price) * item.quantity)}
            </strong>
        </div>
    `).join("");

    productModalBody.innerHTML = `
        <div class="checkout-form-wrapper">
            <h2>Complete Your Order</h2>
            <p class="checkout-subtitle">
                Enter your details and we'll process your order.
            </p>

            <div class="checkout-items">
                ${itemsHtml}

                <div class="checkout-total">
                    <span>Total</span>
                    <strong>KSh ${formatPrice(totalPrice)}</strong>
                </div>
            </div>

            <form id="checkoutForm">
                <label>
                    Full Name
                    <input type="text" id="checkoutName" required placeholder="Your full name">
                </label>

                <label>
                    Phone Number
                    <input type="tel" id="checkoutPhone" required placeholder="07XXXXXXXX">
                </label>

                <label>
                    Delivery Address
                    <textarea id="checkoutAddress" required placeholder="Enter your delivery location"></textarea>
                </label>

                <label>
                    Order Notes
                    <textarea id="checkoutNotes" placeholder="Optional"></textarea>
                </label>

                <div class="checkout-actions">
                    <button type="submit" class="checkout-submit-btn">Place Order</button>
                    <button type="button" id="cancelCheckout" class="checkout-cancel-btn">Cancel</button>
                </div>

                <p id="checkoutMessage" class="checkout-message" aria-live="polite"></p>
            </form>
        </div>`;

    productModal.classList.add("open");

    document.getElementById("cancelCheckout")
        ?.addEventListener("click", closeProduct);

    document.getElementById("checkoutForm")
        ?.addEventListener("submit", submitOrder);
}

async function submitOrder(event) {
    event.preventDefault();

    const name = document.getElementById("checkoutName")?.value.trim();
    const phone = document.getElementById("checkoutPhone")?.value.trim();
    const address = document.getElementById("checkoutAddress")?.value.trim();
    const notes = document.getElementById("checkoutNotes")?.value.trim();
    const message = document.getElementById("checkoutMessage");

    if (!name || !phone || !address) {
        if (message) {
            message.textContent = "Please fill in all required fields.";
        }
        return;
    }

    const totalAmount = cart.reduce(
        (total, item) => total + Number(item.price || 0) * item.quantity,
        0
    );

    const orderItems = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        size: item.size || null,
        image: getProductImage(item),
        images: getProductImages(item)
    }));

    if (message) message.textContent = "Placing your order...";

    try {
        const { data, error } = await window.supabaseClient
            .from("orders")
            .insert([{
                customer_name: name,
                customer_phone: phone,
                delivery_address: address,
                notes: notes || null,
                items: orderItems,
                total_amount: totalAmount,
                status: "pending"
            }])
            .select()
            .single();

        if (error) throw error;

        console.log("Order successfully created:", data);

        if (message) message.textContent = "Order placed successfully!";

        cart = [];
        updateCart();

        setTimeout(closeProduct, 1500);
    } catch (error) {
        console.error("Order submission error:", error);

        if (message) {
            message.textContent = "We couldn't place your order. Please try again.";
        }
    }
}

/* -------------------- Customer promotions -------------------- */
async function loadCustomerPromotion() {
    const container = document.getElementById("customerPromotion");

    if (!container || !window.supabaseClient) return;

    try {
        const { data, error } = await window.supabaseClient
            .from("promotions")
            .select("*")
            .eq("active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const now = Date.now();

        const promotion = (data || []).find(item => {
            const start = item.start_at
                ? new Date(item.start_at).getTime()
                : null;

            const end = item.end_at
                ? new Date(item.end_at).getTime()
                : null;

            return (!start || start <= now) && (!end || end >= now);
        });

        if (!promotion) {
            container.innerHTML = "";
            container.style.display = "none";
            return;
        }

        let media = "";

        if (promotion.media_url) {
            media = promotion.media_type === "video"
                ? `<video class="customer-promotion-media" src="${escapeHtml(promotion.media_url)}" autoplay muted loop playsinline></video>`
                : `<img class="customer-promotion-media" src="${escapeHtml(promotion.media_url)}" alt="${escapeHtml(promotion.title || "Cladytags Promotion")}">`;
        }

        let button = "";

        if (promotion.button_text) {
            const link = String(promotion.button_link || "#");

            if (link.startsWith("product:")) {
                button = `
                    <a class="customer-promotion-button"
                       href="#"
                       data-promotion-link="${escapeHtml(link)}">
                        ${escapeHtml(promotion.button_text)}
                    </a>`;
            } else {
                button = `
                    <a class="customer-promotion-button"
                       href="${escapeHtml(link)}"
                       ${/^https?:\/\//i.test(link) ? 'target="_blank" rel="noopener noreferrer"' : ""}>
                        ${escapeHtml(promotion.button_text)}
                    </a>`;
            }
        }

        container.innerHTML = `
            <div class="customer-promotion">
                ${media ? `<div class="customer-promotion-media-wrap">${media}</div>` : ""}

                <div class="customer-promotion-content">
                    ${promotion.badge
                        ? `<span class="customer-promotion-badge">${escapeHtml(promotion.badge)}</span>`
                        : ""}

                    <h2>${escapeHtml(promotion.title || "Special Offer")}</h2>

                    ${promotion.message
                        ? `<p>${escapeHtml(promotion.message)}</p>`
                        : ""}

                    ${button}
                </div>
            </div>`;

        container.style.display = "block";
    } catch (error) {
        console.error("Promotion loading error:", error);
        container.style.display = "none";
    }
}

function openPromotionDestination(link) {
    if (!link || !link.startsWith("product:")) return false;

    const productId = link.slice("product:".length).trim();

    const product = products.find(
        item => String(item.id) === String(productId)
    );

    if (product) {
        showProduct(product);
        return true;
    }

    if (window.supabaseClient) {
        window.supabaseClient
            .from("products")
            .select("*")
            .eq("id", productId)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error("Promotion product error:", error);
                    return;
                }

                if (data) showProduct(data);
            });
    }

    return true;
}

document.addEventListener("click", event => {
    const link = event.target.closest("a[data-promotion-link]");

    if (!link) return;

    const destination = link.dataset.promotionLink;

    if (destination?.startsWith("product:")) {
        event.preventDefault();
        openPromotionDestination(destination);
    }
});

/* -------------------- Keyboard / globals -------------------- */
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCartSidebar();
        closeProduct();
        notificationPanel?.classList.remove("open");
        searchPanel?.classList.remove("open");
    }

    if (
        productModal?.classList.contains("open") &&
        currentProductSlideImages.length > 1
    ) {
        if (event.key === "ArrowRight") changeProductSlide(1);
        if (event.key === "ArrowLeft") changeProductSlide(-1);
    }
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.showProduct = showProduct;
window.closeProduct = closeProduct;
window.changeProductSlide = changeProductSlide;
window.goToProductSlide = goToProductSlide;
window.viewCollection = viewCollection;
window.filterProducts = filterProducts;
window.openPromotionDestination = openPromotionDestination;
