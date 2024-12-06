document.addEventListener('DOMContentLoaded', function () {
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (userData) {
        document.getElementById('sender-name').value = userData.name || '';
        document.getElementById('sender-phone').value = userData.phone || '';
        document.getElementById('pickup-address').value = userData.address || '';
    } else {
        console.error("User data not found in localStorage.");
    }
});

document.getElementById('pickup-request-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const userData = JSON.parse(localStorage.getItem('userData'));

    const pickupData = {
        sender: {
            name: userData.name,
            phone: userData.phone,
            address: userData.address
        },
        recipient: {
            name: document.getElementById('recipient-name').value,
            phone: document.getElementById('recipient-phone').value,
            address: document.getElementById('delivery-address').value
        },
        package: {
            weight: parseFloat(document.getElementById('weight').value),
            dimensions: {
                length: parseFloat(document.getElementById('length').value),
                width: parseFloat(document.getElementById('width').value),
                height: parseFloat(document.getElementById('height').value)
            }
        },
        pickup_date: document.getElementById('pickup-date').value,
        pickup_time: document.getElementById('pickup-time').value,
        package_details: document.getElementById('package-details').value,
        notes: document.getElementById('notes').value,
        status: "pending" 
    };

    try {
        const result = await eel.submit_pickup_request(pickupData)();
        if(result.success) {
            await showSuccessMessage('Success', 'Pickup request submitted successfully');
            window.location.href = 'requestPickup.html';
        } else {
            await showErrorMessage('Error', result.error);
        }
    } catch (error) {
        await showErrorMessage('Error', result.error);
    }
});

