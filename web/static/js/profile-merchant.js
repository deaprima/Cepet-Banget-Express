document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log("Debug - userData from localStorage:", userData);

    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('profile-name').textContent = userData.name;
    document.getElementById('profile-role').textContent = userData.role;
    document.getElementById('overview-name').textContent = userData.name;
    document.getElementById('overview-username').textContent = userData.username;
    document.getElementById('overview-email').textContent = userData.email;
    document.getElementById('overview-phone').textContent = userData.phone || '-';
    document.getElementById('overview-address').textContent = userData.address || '-';

    document.getElementById('edit-name').value = userData.name;
    document.getElementById('edit-username').value = userData.username;
    document.getElementById('edit-email').value = userData.email;
    document.getElementById('edit-phone').value = userData.phone || '';
    document.getElementById('edit-address').value = userData.address || '';

    document.getElementById('edit-profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        ['username', 'email', 'phone'].forEach(field => {
            document.getElementById(`edit-${field}`).classList.remove('is-invalid');
        });

        const profileData = {
            name: document.getElementById('edit-name').value,
            username: document.getElementById('edit-username').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            address: document.getElementById('edit-address').value
        };

        const changedFields = [];
        for (const [field, value] of Object.entries(profileData)) {
            if (value !== userData[field]) {
                changedFields.push(field);
            }
        }

        const userId = userData._id || userData.id;
        const response = await eel.update_profile(userId, profileData, changedFields)();
        
        if (response.status === 'success') {
            localStorage.setItem('userData', JSON.stringify(response.updated_data));
            await showSuccessMessage('Success', response.message);
            location.reload();
        } else {
            if (response.field) {
                const inputElement = document.getElementById(`edit-${response.field}`);
                const errorElement = document.getElementById(`${response.field}-error`);
                inputElement.classList.add('is-invalid');
                errorElement.textContent = response.message;
            } else {
                await showErrorMessage('Error', response.message);
            }
        }
    });

    document.getElementById('change-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            await showErrorMessage('Error', 'New passwords do not match');
            return;
        }

        const userId = userData._id || userData.id;
        const response = await eel.change_password(userId, currentPassword, newPassword)();
        if (response.status === 'success') {
            await showSuccessMessage('Success', response.message);
            document.getElementById('change-password-form').reset();
        } else {
            await showErrorMessage('Error', response.message);
        }
    });
});