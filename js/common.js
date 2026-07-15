function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function loadCategories() {
    const visible_categories = window.innerWidth <= 1000 ? 2 : 8;
    fetch('https://dummyjson.com/products/categories')
        .then(res => res.json())
        .then(data => {
            const visibleContainer = document.querySelector(".visible-categories");
            const dropdownContainer = document.querySelector(".more-categories-dropdown");
            const categoryDropdown = document.querySelector(".category-dropdown");
            data.forEach((category, index) => {
                const categoryDiv = `<div class="category-navbar" id="${category.slug}" data-category-url="${category.url}"><a href="#">${category.name}</a></div>`;

                if (index < visible_categories) {
                    visibleContainer.innerHTML += categoryDiv;
                } else {
                    dropdownContainer.innerHTML += categoryDiv;
                }

                categoryDropdown.innerHTML += `<option value="${category.slug}" data-category-url="${category.url}">${category.name}</option>`;
            });

            document.querySelector(".more-categories-btn").addEventListener("click", () => {
                dropdownContainer.classList.toggle("show");
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest(".more-categories-wrapper")) {
                    dropdownContainer.classList.remove("show");
                }
            });

            categoryLoading();
        });
}


function categoryLoading() {
    document.getElementById("all").classList.add("active");

    document.querySelectorAll(".category-navbar").forEach(cat => {
        cat.querySelector("a").addEventListener("click", () => {
            document.querySelectorAll(".category-navbar").forEach(c => c.classList.remove("active"));
            cat.classList.add("active");

            if (cat.id === "all") {
                loadProducts("");
            } else {
                fetch(cat.dataset.categoryUrl)
                    .then(res => res.json())
                    .then(data => renderProducts(data));
            }
        });
    });
}

function renderProducts(data) {
    const productGrid = document.querySelector(".products-grid");
    productGrid.innerHTML = "";
    const flatUpdatedData = JSON.parse(localStorage.getItem("NewBuyUpdatedData")).flat();
    data.products.forEach((item) => {
        const product = {};
        if (flatUpdatedData.includes(item.id)) {
            let idx = flatUpdatedData.indexOf(item.id);
            Object.assign(product, flatUpdatedData[idx + 1]);

        } else {
            Object.assign(product, item);
        }
        const originalPrice = (product.price / (1 - (product.discountPercentage / 100))).toFixed(2);
        const txtBase = `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
                    <div class="product-badge"><i class="fa-solid fa-star rating-star"></i> ${product.rating}</div>
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${product.title}">${product.title}</h3>
                    <p class="product-desc" title="${product.description}">${product.description}</p>
                    <div class="product-price-row">
                        <span class="product-price">$${product.price}</span>
                        <span class="product-original-price">$${originalPrice}</span>
                        <span class="product-discount">${product.discountPercentage}% OFF</span>
                    </div>
                </div>
                <div class="product-actions">`;

        let cardHTML = "";
        if (role == "user") {
            const isWishlisted = JSON.parse(sessionStorage.getItem("userDetails")).user_wishlist.includes(product.id) ? " wishlisted" : "";
            cardHTML = txtBase + `
                    <button type="button" class="product-cart-button" data-product-id="${product.id}">
                        <i class="fa-solid fa-cart-shopping cart-btn-icon"></i>
                        <span class="cart-btn-text">Add to Cart</span>
                    </button>
                    <button type="button" class="product-wishlist-button${isWishlisted}" data-product-id="${product.id}">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
            </div>`;
        } else {
            cardHTML = txtBase + `
                    <button type="button" class="product-edit-button" data-product-id="${product.id}">
                        <i class="fa-solid fa-pencil"></i> Edit Product
                    </button>
                </div>
            </div>`;
        }
        productGrid.innerHTML += cardHTML;
    })
    const cartButtons = document.querySelectorAll(".product-cart-button");
    cartButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const productId = parseInt(button.dataset.productId);
            const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
            const existingItem = userDetails.user_cart.find(item => item[0] === productId);

            if (existingItem) {
                existingItem[1] += 1;
            } else {
                userDetails.user_cart.push([productId, 1]);
            }

            sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
            updateCartBadge();
            showToast("Added to Cart!");
        })
    })

    const wishlistButtons = document.querySelectorAll(".product-wishlist-button");
    wishlistButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const productId = parseInt(button.dataset.productId);
            const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
            const userWishlist = userDetails.user_wishlist;
            if (userWishlist.includes(productId)) {
                userDetails.user_wishlist.splice(userWishlist.indexOf(productId), 1);
                button.classList.remove("wishlisted");
            } else {
                userDetails.user_wishlist.push(productId);
                button.classList.add("wishlisted");
            }
            sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
        })
    })
    const editButtons = document.querySelectorAll(".product-edit-button");
    editButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const productId = parseInt(button.dataset.productId);
            const flatUpdatedData = JSON.parse(localStorage.getItem("NewBuyUpdatedData")).flat();
            const localIdx = flatUpdatedData.indexOf(productId);
            if (localIdx !== -1) {
                openEditModal(flatUpdatedData[localIdx + 1]);
            } else {
                fetch(`https://dummyjson.com/products/${productId}`)
                    .then(res => res.json())
                    .then(product => {
                        openEditModal(product);
                    });
            }

        })
    })

    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach((card) => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("button")) return;
            const productId = parseInt(card.dataset.productId);
            openProductDetailsModal(productId);
        });
    });
}

function openProductDetailsModal(productId) {
    fetch(`https://dummyjson.com/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            renderProductDetailsModal(product);
        });
}

function renderProductDetailsModal(product) {
    const originalPrice = (product.price / (1 - (product.discountPercentage / 100))).toFixed(2);
    let reviewsHTML = "";
    if (product.reviews && product.reviews.length > 0) {
        reviewsHTML = product.reviews.map(review => {
            let stars = '';
            for (let i = 0; i < 5; i++) {
                if (i < review.rating) {
                    stars += '<i class="fa-solid fa-star" style="color: #fbbc04;"></i>';
                } else {
                    stars += '<i class="fa-regular fa-star" style="color: #fbbc04;"></i>';
                }
            }

            return `
            <div class="modal-review-card">
                <div class="modal-review-header">
                    <img src="https://ui-avatars.com/api/?name=${review.reviewerName.replace(' ', '+')}&background=e2e8f0&color=475569&rounded=true" alt="${review.reviewerName}" class="reviewer-avatar">
                    <div class="reviewer-info">
                        <div class="reviewer-name-row">
                            <span class="reviewer-name">${review.reviewerName}</span>
                            <button class="review-options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                        </div>
                        <span class="reviewer-meta">Verified Buyer &middot; ${review.reviewerEmail}</span>
                    </div>
                </div>
                <div class="review-rating-row">
                    <span class="review-stars">${stars}</span>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
            </div>
            `;
        }).join('');
    } else {
        reviewsHTML = "<p>No reviews available.</p>";
    }

    let buttonsHTML = "";
    if (role == "user") {
        const isWishlisted = JSON.parse(sessionStorage.getItem("userDetails")).user_wishlist.includes(product.id) ? " wishlisted" : "";
        buttonsHTML = `
            <button type="button" class="product-cart-button modal-btn" data-product-id="${product.id}">Add to Cart</button>
            <button type="button" class="product-wishlist-button modal-btn${isWishlisted}" data-product-id="${product.id}">
                <i class="fa-solid fa-heart"></i>
            </button>
        `;
    } else {
        buttonsHTML = `
            <button type="button" class="product-edit-button modal-btn" data-product-id="${product.id}">
                <i class="fa-solid fa-pencil"></i> Edit Product
            </button>
        `;
    }

    let txt = `
             <div class="product-details-modal">
                <button type="button" id="close-details-modal"><i class="fa-solid fa-xmark"></i></button>
                <div class="modal-content detailed-modal">
                    <div class="detailed-layout">
                        <div class="detailed-left">
                            <img src="${product.thumbnail || product.images[0]}" alt="${product.title}" class="detailed-image">
                        </div>
                        <div class="detailed-right">
                            <h2 class="detailed-title">${product.title}</h2>
                            <p class="detailed-description">${product.description}</p>
                            <div class="detailed-meta-info" style="margin-bottom: 25px; color: #4b5563; font-size: 14px;">
                                <p style="margin-bottom: 5px;"><strong>Brand:</strong> ${product.brand || "Generic"}</p>
                                <p><strong>Rating:</strong> ${product.rating} <i class="fa-solid fa-star" style="color: #fbbc04;"></i></p>
                            </div>
                            <div class="detailed-price-row">
                                <span class="price">$${product.price}</span>
                                <span class="original-price">$${originalPrice}</span>
                                <span class="discount" style="font-size: 14px; font-weight: 600; color: #10b981; background: #dcfce7; padding: 4px 8px; border-radius: 4px; margin-left: 5px;">${product.discountPercentage}% OFF</span>
                            </div>
                            <div class="detailed-actions">
                                ${buttonsHTML}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detailed-reviews-section">
                        <h3>Customer Reviews</h3>
                        <div class="detailed-reviews-list">
                            ${reviewsHTML}
                        </div>
                    </div>
                </div>
            </div>`;

    const modalForm = document.createElement("div");
    modalForm.className = "modal-overlay details-overlay";
    modalForm.innerHTML = txt;
    document.body.appendChild(modalForm);
    document.body.style.overflow = "hidden";

    document.getElementById("close-details-modal").addEventListener("click", () => {
        modalForm.remove();
        document.body.style.overflow = "auto";
    });

    modalForm.addEventListener("click", (e) => {
        if (e.target === modalForm) {
            modalForm.remove();
            document.body.style.overflow = "auto";
        }
    });

    if (role == "user") {
        const cartBtn = modalForm.querySelector(".product-cart-button");
        if (cartBtn) {
            cartBtn.addEventListener("click", () => {
                const productId = parseInt(cartBtn.dataset.productId);
                const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
                const existingItem = userDetails.user_cart.find(item => item[0] === productId);
                if (existingItem) {
                    existingItem[1] += 1;
                } else {
                    userDetails.user_cart.push([productId, 1]);
                }
                sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
                updateCartBadge();
                showToast("Added to Cart!");
            });
        }

        const wishBtn = modalForm.querySelector(".product-wishlist-button");
        if (wishBtn) {
            wishBtn.addEventListener("click", () => {
                const productId = parseInt(wishBtn.dataset.productId);
                const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
                const userWishlist = userDetails.user_wishlist;
                if (userWishlist.includes(productId)) {
                    userDetails.user_wishlist.splice(userWishlist.indexOf(productId), 1);
                    wishBtn.classList.remove("wishlisted");
                    const mainWishBtn = document.querySelector(`.product-card[data-product-id="${productId}"] .product-wishlist-button`);
                    if (mainWishBtn) mainWishBtn.classList.remove("wishlisted");
                } else {
                    userDetails.user_wishlist.push(productId);
                    wishBtn.classList.add("wishlisted");
                    const mainWishBtn = document.querySelector(`.product-card[data-product-id="${productId}"] .product-wishlist-button`);
                    if (mainWishBtn) mainWishBtn.classList.add("wishlisted");
                }
                sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
            });
        }
    } else {
        const editBtn = modalForm.querySelector(".product-edit-button");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                const productId = parseInt(editBtn.dataset.productId);
                const flatUpdatedData = JSON.parse(localStorage.getItem("NewBuyUpdatedData") || "[]").flat();
                const localIdx = flatUpdatedData.indexOf(productId);
                modalForm.remove();
                document.body.style.overflow = "auto";
                if (localIdx !== -1) {
                    openEditModal(flatUpdatedData[localIdx + 1]);
                } else {
                    fetch(`https://dummyjson.com/products/${productId}`)
                        .then(res => res.json())
                        .then(prod => {
                            openEditModal(prod);
                        });
                }
            });
        }
    }
}

function openEditModal(product) {
    const originalPrice = (product.price / (1 - (product.discountPercentage / 100))).toFixed(2);
    let txt = `
             <div class="product-edit-modal">
                        <div class="modal-content">
                            <form>
                                <label for="edit-title">Title</label>
                                <input type="text" id="edit-title" value="${product.title}">
                                <label for="edit-description">Description</label>
                                <textarea id="edit-description">${product.description}</textarea>
                                <label for="edit-price">Original Price ($)</label>
                                <input type="text" id="edit-price" value="${originalPrice}">
                                <label for="edit-discountPercentage">Discount Percentage (%)</label>
                                <input type="text" id="edit-discountPercentage" value="${product.discountPercentage}">
                                <p id="new-price">Effective Price: <span id="new-price-value">$${product.price}</span></p>
                                <label for="edit-rating">Rating</label>
                                <input type="text" id="edit-rating" value="${product.rating}">
                                <div class="modal-buttons">
                                    <button type="button" id="edit-save-button" data-product-id="${product.id}">Save</button>
                                    <button type="button" id="edit-cancel-button">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>`;
    const modalForm = document.createElement("div");
    modalForm.className = "modal-overlay";
    modalForm.innerHTML = txt;
    document.body.appendChild(modalForm);
    document.getElementById("edit-price").addEventListener("input", () => {
        document.getElementById("new-price-value").textContent = "$" + String((parseFloat(document.getElementById("edit-price").value) * (1 - (parseFloat(document.getElementById("edit-discountPercentage").value) / 100))).toFixed(2));
    })
    document.getElementById("edit-discountPercentage").addEventListener("input", () => {
        document.getElementById("new-price-value").textContent = "$" + String((parseFloat(document.getElementById("edit-price").value) * (1 - (parseFloat(document.getElementById("edit-discountPercentage").value) / 100))).toFixed(2));
    })
    document.getElementById("edit-save-button").addEventListener("click", (e) => {
        const obj = {
            ...product,
            id: document.getElementById("edit-save-button").dataset.productId,
            title: document.getElementById("edit-title").value,
            description: document.getElementById("edit-description").value,
            price: parseFloat(document.getElementById("new-price-value").textContent.replace("$", "")),
            discountPercentage: parseFloat(document.getElementById("edit-discountPercentage").value),
            rating: parseFloat(document.getElementById("edit-rating").value)
        }
        handleAdminUpdate(obj);
    });
    document.getElementById("edit-cancel-button").addEventListener("click", () => {
        document.querySelector(".product-edit-modal").parentElement.remove();
    })
}

function loadProducts(searchQuery = "", page = 1, limit = 15, skip = 0) {
    if (searchQuery) {
        document.querySelectorAll(".category-navbar").forEach(c => c.classList.remove("active"));
        document.getElementById("all").classList.add("active");
    }
    currentPage = page;
    document.querySelector(".nextPage").disabled = false;
    document.querySelector(".prevPage").disabled = false;
    skip = (page - 1) * limit;
    const url = searchQuery
        ? `https://dummyjson.com/products/search?q=${searchQuery}&limit=${limit}&skip=${skip}`
        : `https://dummyjson.com/products?limit=${limit}&skip=${skip}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            totalPages = Math.ceil(data.total / limit);
            renderProducts(data);
        }).then(() => {
            updatePaginationInfo(currentPage, totalPages);
        })
}

function handleAdminUpdate(obj) {
    fetch(`https://dummyjson.com/products/${obj.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(obj)
    }).then(res => res.json())
        .then(data => {
            const arr = [parseInt(obj.id), data];
            const updatedData = JSON.parse(localStorage.getItem("NewBuyUpdatedData"));
            const existingIdx = updatedData.findIndex(entry => entry[0] === parseInt(obj.id));
            if (existingIdx !== -1) {
                updatedData.splice(existingIdx, 1);
            }
            updatedData.push(arr);
            localStorage.setItem("NewBuyUpdatedData", JSON.stringify(updatedData));
            document.querySelector(".product-edit-modal").parentElement.remove();
            loadProducts("");
            showToast("Product saved!");
        })

}

function updatePaginationInfo(currentPage, totalPages) {
    const pageInfo = document.querySelector(".pageInfo");
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    document.querySelector(".prevPage").disabled = (currentPage <= 1);
    document.querySelector(".nextPage").disabled = (currentPage >= totalPages);
}

function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (badge) {
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
        const totalQty = userDetails.user_cart.reduce((sum, item) => sum + item[1], 0);
        badge.textContent = totalQty;
    }
}


let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = "";
if (!localStorage.getItem("NewBuyUpdatedData")) {
    localStorage.setItem("NewBuyUpdatedData", "[]");
}

const debouncedSearch = debounce(() => {
    currentSearchQuery = document.getElementById("search").value;
    loadProducts(currentSearchQuery, 1);
}, 500);
const role = sessionStorage.getItem("role");
if (role == "user") {
    const accountArea = document.querySelector(".accountArea");
    const txt = `
        <div class="wishlist-button">
                <button id=wishlist-button><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="cart-button-wrapper">
                <button id="cart-button"><i class="fa-solid fa-cart-shopping"></i></button>
                <span class="cart-badge" id="cart-badge">0</span>
            </div>`
    accountArea.insertAdjacentHTML("afterbegin", txt);
    const wishlistBtn = document.getElementById("wishlist-button");
    wishlistBtn.addEventListener("click", () => {
        window.location.href = "/user/user_wishlist.html";
    })
    const cartBtn = document.getElementById("cart-button");
    cartBtn.addEventListener("click", () => {
        window.location.href = "/user/user_cart.html";
    })
    updateCartBadge();
} else {
    const uppernavbar = document.querySelector("body");
    const path = window.location.pathname;
    const isDashboard = path.includes("adminPage.html") ? 'class="active"' : '';
    const isInventory = path.includes("products.html") ? 'class="active"' : '';
    const isUsers = path.includes("admin_users.html") ? 'class="active"' : '';

    const txt = `<section class="admin-upper-navbar">
        <a href="./admin/adminPage.html" ${isDashboard}>Dashboard</a>
        <a href="./products.html" ${isInventory}>Inventory</a>
        <a href="./admin/admin_users.html" ${isUsers}>Users</a>
    </section>`
    uppernavbar.insertAdjacentHTML("afterbegin", txt);

}

document.querySelector(".prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        loadProducts(currentSearchQuery, currentPage - 1);
    }
});
document.querySelector(".nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
        loadProducts(currentSearchQuery, currentPage + 1);
    }
});
document.getElementById("searchBar-btn").addEventListener("click", () => {
    currentSearchQuery = document.getElementById("search").value;
    loadProducts(currentSearchQuery, 1);
});
document.getElementById("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("searchBar-btn").click();
    }
});
document.getElementById("search").addEventListener("input", debouncedSearch);



loadCategories();
loadProducts("");
const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
const greeting = document.querySelector(".account-right-top p");
greeting.textContent = `Hello ${userDetails.firstName}!`;
const profileImage = document.querySelector(".account-right-top img");
profileImage.src = userDetails.image;
const logoutBtn = document.getElementById("log-out-button");
logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "./index.html";
});

function showToast(message) {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> <span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}



