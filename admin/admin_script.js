function loadUsers() {
    fetch('https://dummyjson.com/users')
        .then(res => res.json())
        .then(data => {
            let str = ""
            for (let user of data.users) {
                str +=
                    `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.firstName + " " + user.lastName}</td>
                        <td>${user.email}</td>
                        <td>${user.phone}</td>
                        <td>${user.username}</td>
                        <td class="user-status">Active</td>
                        <td><button class="block-btn" data-user-id="${user.id}">Block</button></td>
                    </tr>
                `
            }
            document.querySelector(".users-table table").innerHTML += str;
            document.querySelector(".users-table table").addEventListener("click", (e) => {
                if (e.target.classList.contains("block-btn")) {
                    const btn = e.target;
                    const row = btn.closest("tr");
                    const statusCell = row.querySelector(".user-status");

                    if (btn.textContent === "Block") {
                        btn.textContent = "Unblock";
                        statusCell.textContent = "Blocked";
                    } else {
                        btn.textContent = "Block";
                        statusCell.textContent = "Active";
                    }
                }
            });


        })
}

if (document.querySelector(".users-table")) {
    loadUsers();
}

const userDetails = JSON.parse(sessionStorage.getItem("userDetails"));
if (userDetails) {
    const greeting = document.querySelector(".account-right-top p");
    if (greeting) greeting.textContent = `Hello ${userDetails.firstName}!`;
    const profileImage = document.querySelector(".account-right-top img");
    if (profileImage) profileImage.src = userDetails.image;
    const logoutBtn = document.getElementById("log-out-button");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "../index.html";
        });
    }
}