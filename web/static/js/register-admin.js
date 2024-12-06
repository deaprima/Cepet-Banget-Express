document.querySelector("form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("yourName").value;
    const email = document.getElementById("yourEmail").value;
    const username = document.getElementById("yourUsername").value;
    const password = document.getElementById("yourPassword").value;

    document.getElementById("email-error-msg").style.display = "none";
    document.getElementById("username-error-msg").style.display = "none";

    try {
        const response = await eel.register(name, username, email, password, "admin")();
        
        if (response.status === "success") {
            await showSuccessMessage('Registrasi Berhasil!', response.message);

            window.location.href = "adminDashboard.html";
        } else {
            if (response.message.includes("Email")) {
                document.getElementById("email-error-msg").style.display = "block";
            } else if (response.message.includes("Username")) {
                document.getElementById("username-error-msg").style.display = "block";
            }
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred during registration. Please try again.");
    }
});