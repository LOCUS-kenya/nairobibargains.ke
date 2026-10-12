
/* =====================================================
   CLADYTAGS STORE
   Supabase-powered storefront
   ===================================================== */

let products = [];
let cart = [];

let currentCollectionView = null;


/* =====================================================
   ELEMENTS
   ===================================================== */

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


/* =====================================================
   INITIALIZE
   ===================================================== */

document.addEventListener("DOMContentLoaded", async () => {

loadCustomerPromotion();

    await loadProducts();

    updateCart();

    setupStoreEvents();

});


/* =====================================================
   LOAD PRODUCTS FROM SUPABASE
   ===================================================== */

async function loadProducts() {

    if (!window.supabaseClient) {
        console.error("Supabase client not available.");
        return;
    }

    try {

        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .eq("available", true)
            .order("created_at", {
                ascending: false
            });

        if (error) {
            console.error("Product loading error:", error);
            return;
        }

        products = data || [];

        console.log(
            `Cladytags: ${products.length} products loaded.`
        );

        renderProducts();

    } catch (error) {

        console.error(
            "Unexpected product loading error:",
            error
        );

    }

}


/* =====================================================
   PRODUCT IMAGE
   ===================================================== */

function getProductImage(product) {

    if (
        Array.isArray(product.image_urls) &&
        product.image_urls.length > 0
    ) {
        return product.image_urls[0];
    }

    return "assets/cladytags-logo.png";

}


/* =====================================================
   PRICE
   ===================================================== */

function formatPrice(price) {

    return Number(price || 0).toLocaleString("en-KE");

}


/* =====================================================
   COLLECTION DISPLAY
   ===================================================== */

function renderProducts() {

    const thriftedContainer =
        document.getElementById("thriftedProducts");

    const newContainer =
        document.getElementById("newProducts");

    if (!thriftedContainer || !newContainer) {
        return;
    }

    const thriftedProducts =
        products.filter(
            product => product.collection === "thrifted"
        );

    const newProducts =
        products.filter(
            product => product.collection === "new"
        );

    renderProductGroup(
        thriftedContainer,
        thriftedProducts,
        "No thrifted items available yet."
    );

    renderProductGroup(
        newContainer,
        newProducts,
        "No new items available yet."
    );

}


/* =====================================================
   RENDER PRODUCT GROUP
   ===================================================== */

function renderProductGroup(
    container,
    productList,
    emptyMessage
) {

    container.innerHTML = "";

    if (!productList.length) {

        container.innerHTML = `
            <div class="empty-products">
                <h3>${emptyMessage}</h3>
                <p>
                    New products will appear here when they are posted.
                </p>
            </div>
        `;

        return;
    }

    productList.forEach(product => {

        container.appendChild(
            createProductCard(product)
        );

    });

}


/* =====================================================
   PRODUCT CARD
   ===================================================== */

function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className = "product-card";

    const image =
        getProductImage(product);

    const collectionLabel =
        product.collection === "thrifted"
            ? "THRIFTED"
            : "NEW";

    const gender =
        product.gender
            ? product.gender.toUpperCase()
            : "";

    const category =
        product.category
            ? product.category.toUpperCase()
            : "";

    card.innerHTML = `

        <div class="product-image">

            <img
                src="${image}"
                alt="${escapeHtml(product.name)}"
                loading="lazy"
            >

            <span class="product-badge">
                ${collectionLabel}
            </span>

        </div>

        <div class="product-info">

            <div class="product-category">
                ${gender}${gender && category ? " • " : ""}${category}
            </div>

            <h3 class="product-name">
                ${escapeHtml(product.name)}
            </h3>

            <div class="product-price">
                KSh ${formatPrice(product.price)}
            </div>

            ${
                product.size
                ? `
                    <div class="product-size">
                        Size: ${escapeHtml(product.size)}
                    </div>
                  `
                : ""
            }

            <div class="product-actions">

                <button
                    class="add-cart-btn"
                    onclick="addToCart('${product.id}')"
                >
                    Add to Cart
                </button>

                <button
                    class="view-product-btn"
                    onclick="showProduct('${product.id}')"
                >
                    View
                </button>

            </div>

        </div>
    `;

    return card;

}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =====================================================
   PRODUCT MODAL
   ===================================================== */

function showProduct(productId) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    const image =
        getProductImage(product);

    productModalBody.innerHTML = `

        <div class="product-modal-grid">

            <div class="modal-image-wrapper">

                <img
                    src="${image}"
                    alt="${escapeHtml(product.name)}"
                    class="modal-product-image"
                >

            </div>

            <div class="modal-product-info">

                <div class="product-category">
                    ${
                        product.collection === "thrifted"
                            ? "THRIFTED"
                            : "NEW"
                    }
                    ${
                        product.gender
                            ? " • " + product.gender.toUpperCase()
                            : ""
                    }
                </div>

                <h2>
                    ${escapeHtml(product.name)}
                </h2>

                <div class="modal-product-price">
                    KSh ${formatPrice(product.price)}
                </div>

                ${
                    product.size
                    ? `
                        <p>
                            <strong>Size:</strong>
                            ${escapeHtml(product.size)}
                        </p>
                      `
                    : ""
                }

                ${
                    product.description
                    ? `
                        <p class="modal-product-description">
                            ${escapeHtml(product.description)}
                        </p>
                      `
                    : ""
                }

                <button
                    class="modal-add-btn"
                    onclick="addToCart('${product.id}'); closeProduct();"
                >
                    Add to Cart
                </button>

            </div>

        </div>
    `;

    productModal.classList.add("open");

}


/* =====================================================
   CLOSE PRODUCT
   ===================================================== */

function closeProduct() {

    productModal.classList.remove("open");

}


/* =====================================================
   CART
   ===================================================== */

function addToCart(productId) {

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) {
        return;
    }

    const existingItem =
        cart.find(
            item => item.id === productId
        );

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            ...product,
            quantity: 1
        });

    }

    updateCart();

    openCart();

}


function removeFromCart(productId) {

    cart =
        cart.filter(
            item => item.id !== productId
        );

    updateCart();

}


function changeQuantity(productId, change) {

    const item =
        cart.find(
            product => product.id === productId
        );

    if (!item) {
        return;
    }

    item.quantity += change;

    if (item.quantity <= 0) {

        removeFromCart(productId);

        return;
    }

    updateCart();

}


/* =====================================================
   UPDATE CART
   ===================================================== */

function updateCart() {

    const totalItems =
        cart.reduce(
            (total, item) =>
                total + item.quantity,
            0
        );

    const totalPrice =
        cart.reduce(
            (total, item) =>
                total +
                (Number(item.price) * item.quantity),
            0
        );

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    if (cartTotal) {

        cartTotal.textContent =
            `KSh ${formatPrice(totalPrice)}`;

    }

    renderCart();

}


/* =====================================================
   RENDER CART
   ===================================================== */

function renderCart() {

    if (!cartItems) {
        return;
    }

    if (!cart.length) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <span>🛒</span>

                <h3>Your cart is empty</h3>

                <p>
                    Add something you love.
                </p>

            </div>

        `;

        return;
    }

    cartItems.innerHTML = "";

    cart.forEach(item => {

        const cartItem =
            document.createElement("div");

        cartItem.className =
            "cart-item";

        cartItem.innerHTML = `

            <img
                src="${getProductImage(item)}"
                alt="${escapeHtml(item.name)}"
                class="cart-item-image"
            >

            <div class="cart-item-info">

                <h4>
                    ${escapeHtml(item.name)}
                </h4>

                <p>
                    KSh ${formatPrice(item.price)}
                </p>

                <div class="quantity-controls">

                    <button
                        onclick="changeQuantity('${item.id}', -1)"
                    >
                        −
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                        onclick="changeQuantity('${item.id}', 1)"
                    >
                        +
                    </button>

                </div>

                <button
                    class="remove-cart-item"
                    onclick="removeFromCart('${item.id}')"
                >
                    Remove
                </button>

            </div>

        `;

        cartItems.appendChild(cartItem);

    });

}


/* =====================================================
   CART OPEN / CLOSE
   ===================================================== */

function openCart() {

    if (cartSidebar) {
        cartSidebar.classList.add("open");
    }

    if (overlay) {
        overlay.classList.add("show");
    }

}


function closeCartSidebar() {

    if (cartSidebar) {
        cartSidebar.classList.remove("open");
    }

    if (overlay) {
        overlay.classList.remove("show");
    }

}


/* =====================================================
   VIEW ALL COLLECTION
   ===================================================== */

function viewCollection(collection) {

    currentCollectionView = collection;

    const matchingProducts =
        products.filter(product =>
            product.collection === collection
        );

    const title =
        collection === "thrifted"
            ? "All Thrifted Finds"
            : "All New Collection";

    showCollectionResults(
        matchingProducts,
        title
    );

}


/* =====================================================
   SHOW FULL COLLECTION
   ===================================================== */

function showCollectionResults(
    productList,
    title
) {

    const thriftedSection =
        document.getElementById("thrifted");

    const newSection =
        document.getElementById("new");

    if (!thriftedSection || !newSection) {
        return;
    }

    /*
     * Hide the normal homepage collection sections
     * while viewing a full collection.
     */

    thriftedSection.style.display = "none";
    newSection.style.display = "none";


    /*
     * Remove any previous full collection view.
     */

    const oldView =
        document.getElementById("fullCollectionView");

    if (oldView) {
        oldView.remove();
    }


    /*
     * Create the full collection area.
     */

    const collectionView =
        document.createElement("section");

    collectionView.id =
        "fullCollectionView";

    collectionView.className =
        "full-collection-view";


    collectionView.innerHTML = `

        <div class="full-collection-header">

            <button
                type="button"
                class="back-to-store-btn"
                id="backToStoreBtn"
            >
                ← Back to Store
            </button>

            <div class="section-heading">

                <span>
                    ${
                        currentCollectionView === "thrifted"
                            ? "ONE-OF-A-KIND"
                            : "FRESH ARRIVALS"
                    }
                </span>

                <h2>
                    ${escapeHtml(title)}
                </h2>

            </div>

        </div>


        <div class="collection-search-wrapper">

            <input
                type="search"
                id="collectionSearchInput"
                class="collection-search-input"
                placeholder="${
                    currentCollectionView === "thrifted"
                        ? "Search thrifted items..."
                        : "Search new collection..."
                }"
                autocomplete="off"
            >

        </div>


        <div
            class="collection-result-count"
            id="collectionResultCount"
        >
        </div>


        <div
            class="product-grid full-collection-grid"
            id="fullCollectionProducts"
        >
        </div>

    `;


    /*
     * Put the full collection immediately
     * before the footer / at the end of the main content.
     */

    const footer =
        document.querySelector("footer");

    if (footer) {

        footer.parentNode.insertBefore(
            collectionView,
            footer
        );

    } else {

        document.body.appendChild(
            collectionView
        );

    }


    const resultsContainer =
        document.getElementById(
            "fullCollectionProducts"
        );

    renderFullCollectionProducts(
        resultsContainer,
        productList
    );


    /*
     * Back button
     */

    const backButton =
        document.getElementById(
            "backToStoreBtn"
        );

    if (backButton) {

        backButton.addEventListener(
            "click",
            closeCollectionView
        );

    }


    /*
     * Collection search
     */

    const collectionSearch =
        document.getElementById(
            "collectionSearchInput"
        );

    if (collectionSearch) {

        collectionSearch.addEventListener(
            "input",
            () => {

                searchFullCollection(
                    collectionSearch.value
                );

            }
        );

    }


    /*
     * Scroll to the collection.
     */

    collectionView.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =====================================================
   RENDER FULL COLLECTION PRODUCTS
   ===================================================== */

function renderFullCollectionProducts(
    container,
    productList
) {

    if (!container) {
        return;
    }

    container.innerHTML = "";


    const count =
        document.getElementById(
            "collectionResultCount"
        );


    if (count) {

        count.textContent =
            `${productList.length} ${
                productList.length === 1
                    ? "item"
                    : "items"
            }`;

    }


    if (!productList.length) {

        container.innerHTML = `

            <div class="empty-products">

                <h3>
                    No products available
                </h3>

                <p>
                    Check back soon for new arrivals.
                </p>

            </div>

        `;

        return;

    }


    productList.forEach(product => {

        container.appendChild(
            createProductCard(product)
        );

    });

}


/* =====================================================
   SEARCH INSIDE FULL COLLECTION
   ===================================================== */

function searchFullCollection(searchTerm) {

    const term =
        String(searchTerm || "")
            .trim()
            .toLowerCase();


    const collection =
        currentCollectionView;


    let results =
        products.filter(product =>
            product.collection === collection
        );


    if (term) {

        results =
            results.filter(product => {

                return (

                    String(product.name || "")
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(product.category || "")
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(product.gender || "")
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(product.activity_type || "")
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(product.description || "")
                        .toLowerCase()
                        .includes(term)

                    ||

                    String(product.size || "")
                        .toLowerCase()
                        .includes(term)

                );

            });

    }


    const container =
        document.getElementById(
            "fullCollectionProducts"
        );


    renderFullCollectionProducts(
        container,
        results
    );

}


/* =====================================================
   CLOSE FULL COLLECTION
   ===================================================== */

function closeCollectionView() {

    const collectionView =
        document.getElementById(
            "fullCollectionView"
        );


    if (collectionView) {
        collectionView.remove();
    }


    const thriftedSection =
        document.getElementById("thrifted");

    const newSection =
        document.getElementById("new");


    if (thriftedSection) {
        thriftedSection.style.display = "";
    }


    if (newSection) {
        newSection.style.display = "";
    }


    currentCollectionView = null;


    const thriftedProducts =
        document.getElementById(
            "thriftedProducts"
        );

    const newProducts =
        document.getElementById(
            "newProducts"
        );


    if (thriftedProducts) {
        thriftedProducts.innerHTML = "";
    }


    if (newProducts) {
        newProducts.innerHTML = "";
    }


    renderProducts();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* =====================================================
   SEARCH
   ===================================================== */

function performSearch() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();

    if (!searchTerm) {

        renderProducts();

        return;

    }

    const results =
        products.filter(product => {

            return (

                String(product.name || "")
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                String(product.category || "")
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                String(product.gender || "")
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                String(product.collection || "")
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                String(product.activity_type || "")
                    .toLowerCase()
                    .includes(searchTerm)

            );

        });

    displaySearchResults(results);

}


function displaySearchResults(results) {

    const thriftedContainer =
        document.getElementById("thriftedProducts");

    const newContainer =
        document.getElementById("newProducts");

    thriftedContainer.innerHTML = "";
    newContainer.innerHTML = "";

    const thrifted =
        results.filter(
            product =>
                product.collection === "thrifted"
        );

    const newItems =
        results.filter(
            product =>
                product.collection === "new"
        );

    renderProductGroup(
        thriftedContainer,
        thrifted,
        "No matching thrifted items."
    );

    renderProductGroup(
        newContainer,
        newItems,
        "No matching new items."
    );

}


/* =====================================================
   FILTER PRODUCTS
   ===================================================== */

function filterProducts(filters) {

    const filtered =
        products.filter(product => {

            if (
                filters.category &&
                product.category !== filters.category
            ) {
                return false;
            }

            if (
                filters.gender &&
                product.gender !== filters.gender
            ) {
                return false;
            }

            if (
                filters.activity &&
                product.activity_type !== filters.activity
            ) {
                return false;
            }

            return true;

        });

    const thriftedContainer =
        document.getElementById("thriftedProducts");

    const newContainer =
        document.getElementById("newProducts");

    thriftedContainer.innerHTML = "";
    newContainer.innerHTML = "";

    renderProductGroup(
        thriftedContainer,
        filtered.filter(
            product =>
                product.collection === "thrifted"
        ),
        "No matching thrifted products."
    );

    renderProductGroup(
        newContainer,
        filtered.filter(
            product =>
                product.collection === "new"
        ),
        "No matching new products."
    );

    const thriftedSection =
        document.getElementById("thrifted");

    if (thriftedSection) {

        window.scrollTo({
            top:
                thriftedSection.offsetTop - 80,
            behavior: "smooth"
        });

    }

}


/* =====================================================
   STORE EVENTS
   ===================================================== */

function setupStoreEvents() {

    if (cartBtn) {
        cartBtn.addEventListener(
            "click",
            openCart
        );
    }

    if (closeCart) {
        closeCart.addEventListener(
            "click",
            closeCartSidebar
        );
    }

    if (overlay) {
        overlay.addEventListener(
            "click",
            closeCartSidebar
        );
    }


    /* SEARCH */

    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            () => {

                searchPanel.classList.toggle("open");

                if (
                    searchPanel.classList.contains("open")
                ) {

                    searchInput.focus();

                }

            }
        );

    }


    if (closeSearch) {

        closeSearch.addEventListener(
            "click",
            () => {

                searchPanel.classList.remove("open");

                searchInput.value = "";

                renderProducts();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            performSearch
        );

    }


    /* MOBILE MENU */

    if (menuBtn && mobileMenu) {

        menuBtn.addEventListener(
            "click",
            () => {

                mobileMenu.classList.toggle("open");

            }
        );

        mobileMenu
            .querySelectorAll("a")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        mobileMenu.classList.remove(
                            "open"
                        );

                    }
                );

            });

    }


    /* NOTIFICATIONS */

    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            () => {

                notificationPanel.classList.toggle(
                    "open"
                );

            }
        );

    }


    if (closeNotifications) {

        closeNotifications.addEventListener(
            "click",
            () => {

                notificationPanel.classList.remove(
                    "open"
                );

            }
        );

    }


    /* PRODUCT MODAL */

    if (closeProductModal) {

        closeProductModal.addEventListener(
            "click",
            closeProduct
        );

    }

    if (productModal) {

        productModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === productModal
                ) {

                    closeProduct();

                }

            }
        );

    }


    /* CATEGORY */

    document
        .querySelectorAll(".category-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    filterProducts({
                        category:
                            button.dataset.category
                    });

                }
            );

        });


    /* GENDER */

    document
        .querySelectorAll(".gender-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    filterProducts({
                        gender:
                            button.dataset.gender
                    });

                }
            );

        });


    /* ACTIVITY */

    document
        .querySelectorAll(".activity-tags button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    filterProducts({
                        activity:
                            button.dataset.activity
                    });

                }
            );

        });


/* CHECKOUT */

if (checkoutBtn) {

    checkoutBtn.addEventListener(
        "click",
        () => {

            if (!cart.length) {

                alert("Your cart is empty.");

                return;

            }

            showCheckoutForm();

        }
    );

}


    /* VIEW ALL BUTTONS */

    document
        .querySelectorAll("[data-view-collection]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    viewCollection(
                        button.dataset.viewCollection
                    );

                }
            );

        });

}

/* =====================================================
   CHECKOUT FORM
   ===================================================== */

function showCheckoutForm() {

    const totalPrice = cart.reduce(
        (total, item) =>
            total + (Number(item.price) * item.quantity),
        0
    );

const itemsHtml = cart.map(item => `
    <div class="checkout-item">

        <img
            src="${getProductImage(item)}"
            alt="${escapeHtml(item.name)}"
            class="checkout-item-image"
        >

        <div class="checkout-item-details">

            <strong>
                ${escapeHtml(item.name)}
            </strong>

            ${
                item.size
                ? `
                    <span class="checkout-item-size">
                        Size: ${escapeHtml(item.size)}
                    </span>
                `
                : `
                    <span class="checkout-item-size">
                        Size: Not specified
                    </span>
                `
            }

            <span class="checkout-item-quantity">
                Quantity: ${item.quantity}
            </span>

        </div>

        <strong class="checkout-item-price">
            KSh ${formatPrice(Number(item.price) * item.quantity)}
        </strong>

    </div>
`).join("");

    const checkoutHtml = `

        <div class="checkout-form-wrapper">

            <h2>Complete Your Order</h2>

            <p class="checkout-subtitle">
                Enter your details and we'll process your order.
            </p>

            <div class="checkout-items">

                ${itemsHtml}

                <div class="checkout-total">
                    <span>Total</span>
                    <strong>
                        KSh ${formatPrice(totalPrice)}
                    </strong>
                </div>

            </div>

            <form id="checkoutForm">

                <label>
                    Full Name
                    <input
                        type="text"
                        id="checkoutName"
                        required
                        placeholder="Your full name"
                    >
                </label>

                <label>
                    Phone Number
                    <input
                        type="tel"
                        id="checkoutPhone"
                        required
                        placeholder="07XXXXXXXX"
                    >
                </label>

                <label>
                    Delivery Address
                    <textarea
                        id="checkoutAddress"
                        required
                        placeholder="Enter your delivery location"
                    ></textarea>
                </label>

                <label>
                    Order Notes
                    <textarea
                        id="checkoutNotes"
                        placeholder="Optional"
                    ></textarea>
                </label>

                <div class="checkout-actions">

                    <button
                        type="submit"
                        class="checkout-submit-btn"
                    >
                        Place Order
                    </button>

                    <button
                        type="button"
                        id="cancelCheckout"
                        class="checkout-cancel-btn"
                    >
                        Cancel
                    </button>

                </div>

                <p
                    id="checkoutMessage"
                    class="checkout-message"
                ></p>

            </form>

        </div>
    `;

    productModalBody.innerHTML = checkoutHtml;

    productModal.classList.add("open");

    const checkoutForm =
        document.getElementById("checkoutForm");

    const cancelCheckout =
        document.getElementById("cancelCheckout");

    if (cancelCheckout) {

        cancelCheckout.addEventListener(
            "click",
            closeProduct
        );

    }

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            submitOrder
        );

    }

}


/* =====================================================
   SUBMIT ORDER
   ===================================================== */

async function submitOrder(event) {

    event.preventDefault();

    const name =
        document
            .getElementById("checkoutName")
            .value
            .trim();

    const phone =
        document
            .getElementById("checkoutPhone")
            .value
            .trim();

    const address =
        document
            .getElementById("checkoutAddress")
            .value
            .trim();

    const notes =
        document
            .getElementById("checkoutNotes")
            .value
            .trim();

    const message =
        document.getElementById("checkoutMessage");

    if (!name || !phone || !address) {

        message.textContent =
            "Please fill in all required fields.";

        return;

    }

    const totalAmount =
        cart.reduce(
            (total, item) =>
                total +
                (Number(item.price) * item.quantity),
            0
        );

const orderItems =
    cart.map(item => ({
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        size: item.size || null,
        image: getProductImage(item)
    }));

    message.textContent =
        "Placing your order...";

    try {

        const { data, error } =
            await supabaseClient
                .from("orders")
                .insert([
                    {
                        customer_name: name,
                        customer_phone: phone,
                        delivery_address: address,
                        notes: notes || null,
                        items: orderItems,
                        total_amount: totalAmount,
                        status: "pending"
                    }
                ])
                .select()
                .single();

        if (error) {

            console.error(
                "Order submission error:",
                error
            );

            message.textContent =
                "We couldn't place your order. Please try again.";

            return;

        }

        console.log(
            "Order successfully created:",
            data
        );

        message.textContent =
            "Order placed successfully!";

        cart = [];

        updateCart();

        setTimeout(() => {

            closeProduct();

        }, 1500);

    } catch (error) {

        console.error(
            "Unexpected order error:",
            error
        );

        message.textContent =
            "Something went wrong. Please try again.";

    }

}
/* =====================================================
   ESCAPE KEY
   ===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        closeCartSidebar();

        closeProduct();

        if (notificationPanel) {
            notificationPanel.classList.remove(
                "open"
            );
        }

        if (searchPanel) {
            searchPanel.classList.remove(
                "open"
            );
        }

    }
);


/* =====================================================
   GLOBAL FUNCTIONS
   ===================================================== */

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
window.showProduct = showProduct;
window.closeProduct = closeProduct;
window.viewCollection = viewCollection;
window.filterProducts = filterProducts;
/* =========================================================
   CUSTOMER PROMOTIONS
   ========================================================= */

async function loadCustomerPromotion() {

    const container =
        document.getElementById(
            "customerPromotion"
        );

    if (!container) {
        return;
    }


    try {

        const now =
            new Date().toISOString();


        const { data, error } =
            await supabaseClient
                .from("promotions")
                .select("*")
                .eq("active", true)
                .or(
                    `start_at.is.null,start_at.lte.${now}`
                )
                .or(
                    `end_at.is.null,end_at.gte.${now}`
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1);


        if (error) {

            console.error(
                "Promotion loading error:",
                error
            );

            container.style.display =
                "none";

            return;
        }


        if (!data || !data.length) {

            container.innerHTML = "";

            container.style.display =
                "none";

            return;
        }


        const promotion =
            data[0];


        const media =
            promotion.media_url
                ? (
                    promotion.media_type === "video"

                    ? `
                        <video
                            class="customer-promotion-media"
                            src="${escapeHtml(
                                promotion.media_url
                            )}"
                            autoplay
                            muted
                            loop
                            playsinline
                        ></video>
                    `

                    : `
                        <img
                            class="customer-promotion-media"
                            src="${escapeHtml(
                                promotion.media_url
                            )}"
                            alt="${escapeHtml(
                                promotion.title ||
                                "Cladytags Promotion"
                            )}"
                        >
                    `
                )
                : "";


        const button =
            promotion.button_text
            ? `
                <a
                    class="customer-promotion-button"
                    href="${
                        promotion.button_link ||
                        "#"
                    }"
                    ${
                        promotion.button_link &&
                        promotion.button_link.startsWith("http")
                            ? 'target="_blank"'
                            : ""
                    }
                >
                    ${escapeHtml(
                        promotion.button_text
                    )}
                </a>
            `
            : "";


        container.innerHTML = `

            <div class="customer-promotion">

                ${
                    media
                        ? `
                            <div class="customer-promotion-media-wrap">
                                ${media}
                            </div>
                        `
                        : ""
                }

                <div class="customer-promotion-content">

                    ${
                        promotion.badge
                            ? `
                                <span class="customer-promotion-badge">
                                    ${escapeHtml(
                                        promotion.badge
                                    )}
                                </span>
                            `
                            : ""
                    }

                    <h2>
                        ${escapeHtml(
                            promotion.title ||
                            "Special Offer"
                        )}
                    </h2>

                    ${
                        promotion.message
                            ? `
                                <p>
                                    ${escapeHtml(
                                        promotion.message
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${button}

                </div>

            </div>

        `;


        container.style.display =
            "block";


    } catch (error) {

        console.error(
            "Unexpected promotion error:",
            error
        );

        container.style.display =
            "none";

    }

}
/* =========================================================
   CLADYTAGS PROMOTION PRODUCT LINKS
   ========================================================= */

function openPromotionDestination(link) {

    if (!link) {
        return false;
    }


    /* -----------------------------------------------------
       PRODUCT PROMOTION
       ----------------------------------------------------- */

    if (
        link.startsWith("product:")
    ) {

        const productId =
            link.replace(
                "product:",
                ""
            ).trim();


        if (!productId) {
            return false;
        }


        /*
         * Try to find the existing product
         * in the products already loaded
         * by the store.
         */

        const product =
            window.products?.find(
                item =>
                    String(item.id) ===
                    String(productId)
            );


        if (product) {

            /*
             * Use the existing product
             * modal if available.
             */

            if (
                typeof window.openProductModal ===
                "function"
            ) {

                window.openProductModal(
                    product
                );

                return true;

            }


            /*
             * Some versions of your script
             * may use showProduct().
             */

            if (
                typeof window.showProduct ===
                "function"
            ) {

                window.showProduct(
                    product
                );

                return true;

            }

        }


        /*
         * If products are loaded through
         * another variable/function, find
         * the product directly from Supabase.
         */

        if (
            window.supabaseClient
        ) {

            window.supabaseClient
                .from("products")
                .select("*")
                .eq("id", productId)
                .single()
                .then(
                    ({ data, error }) => {

                        if (error) {

                            console.error(
                                "Promotion product error:",
                                error
                            );

                            return;
                        }


                        if (!data) {
                            return;
                        }


                        if (
                            typeof window.openProductModal ===
                            "function"
                        ) {

                            window.openProductModal(
                                data
                            );

                            return;
                        }


                        if (
                            typeof window.showProduct ===
                            "function"
                        ) {

                            window.showProduct(
                                data
                            );

                        }

                    }
                );

        }


        return true;

    }


    return false;

}


/* =========================================================
   PROMOTION CLICK HANDLER
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const link =
            event.target.closest(
                "a[data-promotion-link]"
            );

        if (!link) {
            return;
        }


        const destination =
            link.dataset.promotionLink;


        if (
            destination &&
            destination.startsWith(
                "product:"
            )
        ) {

            event.preventDefault();

            openPromotionDestination(
                destination
            );

        }

    }
);