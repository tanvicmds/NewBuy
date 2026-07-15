function loadUsers(str) {
    let username = document.getElementById(`${str}-username`).value;
    let password = document.getElementById(`${str}-password`).value;

    fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: password,
            expiresInMins: 30,
        }),
        credentials: "include"
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("");
            }
            return res.json();
        })
        .then(data => {
            // const user_access_token = data.accessToken;
            if (str == "user") {
                sessionStorage.setItem("role", "user");
            } else {
                sessionStorage.setItem("role", "admin");
            }
            fetch(`https://dummyjson.com/carts/user/${data.id}`)
                .then(cartRes => cartRes.json())
                .then(cartData => {
                    let apiCart = [];
                    if (cartData.carts && cartData.carts.length > 0) {
                        apiCart = cartData.carts[0].products.map(p => [p.id, p.quantity]);
                    }
                    const obj = {
                        id: data.id,
                        username: data.username,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        image: data.image,
                        user_cart: apiCart,
                        user_wishlist: []
                    }
                    sessionStorage.setItem("userDetails", JSON.stringify(obj));
                    window.location.href = "./products.html";
                })
        })
        .catch(err => {
            const btn = document.getElementById(`${str}-login-submitBtn`);
            const uInput = document.getElementById(`${str}-username`);
            const pInput = document.getElementById(`${str}-password`);
            let errText = "";
            if (uInput.value == "" && pInput.value == "") {
                errText = "Enter your credentials to log in";
                uInput.classList.add('wrong');
                pInput.classList.add('wrong');
            }
            else if (uInput.value !== "" && pInput.value !== "") {
                errText = "Invalid credentials";
                uInput.classList.add('wrong');
                pInput.classList.add('wrong');
            }
            else if (uInput.value == "" && pInput.value !== "") {
                errText = "Enter your username to log in";
                uInput.classList.add('wrong');
            }
            else if (uInput.value !== "" && pInput.value == "") {
                errText = "Enter your password to log in";
                pInput.classList.add('wrong');
            }
            if (!document.getElementById(`err-${str}`)) {
                btn.insertAdjacentHTML('beforebegin', `<p id="err-${str}">${errText}</p>`);
            } else {
                document.getElementById(`err-${str}`).innerText = errText;
            }
            uInput.addEventListener('input', () => {
                if (uInput.classList.contains('wrong')) {
                    uInput.classList.remove('wrong');
                }
            });
            pInput.addEventListener('input', () => {
                if (pInput.classList.contains('wrong')) {
                    pInput.classList.remove('wrong');
                }
            });
        });
}

if (document.getElementById("user-login-submitBtn")) {
    const userLoginButton = document.getElementById("user-login-submitBtn");
    userLoginButton.addEventListener("click", () => {
        loadUsers("user");
    })
}

if (document.getElementById("admin-login-submitBtn")) {
    const adminLoginButton = document.getElementById("admin-login-submitBtn");
    adminLoginButton.addEventListener("click", () => {
        loadUsers("admin");
    })
}

window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        document.querySelectorAll("form").forEach(form => form.reset());
    }
});

document.querySelector(".customer-icon").addEventListener("click", () => {
    if (!document.querySelector(".customer-icon").classList.contains("opened")) {
        document.querySelector(".customer-icon").classList.add("opened");
        document.querySelector(".admin-icon").classList.remove("opened");
        document.querySelector(".login-user").classList.remove("hidden");
        document.querySelector(".login-admin").classList.add("hidden");
    }
})

document.querySelector(".admin-icon").addEventListener("click", () => {
    if (!document.querySelector(".admin-icon").classList.contains("opened")) {
        document.querySelector(".admin-icon").classList.add("opened");
        document.querySelector(".customer-icon").classList.remove("opened");
        document.querySelector(".login-admin").classList.remove("hidden");
        document.querySelector(".login-user").classList.add("hidden");
    }
})
