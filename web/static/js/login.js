async function login(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await eel.login(username, password)();

        if (response.status === "success") {
            
            localStorage.setItem('userData', JSON.stringify({
                id: response._id,
                name: response.name,
                username: response.username,
                email: response.email,
                role: response.role,
                address: response.address,
                phone: response.phone
            }));
            console.log('Stored userData:', JSON.parse(localStorage.getItem('userData')));

            await showSuccessMessage('Login Berhasil!', `Selamat datang, ${response.name}`);

            if (response.role === "admin") {
                window.location.href = "adminDashboard.html";
            } else if (response.role === "merchant") {
                window.location.href = "merchantDashboard.html";
            }
        } else {
            document.getElementById("error-msg").style.display = "block";
        }
    } catch (error) {
        await showErrorMessage('Kesalahan Sistem', 'Terjadi kesalahan saat login. Silakan coba lagi.');
    }
}

const showPasswordCheckbox = document.querySelector('#showPassword');
const passwordInput = document.querySelector('#password');

showPasswordCheckbox.addEventListener('change', function () {
    if (this.checked) {
        passwordInput.setAttribute('type', 'text');
    } else {
        passwordInput.setAttribute('type', 'password');
    }
});