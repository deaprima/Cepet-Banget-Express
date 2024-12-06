let merchantTable;
let pickupTable;

async function loadMerchantData() {
    const merchants = await eel.get_merchant_details()();
    const tableBody = document.getElementById('merchantTableBody');
    
    if (merchantTable) {
        merchantTable.destroy();
    }
    
    tableBody.innerHTML = '';
    
    merchants.forEach(merchant => {
        const row = `
            <tr>
                <td>${merchant._id}</td>
                <td>${merchant.name}</td>
                <td>${merchant.email}</td>
                <td>${merchant.phone || '-'}</td>
                <td>${merchant.address || '-'}</td>
                <td><span class="badge bg-success">Active</span></td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    merchantTable = $('#merchantTableBody').closest('.table').DataTable({
        responsive: true,
        paging: true,
        searching: true,
        ordering: true,
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/Indonesian.json"
        }
    });
}

async function loadPickupRequests() {
    const pickups = await eel.get_pickup_requests()();
    const tableBody = document.getElementById('pickupTableBody');
    
    if (pickupTable) {
        pickupTable.destroy();
    }
    
    tableBody.innerHTML = '';
    
    pickups.forEach(pickup => {
        const row = `
            <tr>
                <td>${pickup.request_id}</td>
                <td>${pickup.sender.name}</td>
                <td>${pickup.pickup_date} ${pickup.pickup_time}</td>
                <td>${pickup.sender.address}</td>
                <td><span class="badge bg-${getStatusColor(pickup.status)}">${pickup.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="showDetails('${pickup.request_id}')">
                        <i class="bi bi-info-circle"></i> Detail
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editStatus('${pickup.request_id}', '${pickup.status}')">
                        <i class="bi bi-pencil"></i> Status
                    </button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    pickupTable = $('#pickupTableBody').closest('.table').DataTable({
        responsive: true,
        paging: true,
        searching: true,
        ordering: true,
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/Indonesian.json"
        }
    });
}

async function editStatus(requestId, currentStatus) {
    const result = await Swal.fire({
        title: 'Update Status',
        input: 'select',
        inputOptions: {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'completed': 'Completed', 
            'cancelled': 'Cancelled'
        },
        inputValue: currentStatus,
        showCancelButton: true,
        confirmButtonColor: '#003366',
        cancelButtonColor: '#FD7702'
    });

    if (result.isConfirmed) {
        const response = await eel.update_pickup_status(requestId, result.value)();
        
        if (response.status === 'success') {
            await showSuccessMessage('Success', 'Status updated successfully');
            await loadPickupRequests();
        } else {
            await showErrorMessage('Error', response.message);
        }
    }
}

function showDetails(requestId) {
    eel.get_pickup_by_id(requestId)(function(pickup) {
        Swal.fire({
            title: `Pickup Request ${pickup.request_id}`,
            html: `
                <div class="text-start">
                    <h6>Pengirim:</h6>
                        <p><strong>Nama:</strong> ${pickup.sender.name}</p>
                        <p><strong>Telepon:</strong> ${pickup.sender.phone}</p>
                        <p><strong>Alamat:</strong> ${pickup.sender.address}</p>
                    <h6>Penerima:</h6>
                        <p><strong>Nama:</strong> ${pickup.recipient.name}</p>
                        <p><strong>Telepon:</strong> ${pickup.recipient.phone}</p>
                        <p><strong>Alamat:</strong> ${pickup.recipient.address}</p>
                    <h6>Paket:</h6>
                        <p><strong>Berat:</strong> ${pickup.package.weight} kg</p>
                        <p><strong>Dimensi:</strong> ${pickup.package.dimensions.length}x${pickup.package.dimensions.width}x${pickup.package.dimensions.height} cm</p>

                    <p><strong>Package Details:</strong> ${pickup.package_details}</p>
                    <p><strong>Notes:</strong> ${pickup.notes}</p>
                    <p><strong>Pickup Date:</strong> ${pickup.pickup_date}</p>
                    <p><strong>Pickup Time:</strong> ${pickup.pickup_time}</p>
                    <p><strong>Status:</strong> ${pickup.status}</p>
            `,
            icon: 'info',
            confirmButtonText: 'Close',
            confirmButtonColor: '#003366'
        });
    });
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'confirmed': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return colors[status.toLowerCase()] || 'secondary';
}

document.addEventListener('DOMContentLoaded', () => {
    loadMerchantData();
    loadPickupRequests();
});