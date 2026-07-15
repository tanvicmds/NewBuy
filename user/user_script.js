const cartBtn = document.getElementById("cart-button");
cartBtn.addEventListener("click", () => {
    window.location.href = "./user_cart.html";
})
const wishlistBtn = document.getElementById("wishlist-button");
wishlistBtn.addEventListener("click", () => {
    window.location.href = "./user_wishlist.html";
})

async function cartProductsLoader() {
    const storedDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    const storedCart = storedDetails.user_cart;

    document.querySelector(".cart-products").innerHTML = "";

    await Promise.all(storedCart.map((product) => {
        const cartProductID = product[0];
        return fetch(`https://dummyjson.com/products/${cartProductID}`)
            .then(res => res.json())
            .then((data) => {
                const obj = {
                    id: data.id,
                    title: data.title,
                    price: data.price,
                    quantity: product[1],
                    total: data.price * product[1],
                    image: data.thumbnail
                }
                loadCartProducts(obj);
            });
    }));

    const checkboxes = document.querySelectorAll(".cart-product-checkbox");
    checkboxes.forEach((checkbox) => checkbox.addEventListener("click", handleCheckboxChange));

    document.getElementById("checkoutBtn").addEventListener("click", handleCheckout);

    attachQuantityListeners();
}

function loadCartProducts(obj) {
    const cartProduct = document.createElement("div");
    cartProduct.className = "cart-product";
    const total = obj.price * obj.quantity;

    const minusOrTrash = obj.quantity === 1 ? '<i class="fa-solid fa-trash"></i>' : '-';

    cartProduct.innerHTML = `
    <div class="cart-product-checkbox">
        <input type="checkbox" name="cart-product-checkbox" class="cart-product-checkbox" data-product-id="${obj.id}">
    </div>
    <div class="cart-product-image"><img src="${obj.image}" alt="${obj.title}"></div>
    <div class="cart-product-details">
        <p class="cart-product-id" data-cart-product-id="${obj.id}">Product ID:${obj.id}</p>
        <p class="cart-product-title">${obj.title}</p>
        <p class="cart-product-price">$${obj.price}</p>
        <p class="cart-product-quantity">
            <button class="decrement-quantity" data-product-id="${obj.id}">${minusOrTrash}</button>
            <span class="qty-value">${obj.quantity}</span>
            <button class="increment-quantity" data-product-id="${obj.id}">+</button>
        </p>
        <p class="cart-product-total" data-product-id="${obj.id}">$${total.toFixed(2)}</p>
    </div>`

    document.querySelector(".cart-products").appendChild(cartProduct);
}

function attachQuantityListeners() {
    const updateSessionStorage = (productId, newQuantity) => {
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
        if (newQuantity === 0) {
            userDetails.user_cart = userDetails.user_cart.filter(item => item[0] !== productId);
        } else {
            const item = userDetails.user_cart.find(item => item[0] === productId);
            if (item) item[1] = newQuantity;
        }
        sessionStorage.setItem("userDetails", JSON.stringify(userDetails));
        updateCartBadge();
        handleCheckboxChange();
    };

    document.querySelectorAll(".increment-quantity").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const productId = parseInt(e.target.dataset.productId);
            const qtySpan = e.target.previousElementSibling;
            const decBtn = qtySpan.previousElementSibling;
            const price = parseFloat(e.target.closest('.cart-product-details').querySelector('.cart-product-price').textContent.replace('$', ''));
            const totalEl = e.target.closest('.cart-product-details').querySelector('.cart-product-total');

            let qty = parseInt(qtySpan.textContent) + 1;
            qtySpan.textContent = qty;
            totalEl.textContent = "$" + (price * qty).toFixed(2);
            decBtn.innerHTML = "-";

            updateSessionStorage(productId, qty);
        });
    });

    document.querySelectorAll(".decrement-quantity").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.currentTarget;
            const productId = parseInt(button.dataset.productId);
            const qtySpan = button.nextElementSibling;
            const price = parseFloat(button.closest('.cart-product-details').querySelector('.cart-product-price').textContent.replace('$', ''));
            const totalEl = button.closest('.cart-product-details').querySelector('.cart-product-total');
            const cartProductDiv = button.closest('.cart-product');

            let qty = parseInt(qtySpan.textContent);

            if (qty === 1) {
                cartProductDiv.remove();
                updateSessionStorage(productId, 0);
            } else {
                qty -= 1;
                qtySpan.textContent = qty;
                totalEl.textContent = "$" + (price * qty).toFixed(2);

                if (qty === 1) button.innerHTML = '<i class="fa-solid fa-trash"></i>';
                updateSessionStorage(productId, qty);
            }
        });
    });
}


function handleCheckout() {

}

function handleCheckboxChange() {
    const checkedBoxes = document.querySelectorAll(".cart-product-checkbox:checked");
    const totalText = document.getElementById("checkout-total");
    let sum = 0;
    checkedBoxes.forEach((checkedbox) => {
        let productId = checkedbox.dataset.productId;
        let x = document.querySelector(`.cart-product-total[data-product-id="${productId}"]`);
        if (x) sum += Number(x.textContent.replace("$", ""));
    })
    totalText.innerHTML = "$" + String(sum.toFixed(2));
}

async function wishlistProductsLoader() {
    const wishlistArea = document.querySelector(".wishlist-products");
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
    const wishlistedProducts = userDetails.user_wishlist;

    wishlistArea.innerHTML = "";

    await Promise.all(wishlistedProducts.map((productID) => {
        return fetch(`https://dummyjson.com/products/${productID}`)
            .then(res => res.json())
            .then((product) => {
                const originalPrice = (product.price / (1 - (product.discountPercentage / 100))).toFixed(2);

                const cardHTML = `
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
                    <div class="product-actions">
                        <button type="button" class="product-cart-button" data-product-id="${product.id}">Add to Cart</button>
                        <button type="button" class="product-wishlist-button wishlisted" data-product-id="${product.id}">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>`;
                wishlistArea.innerHTML += cardHTML;
            });
    }));

    document.querySelectorAll(".product-cart-button").forEach((button) => {
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
        });
    });

    document.querySelectorAll(".product-wishlist-button").forEach((button) => {
        button.addEventListener("click", () => {
            const productId = parseInt(button.dataset.productId);
            const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

            userDetails.user_wishlist = userDetails.user_wishlist.filter(id => id !== productId);
            sessionStorage.setItem("userDetails", JSON.stringify(userDetails));

            button.closest(".product-card").remove();
        });
    });
}


function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (badge) {
        const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
        const totalQty = userDetails.user_cart.reduce((sum, item) => sum + item[1], 0);
        badge.textContent = totalQty;
    }
}


if (document.querySelector(".cart-products")) {
    cartProductsLoader();
}

if (document.querySelector(".wishlist-products")) {
    wishlistProductsLoader();
}

function initHeader() {
    const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));

    const greeting = document.querySelector(".account-right-top p");
    greeting.textContent = `Hi ${userDetails.firstName}!`;

    const profileImage = document.querySelector(".account-right-top img");
    profileImage.src = userDetails.image;

    const wishlistBtn = document.getElementById("wishlist-button");
    if (wishlistBtn) {
        wishlistBtn.addEventListener("click", () => {
            window.location.href = "./user_wishlist.html";
        });
    }

    document.getElementById("log-out-button").addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "../index.html";
    });

    updateCartBadge();

}

initHeader();
