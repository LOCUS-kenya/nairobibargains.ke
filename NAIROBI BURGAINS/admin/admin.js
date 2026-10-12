
/* =========================================================
   CLADYTAGS ADMIN PANEL
   SUPABASE CONNECTED VERSION
   Products + Orders + Promotions
   ========================================================= */


/* =========================================================
   SUPABASE
   ========================================================= */

const db = window.supabaseClient;

if (!db) {
    console.error(
        "Cladytags Admin: Supabase client was not found."
    );
}


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let products = [];
let orders = [];
let promotions = [];

let editingProductId = null;
let editingPromotionId = null;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);


function setText(id, value) {

    const element = $(id);

    if (element) {
        element.textContent = value ?? "";
    }
}


function setValue(id, value) {

    const element = $(id);

    if (element) {
        element.value = value ?? "";
    }
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showMessage(message, type = "success") {

    const element = $("message");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;

    element.className =
        type === "error"
            ? "message error"
            : "message success";

    element.style.display = "block";

    clearTimeout(
        window.cladytagsMessageTimer
    );

    window.cladytagsMessageTimer =
        setTimeout(() => {

            element.style.display = "none";

        }, 4000);
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(
            ".admin-section"
        );

    sections.forEach(section => {

        section.style.display =
            section.id === sectionId
                ? "block"
                : "none";

    });

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });
}


function setupNavigation() {

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });
}


/* =========================================================
   AUTH
   ========================================================= */

async function checkLogin() {

    if (!db) {
        showMessage(
            "Supabase is not connected.",
            "error"
        );
        return;
    }

    try {

        const {
            data,
            error
        } = await db.auth.getSession();

        if (error) {
            throw error;
        }

        if (!data.session) {

            showMessage(
                "No admin session found. Please log in.",
                "error"
            );

            return;
        }

        console.log(
            "Cladytags Admin: authenticated."
        );

        await loadAllData();

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showMessage(
            error.message ||
            "Could not check login.",
            "error"
        );

    }
}


async function logoutAdmin() {

    if (!db) {
        return;
    }

    const {
        error
    } = await db.auth.signOut();

    if (error) {

        showMessage(
            error.message ||
            "Could not log out.",
            "error"
        );

        return;
    }

    window.location.reload();
}


/* =========================================================
   LOAD ALL DATA
   ========================================================= */

async function loadAllData() {

    await Promise.all([
        loadProducts(),
        loadOrders(),
        loadPromotions()
    ]);

    updateDashboard();
}


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {

    if (!db) {
        return;
    }

    try {

        const {
            data,
            error
        } = await db
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {
            throw error;
        }

        products = data || [];

        renderProducts();

        updateDashboard();

        console.log(
            `Cladytags Admin: ${products.length} products loaded.`
        );

    } catch (error) {

        console.error(
            "Products loading error:",
            error
        );

        products = [];

        renderProducts();

    }
}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

    const container =
        $("productsGrid");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!products.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No products found</h3>
                <p>Add your first product.</p>
            </div>
        `;

        return;
    }


    products.forEach(product => {

        const card =
            document.createElement("div");

        card.className =
            "product-card";


        const imageUrl =
            Array.isArray(product.image_urls) &&
            product.image_urls.length
                ? product.image_urls[0]
                : "";


        card.innerHTML = `

            <div class="product-image">

                ${
                    imageUrl

                        ? `
                            <img
                                src="${escapeHtml(imageUrl)}"
                                alt="${escapeHtml(product.name)}"
                            >
                          `

                        : `
                            <div class="no-image">
                                No Image
                            </div>
                          `
                }

            </div>


            <div class="product-card-content">

                <h3>
                    ${escapeHtml(product.name)}
                </h3>

                <p>
                    ${escapeHtml(
                        product.category || ""
                    )}
                </p>

                <strong>
                    KSh ${Number(
                        product.price || 0
                    ).toLocaleString()}
                </strong>

                <p>
                    Stock:
                    ${Number(
                        product.quantity || 0
                    )}
                </p>


                <div class="product-actions">

                    <button
                        type="button"
                        class="edit-product-btn"
                        data-id="${product.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-product-btn"
                        data-id="${product.id}"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;


        container.appendChild(card);

    });


    container
        .querySelectorAll(
            ".edit-product-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editProduct(
                        button.dataset.id
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".delete-product-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteProduct(
                        button.dataset.id
                    );

                }
            );

        });

}


/* =========================================================
   ADD PRODUCT
   ========================================================= */

function openAddProduct() {

    editingProductId = null;

    const form =
        $("productForm");

    if (form) {
        form.reset();
    }

    setText(
        "productFormTitle",
        "Add Product"
    );

    const panel =
        $("productFormPanel");

    if (panel) {
        panel.style.display = "block";
    }

}


/* =========================================================
   EDIT PRODUCT
   ========================================================= */

function editProduct(productId) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );

    if (!product) {

        showMessage(
            "Product not found.",
            "error"
        );

        return;
    }


    editingProductId =
        product.id;


    setValue(
        "productId",
        product.id
    );

    setValue(
        "productName",
        product.name
    );

    setValue(
        "productPrice",
        product.price
    );

    setValue(
        "productCategory",
        product.category
    );

    setValue(
        "productStock",
        product.quantity
    );

    setValue(
        "productDescription",
        product.description
    );


    setText(
        "productFormTitle",
        "Edit Product"
    );


    const panel =
        $("productFormPanel");

    if (panel) {
        panel.style.display = "block";
    }

}


/* =========================================================
   SAVE PRODUCT
   ========================================================= */

async function saveProduct(event) {

    event.preventDefault();

    if (!db) {
        showMessage(
            "Supabase is not connected.",
            "error"
        );
        return;
    }


    const name =
        $("productName")?.value.trim();

    const price =
        Number(
            $("productPrice")?.value || 0
        );

    const category =
        $("productCategory")?.value.trim();

    const quantity =
        Number(
            $("productStock")?.value || 0
        );

    const description =
        $("productDescription")?.value.trim() ||
        "";


    if (!name) {

        showMessage(
            "Enter a product name.",
            "error"
        );

        return;
    }


    if (!category) {

        showMessage(
            "Enter a product category.",
            "error"
        );

        return;
    }


    if (price < 0) {

        showMessage(
            "Price cannot be negative.",
            "error"
        );

        return;
    }


    if (quantity < 0) {

        showMessage(
            "Stock cannot be negative.",
            "error"
        );

        return;
    }


    const button =
        document.querySelector(
            "#productForm button[type='submit']"
        );


    if (button) {

        button.disabled = true;

        button.textContent =
            editingProductId
                ? "Saving..."
                : "Publishing...";

    }


    try {

        let productData = {

            name,

            price,

            category,

            quantity,

            description,

            updated_at:
                new Date().toISOString()

        };


        const fileInput =
            $("productImage");

        const file =
            fileInput?.files?.[0];


        /* =================================================
           IMAGE UPLOAD
           ================================================= */

        if (file) {

            const folder =
                editingProductId ||
                crypto.randomUUID();

            const extension =
                file.name
                    .split(".")
                    .pop()
                    ?.toLowerCase() ||
                "jpg";


            const fileName =
                `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;


            const {
                error: uploadError
            } = await db.storage
                .from("product-images")
                .upload(
                    fileName,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


            if (uploadError) {
                throw uploadError;
            }


            const {
                data: publicData
            } = db.storage
                .from("product-images")
                .getPublicUrl(
                    fileName
                );


            if (publicData?.publicUrl) {

                productData.image_urls =
                    [
                        publicData.publicUrl
                    ];

            }

        }


        /* =================================================
           UPDATE
           ================================================= */

        if (editingProductId) {

            const existing =
                products.find(
                    item =>
                        String(item.id) ===
                        String(editingProductId)
                );


            if (
                !productData.image_urls &&
                existing
            ) {

                productData.image_urls =
                    Array.isArray(
                        existing.image_urls
                    )
                        ? existing.image_urls
                        : [];

            }


            const {
                error
            } = await db
                .from("products")
                .update(
                    productData
                )
                .eq(
                    "id",
                    editingProductId
                );


            if (error) {
                throw error;
            }


            showMessage(
                "Product updated successfully."
            );

        }


        /* =================================================
           INSERT
           ================================================= */

        else {

            if (
                !productData.image_urls
            ) {

                productData.image_urls =
                    [];

            }


            const {
                error
            } = await db
                .from("products")
                .insert(
                    productData
                );


            if (error) {
                throw error;
            }


            showMessage(
                "Product published successfully."
            );

        }


        editingProductId =
            null;


        const form =
            $("productForm");

        if (form) {
            form.reset();
        }


        const panel =
            $("productFormPanel");

        if (panel) {
            panel.style.display =
                "none";
        }


        await loadProducts();


    } catch (error) {

        console.error(
            "Product save error:",
            error
        );

        showMessage(
            error.message ||
            "Could not save product.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                "Save Product";

        }

    }

}


/* =========================================================
   DELETE PRODUCT
   ========================================================= */

async function deleteProduct(
    productId
) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${product.name}"?\n\nThis cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await db
            .from("products")
            .delete()
            .eq(
                "id",
                productId
            );


        if (error) {
            throw error;
        }


        showMessage(
            "Product deleted."
        );


        await loadProducts();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Could not delete product.",
            "error"
        );

    }

}


/* =========================================================
   ORDERS
   ========================================================= */

async function loadOrders() {

    if (!db) {
        return;
    }

    try {

        const {
            data,
            error
        } = await db
            .from("orders")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        orders =
            data || [];


        renderOrders();

        updateDashboard();


    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );

        orders = [];

        renderOrders();

    }

}


/* =========================================================
   RENDER ORDERS
   ========================================================= */

function renderOrders() {

    const container =
        $("ordersList");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No orders yet</h3>
                <p>Customer orders will appear here.</p>
            </div>
        `;

        return;
    }


    orders.forEach(order => {

        const card =
            document.createElement("div");

        card.className =
            "order-card";


        card.innerHTML = `

            <div>

                <h3>
                    Order #${escapeHtml(
                        order.id
                    )}
                </h3>

                <p>
                    <strong>
                        Customer:
                    </strong>

                    ${escapeHtml(
                        order.customer_name ||
                        ""
                    )}
                </p>

                <p>
                    <strong>
                        Phone:
                    </strong>

                    ${escapeHtml(
                        order.customer_phone ||
                        ""
                    )}
                </p>

                <p>
                    <strong>
                        Address:
                    </strong>

                    ${escapeHtml(
                        order.delivery_address ||
                        ""
                    )}
                </p>

                <p>
                    <strong>
                        Total:
                    </strong>

                    KSh ${Number(
                        order.total_amount ||
                        0
                    ).toLocaleString()}
                </p>

            </div>


            <div>

                <label>
                    Status
                </label>

                <select
                    class="order-status"
                    data-id="${order.id}"
                >

                    ${[
                        "Pending",
                        "Confirmed",
                        "Processing",
                        "Shipped",
                        "Delivered",
                        "Cancelled"
                    ]
                    .map(status => `

                        <option
                            value="${status}"
                            ${
                                order.status === status
                                    ? "selected"
                                    : ""
                            }
                        >
                            ${status}
                        </option>

                    `)
                    .join("")}

                </select>

            </div>

        `;


        container.appendChild(card);

    });


    container
        .querySelectorAll(
            ".order-status"
        )
        .forEach(select => {

            select.addEventListener(
                "change",
                () => {

                    updateOrderStatus(
                        select.dataset.id,
                        select.value
                    );

                }
            );

        });

}


/* =========================================================
   UPDATE ORDER STATUS
   ========================================================= */

async function updateOrderStatus(
    orderId,
    newStatus
) {

    try {

        const {
            error
        } = await db
            .from("orders")
            .update({

                status:
                    newStatus,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                orderId
            );


        if (error) {
            throw error;
        }


        showMessage(
            "Order status updated."
        );


        await loadOrders();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Could not update order.",
            "error"
        );

    }

}


/* =========================================================
   PROMOTIONS
   ========================================================= */

async function loadPromotions() {

    if (!db) {
        return;
    }


    try {

        const {
            data,
            error
        } = await db
            .from("promotions")
            .select("*")
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        promotions =
            data || [];


        console.log(
            `Cladytags Admin: ${promotions.length} promotions loaded.`
        );


        renderPromotions();

        updatePromotionStats();


    } catch (error) {

        console.error(
            "Promotions loading error:",
            error
        );

        promotions = [];

        renderPromotions();

        updatePromotionStats();


        showMessage(
            error.message ||
            "Could not load promotions.",
            "error"
        );

    }

}


/* =========================================================
   PROMOTION STATS
   ========================================================= */

function updatePromotionStats() {

    setText(
        "totalPromotions",
        promotions.length
    );


    setText(
        "activePromotions",
        promotions.filter(
            promotion =>
                promotion.active === true
        ).length
    );

}


/* =========================================================
   RENDER PROMOTIONS
   ========================================================= */

function renderPromotions() {

    const container =
        $("promotionsList");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!promotions.length) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No promotions yet
                </h3>

                <p>
                    Create your first promotion.
                </p>

            </div>

        `;

        return;
    }


    promotions.forEach(
        promotion => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "promotion-card";


            const mediaUrl =
                promotion.media_url ||
                (
                    Array.isArray(
                        promotion.media_urls
                    )
                        ? promotion.media_urls[0]
                        : ""
                );


            let mediaHTML =
                `<div class="promotion-no-media">
                    No Media
                </div>`;


            if (mediaUrl) {

                if (
                    promotion.media_type ===
                    "video"
                ) {

                    mediaHTML = `

                        <video
                            src="${escapeHtml(
                                mediaUrl
                            )}"
                            controls
                            muted
                            playsinline
                        ></video>

                    `;

                } else {

                    mediaHTML = `

                        <img
                            src="${escapeHtml(
                                mediaUrl
                            )}"
                            alt="${escapeHtml(
                                promotion.title
                            )}"
                        >

                    `;

                }

            }


            card.innerHTML = `

                <div class="promotion-media">

                    ${mediaHTML}

                </div>


                <div class="promotion-content">

                    <div class="promotion-top">

                        <span
                            class="${
                                promotion.active
                                    ? "promotion-active"
                                    : "promotion-inactive"
                            }"
                        >
                            ${
                                promotion.active
                                    ? "ACTIVE"
                                    : "INACTIVE"
                            }
                        </span>


                        ${
                            promotion.badge
                                ? `
                                    <span class="promotion-badge">
                                        ${escapeHtml(
                                            promotion.badge
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <h3>
                        ${escapeHtml(
                            promotion.title
                        )}
                    </h3>


                    <p>
                        ${escapeHtml(
                            promotion.message
                        )}
                    </p>


                    ${
                        promotion.button_text
                            ? `
                                <p>
                                    Button:
                                    <strong>
                                        ${escapeHtml(
                                            promotion.button_text
                                        )}
                                    </strong>
                                </p>
                              `
                            : ""
                    }


                    <div class="promotion-actions">

                        <button
                            type="button"
                            class="edit-promotion-btn"
                            data-id="${promotion.id}"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            class="toggle-promotion-btn"
                            data-id="${promotion.id}"
                        >
                            ${
                                promotion.active
                                    ? "Deactivate"
                                    : "Activate"
                            }
                        </button>


                        <button
                            type="button"
                            class="delete-promotion-btn"
                            data-id="${promotion.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    container
        .querySelectorAll(
            ".edit-promotion-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editPromotion(
                        button.dataset.id
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".toggle-promotion-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    togglePromotion(
                        button.dataset.id
                    );

                }
            );

        });


    container
        .querySelectorAll(
            ".delete-promotion-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deletePromotion(
                        button.dataset.id
                    );

                }
            );

        });

}


/* =========================================================
   ADD PROMOTION
   ========================================================= */

function openAddPromotion() {

    editingPromotionId =
        null;


    const form =
        $("promotionForm");

    if (form) {
        form.reset();
    }


    setValue(
        "promotionId",
        ""
    );


    setText(
        "promotionFormTitle",
        "Create Promotion"
    );


    const active =
        $("promotionActive");

    if (active) {
        active.checked = true;
    }


    const preview =
        $("promotionMediaPreview");

    if (preview) {
        preview.innerHTML = "";
    }


    const panel =
        $("promotionFormPanel");

    if (panel) {
        panel.style.display = "block";
    }

}


/* =========================================================
   EDIT PROMOTION
   ========================================================= */

function editPromotion(
    promotionId
) {

    const promotion =
        promotions.find(
            item =>
                String(item.id) ===
                String(promotionId)
        );


    if (!promotion) {

        showMessage(
            "Promotion not found.",
            "error"
        );

        return;
    }


    editingPromotionId =
        promotion.id;


    setValue(
        "promotionId",
        promotion.id
    );

    setValue(
        "promotionTitle",
        promotion.title
    );

    setValue(
        "promotionBadge",
        promotion.badge
    );

    setValue(
        "promotionMessage",
        promotion.message
    );

    setValue(
        "promotionButtonText",
        promotion.button_text
    );

    setValue(
        "promotionButtonLink",
        promotion.button_link
    );

    setValue(
        "promotionMediaType",
        promotion.media_type || "image"
    );


    const active =
        $("promotionActive");

    if (active) {

        active.checked =
            Boolean(
                promotion.active
            );

    }


    setDateInput(
        "promotionStart",
        promotion.start_at
    );

    setDateInput(
        "promotionEnd",
        promotion.end_at
    );


    showPromotionMedia(
        promotion
    );


    setText(
        "promotionFormTitle",
        "Edit Promotion"
    );


    const panel =
        $("promotionFormPanel");

    if (panel) {
        panel.style.display =
            "block";
    }

}


/* =========================================================
   PROMOTION DATE
   ========================================================= */

function setDateInput(
    id,
    value
) {

    const input =
        $(id);

    if (!input || !value) {
        return;
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return;
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    input.value =
        `${year}-${month}-${day}T${hours}:${minutes}`;

}


/* =========================================================
   SAVE PROMOTION
   ========================================================= */

async function savePromotion(
    event
) {

    event.preventDefault();


    if (!db) {

        showMessage(
            "Supabase is not connected.",
            "error"
        );

        return;
    }


    const title =
        $("promotionTitle")
            ?.value
            .trim();


    const badge =
        $("promotionBadge")
            ?.value
            .trim() || "";


    const message =
        $("promotionMessage")
            ?.value
            .trim() || "";


    const buttonText =
        $("promotionButtonText")
            ?.value
            .trim() || "";


    const buttonLink =
        $("promotionButtonLink")
            ?.value
            .trim() || "";


    const mediaType =
        $("promotionMediaType")
            ?.value ||
        "image";


    const active =
        $("promotionActive")
            ?.checked ??
        true;


    const startValue =
        $("promotionStart")
            ?.value ||
        "";


    const endValue =
        $("promotionEnd")
            ?.value ||
        "";


    if (!title) {

        showMessage(
            "Enter a promotion title.",
            "error"
        );

        return;
    }


    if (!message) {

        showMessage(
            "Enter a promotion message.",
            "error"
        );

        return;
    }


    const button =
        document.querySelector(
            "#promotionForm button[type='submit']"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            editingPromotionId
                ? "Saving..."
                : "Creating...";

    }


    try {

        const promotionData = {

            title,

            badge,

            message,

            button_text:
                buttonText,

            button_link:
                buttonLink,

            media_type:
                mediaType,

            active,

            start_at:
                startValue
                    ? new Date(
                        startValue
                    ).toISOString()
                    : null,

            end_at:
                endValue
                    ? new Date(
                        endValue
                    ).toISOString()
                    : null,

            updated_at:
                new Date().toISOString()

        };


        /* KEEP OLD MEDIA */

        if (editingPromotionId) {

            const existing =
                promotions.find(
                    item =>
                        String(item.id) ===
                        String(editingPromotionId)
                );


            if (existing) {

                if (
                    existing.media_url
                ) {

                    promotionData.media_url =
                        existing.media_url;

                }


                if (
                    Array.isArray(
                        existing.media_urls
                    )
                ) {

                    promotionData.media_urls =
                        existing.media_urls;

                }

            }

        }


        /* INSERT */

        if (!editingPromotionId) {

            const {
                error
            } = await db
                .from("promotions")
                .insert(
                    promotionData
                );


            if (error) {
                throw error;
            }


            showMessage(
                "Promotion created successfully."
            );

        }


        /* UPDATE */

        else {

            const {
                error
            } = await db
                .from("promotions")
                .update(
                    promotionData
                )
                .eq(
                    "id",
                    editingPromotionId
                );


            if (error) {
                throw error;
            }


            showMessage(
                "Promotion updated successfully."
            );

        }


        editingPromotionId =
            null;


        const form =
            $("promotionForm");

        if (form) {
            form.reset();
        }


        const panel =
            $("promotionFormPanel");

        if (panel) {
            panel.style.display =
                "none";
        }


        await loadPromotions();


    } catch (error) {

        console.error(
            "Promotion save error:",
            error
        );


        showMessage(
            error.message ||
            "Could not save promotion.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Save Promotion";

        }

    }

}


/* =========================================================
   ACTIVATE / DEACTIVATE PROMOTION
   ========================================================= */

async function togglePromotion(
    promotionId
) {

    const promotion =
        promotions.find(
            item =>
                String(item.id) ===
                String(promotionId)
        );


    if (!promotion) {
        return;
    }


    const newStatus =
        !Boolean(
            promotion.active
        );


    try {

        const {
            error
        } = await db
            .from("promotions")
            .update({

                active:
                    newStatus,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                promotionId
            );


        if (error) {
            throw error;
        }


        showMessage(
            newStatus
                ? "Promotion activated."
                : "Promotion deactivated."
        );


        await loadPromotions();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Could not change promotion status.",
            "error"
        );

    }

}


/* =========================================================
   DELETE PROMOTION
   ========================================================= */

async function deletePromotion(
    promotionId
) {

    const promotion =
        promotions.find(
            item =>
                String(item.id) ===
                String(promotionId)
        );


    if (!promotion) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${promotion.title}"?\n\nThis cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await db
            .from("promotions")
            .delete()
            .eq(
                "id",
                promotionId
            );


        if (error) {
            throw error;
        }


        showMessage(
            "Promotion deleted."
        );


        await loadPromotions();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Could not delete promotion.",
            "error"
        );

    }

}


/* =========================================================
   PROMOTION MEDIA PREVIEW
   ========================================================= */

function showPromotionMedia(
    promotion
) {

    const preview =
        $("promotionMediaPreview");


    if (!preview) {
        return;
    }


    const url =
        promotion.media_url ||
        (
            Array.isArray(
                promotion.media_urls
            )
                ? promotion.media_urls[0]
                : ""
        );


    if (!url) {

        preview.innerHTML = "";

        return;
    }


    if (
        promotion.media_type ===
        "video"
    ) {

        preview.innerHTML = `

            <video
                src="${escapeHtml(url)}"
                controls
                muted
                playsinline
                style="
                    width:100%;
                    max-height:250px;
                    object-fit:contain;
                    border-radius:12px;
                "
            ></video>

        `;

    } else {

        preview.innerHTML = `

            <img
                src="${escapeHtml(url)}"
                alt="Promotion"
                style="
                    width:100%;
                    max-height:250px;
                    object-fit:contain;
                    border-radius:12px;
                "
            >

        `;

    }

}


/* =========================================================
   PROMOTION FILE PREVIEW
   ========================================================= */

function setupPromotionMediaPreview() {

    const input =
        $("promotionMedia");


    const preview =
        $("promotionMediaPreview");


    if (!input || !preview) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            if (!file) {
                return;
            }


            const url =
                URL.createObjectURL(
                    file
                );


            if (
                file.type.startsWith(
                    "video/"
                )
            ) {

                preview.innerHTML = `

                    <video
                        src="${url}"
                        controls
                        muted
                        playsinline
                        style="
                            width:100%;
                            max-height:250px;
                            object-fit:contain;
                            border-radius:12px;
                        "
                    ></video>

                `;

            } else {

                preview.innerHTML = `

                    <img
                        src="${url}"
                        alt="Promotion preview"
                        style="
                            width:100%;
                            max-height:250px;
                            object-fit:contain;
                            border-radius:12px;
                        "
                    >

                `;

            }

        }
    );

}


/* =========================================================
   EVENT SETUP
   ========================================================= */

function setupAdminEvents() {


    /* LOGOUT */

    const logout =
        $("logoutBtn");

    if (logout) {

        logout.addEventListener(
            "click",
            logoutAdmin
        );

    }


    /* PRODUCT FORM */

    const productForm =
        $("productForm");

    if (productForm) {

        productForm.addEventListener(
            "submit",
            saveProduct
        );

    }


    /* ADD PRODUCT */

    const addProduct =
        $("addProductBtn");

    if (addProduct) {

        addProduct.addEventListener(
            "click",
            openAddProduct
        );

    }


    /* CANCEL PRODUCT */

    const cancelProduct =
        $("cancelProductBtn");

    if (cancelProduct) {

        cancelProduct.addEventListener(
            "click",
            () => {

                editingProductId =
                    null;

                const form =
                    $("productForm");

                if (form) {
                    form.reset();
                }

                const panel =
                    $("productFormPanel");

                if (panel) {
                    panel.style.display =
                        "none";
                }

            }
        );

    }


    /* PROMOTION FORM */

    const promotionForm =
        $("promotionForm");

    if (promotionForm) {

        promotionForm.addEventListener(
            "submit",
            savePromotion
        );

    }


    /* ADD PROMOTION */

    const addPromotion =
        $("addPromotionBtn");

    if (addPromotion) {

        addPromotion.addEventListener(
            "click",
            openAddPromotion
        );

    }


    /* CANCEL PROMOTION */

    const cancelPromotion =
        $("cancelPromotionBtn");

    if (cancelPromotion) {

        cancelPromotion.addEventListener(
            "click",
            () => {

                editingPromotionId =
                    null;

                const form =
                    $("promotionForm");

                if (form) {
                    form.reset();
                }

                const panel =
                    $("promotionFormPanel");

                if (panel) {
                    panel.style.display =
                        "none";
                }

            }
        );

    }


    setupPromotionMediaPreview();

    setupNavigation();

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    setText(
        "totalProducts",
        products.length
    );


    setText(
        "totalOrders",
        orders.length
    );


    setText(
        "totalPromotions",
        promotions.length
    );


    setText(
        "activePromotions",
        promotions.filter(
            promotion =>
                promotion.active === true
        ).length
    );

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Cladytags Admin starting..."
        );


        setupAdminEvents();


        showSection(
            "overviewSection"
        );


        await checkLogin();

    }
);

