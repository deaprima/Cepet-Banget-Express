window.addEventListener('load', () => {
    const tableBody = document.getElementById('shipments-table-body');
    if (tableBody) {
        loadShipments();
        loadCouriers();
        setupFormHandlers();
    }
});

async function loadCouriers() {
    const couriers = await eel.get_couriers()();
    const select = document.getElementById('courier-select');
    couriers.forEach(courier => {
        const option = document.createElement('option');
        option.value = courier.id_courier;
        option.textContent = courier.name;
        select.appendChild(option);
    });
}

function setupFormHandlers() {
    const form = document.getElementById('shipment-form');
    form.addEventListener('submit', handleShipmentSubmit);

}

async function calculateCosts() {
    hideAllErrors();

    const formData = {
        sender: {
            name: document.getElementById('sender-name').value.trim(),
            phone: document.getElementById('sender-phone').value.trim(),
            address: document.getElementById('sender-address').value.trim()
        },
        receiver: {
            name: document.getElementById('receiver-name').value.trim(),
            phone: document.getElementById('receiver-phone').value.trim(),
            address: document.getElementById('receiver-address').value.trim()
        },
        package: {
            type: document.getElementById('package-type').value.trim(),
            weight: parseFloat(document.getElementById('weight').value),
            dimensions: {
                length: parseFloat(document.getElementById('length').value),
                width: parseFloat(document.getElementById('width').value),
                height: parseFloat(document.getElementById('height').value)
            }
        },
        courier_id: document.getElementById('courier-select').value
    };

    if (!validatePackageOnly(formData)) {
        return null;
    }

    const cost = await eel.calculate_shipping_cost(formData.package.dimensions, formData.package.weight)();
    if (cost) {
        displayShippingCost(cost);
        return cost;
    }
    return null;
}

function displayShippingCost(cost) {
    document.getElementById('base-cost').textContent = `Rp ${cost.base_rate.toLocaleString()}`;
    document.getElementById('volume-cost').textContent = `Rp ${cost.volume_cost.toLocaleString()}`;
    document.getElementById('weight-cost').textContent = `Rp ${cost.weight_cost.toLocaleString()}`;
    document.getElementById('total-cost').textContent = `Rp ${cost.total.toLocaleString()}`;
}

async function handleShipmentSubmit(e) {
    e.preventDefault();
    hideAllErrors();

    const formData = {
        sender: {
            name: document.getElementById('sender-name').value.trim(),
            phone: document.getElementById('sender-phone').value.trim(),
            address: document.getElementById('sender-address').value.trim()
        },
        receiver: {
            name: document.getElementById('receiver-name').value.trim(),
            phone: document.getElementById('receiver-phone').value.trim(),
            address: document.getElementById('receiver-address').value.trim()
        },
        package: {
            type: document.getElementById('package-type').value.trim(),
            weight: parseFloat(document.getElementById('weight').value),
            dimensions: {
                length: parseFloat(document.getElementById('length').value),
                width: parseFloat(document.getElementById('width').value),
                height: parseFloat(document.getElementById('height').value)
            }
        },
        courier_id: document.getElementById('courier-select').value,
        type: 'offline'
    };

    if (!validateForm(formData)) {
        return;
    }

    const cost = await calculateCosts();
    if (!cost) {
        return;
    }

    formData.package.cost = cost;

    const result = await eel.create_shipment(formData)();
    if (result.status === 'success') {
        await showSuccessMessage('Pengiriman Dibuat', result.message);
        if ($.fn.DataTable.isDataTable('.table')) {
            $('.table').DataTable().destroy();
        }

        resetForm();
        await loadShipments();
    }
}

function validateForm(data) {
    let isValid = true;
    
    if (!data.sender.name) {
        document.getElementById('sender-name-error').style.display = 'block';
        isValid = false;
    }
    if (!data.sender.phone) {
        document.getElementById('sender-phone-error').style.display = 'block';
        isValid = false;
    }
    if (!data.sender.address) {
        document.getElementById('sender-address-error').style.display = 'block';
        isValid = false;
    }
    
    if (!data.receiver.name) {
        document.getElementById('receiver-name-error').style.display = 'block';
        isValid = false;
    }
    if (!data.receiver.phone) {
        document.getElementById('receiver-phone-error').style.display = 'block';
        isValid = false;
    }
    if (!data.receiver.address) {
        document.getElementById('receiver-address-error').style.display = 'block';
        isValid = false;
    }
    
    if (!data.package.type) {
        document.getElementById('package-type-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.weight) {
        document.getElementById('weight-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.dimensions.length) {
        document.getElementById('length-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.dimensions.width) {
        document.getElementById('width-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.dimensions.height) {
        document.getElementById('height-error').style.display = 'block';
        isValid = false;
    }
    
    if (!data.courier_id) {
        document.getElementById('courier-error').style.display = 'block';
        isValid = false;
    }

    return isValid;
}

function validatePackageOnly(data) {
    let isValid = true;
    
    if (!data.package.type) {
        document.getElementById('package-type-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.weight) {
        document.getElementById('weight-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.dimensions.length) {
        document.getElementById('length-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.dimensions.width) {
        document.getElementById('width-error').style.display = 'block';
        isValid = false;
    }
    if (!data.package.dimensions.height) {
        document.getElementById('height-error').style.display = 'block';
        isValid = false;
    }

    return isValid;
}

function hideAllErrors() {
    const errorElements = document.querySelectorAll('small[id$="-error"]');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });
}

function resetForm() {
    document.getElementById('shipment-form').reset();
    hideAllErrors();
    displayShippingCost({
        base_rate: 0,
        volume_cost: 0,
        weight_cost: 0,
        total: 0
    });
}

async function loadShipments() {
    const shipments = await eel.get_shipments()();
    const tbody = document.getElementById('shipments-table-body');
    tbody.innerHTML = '';

    if (shipments && shipments.length > 0) {
        shipments.forEach(shipment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${shipment.tracking_number}</td>
                <td>${shipment.date}</td>
                <td>${shipment.sender.name}</td>
                <td>${shipment.receiver.name}</td>
                <td>${shipment.courier_name}</td>
                <td>
                    <span class="badge ${getStatusBadgeClass(shipment.status)}">
                        ${shipment.status}
                    </span>
                </td>
                <td>Rp ${shipment.package.cost.total.toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewShipment('${shipment.tracking_number}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="updateStatus('${shipment.tracking_number}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteShipment('${shipment.tracking_number}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        if ($.fn.DataTable.isDataTable('.table')) {
            $('.table').DataTable().destroy();
        }

        $('.table').DataTable({
            responsive: true,
            paging: true,
            searching: true,
            ordering: true,
            language: {
                url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/Indonesian.json"
            }
        });
    }
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'pending': 'bg-warning',
        'picked_up': 'bg-info',
        'in_transit': 'bg-primary',
        'delivered': 'bg-success',
        'cancelled': 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
}

async function viewShipment(trackingNumber) {
    const shipment = await eel.get_shipment_by_tracking(trackingNumber)();
    
    await Swal.fire({
        title: `Detail Pengiriman ${trackingNumber}`,
        html: `
            <div class="text-start">
                <h6>Pengirim:</h6>
                <p>Nama: ${shipment.sender.name}<br>
                   Telepon: ${shipment.sender.phone}<br>
                   Alamat: ${shipment.sender.address}</p>
                
                <h6>Penerima:</h6>
                <p>Nama: ${shipment.receiver.name}<br>
                   Telepon: ${shipment.receiver.phone}<br>
                   Alamat: ${shipment.receiver.address}</p>
                
                <h6>Paket:</h6>
                <p>Tipe: ${shipment.package.type}<br>
                   Berat: ${shipment.package.weight} kg<br>
                   Dimensi: ${shipment.package.dimensions.length}x${shipment.package.dimensions.width}x${shipment.package.dimensions.height} cm</p>
                
                <h6>Biaya:</h6>
                <p>Total: Rp ${shipment.package.cost.total.toLocaleString()}</p>
            </div>
        `,
        confirmButtonColor: '#003366'
    });
}

async function updateStatus(trackingNumber) {
    const { value: status } = await Swal.fire({
        title: 'Update Status Pengiriman',
        input: 'select',
        inputOptions: {
            'pending': 'Pending',
            'picked_up': 'Picked Up',
            'in_transit': 'In Transit',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        },
        inputPlaceholder: 'Pilih status',
        showCancelButton: true,
        confirmButtonColor: '#003366',
        cancelButtonColor: '#FD7702'
    });

    if (status) {
        const result = await eel.update_shipment_status(trackingNumber, status)();
        if (result.status === 'success') {
            await showSuccessMessage('Status Updated', 'Status pengiriman berhasil diperbarui');
            if ($.fn.DataTable.isDataTable('.table')) {
                $('.table').DataTable().destroy();
            }

            await loadShipments(); 
        }
    }
}

async function deleteShipment(trackingNumber) {
    const confirmed = await showDeleteConfirmation();
    
    if (confirmed) {
        const result = await eel.delete_shipment(trackingNumber)();
        if (result.status === 'success') {
            await showSuccessMessage('Berhasil', 'Data pengiriman berhasil dihapus');
            if ($.fn.DataTable.isDataTable('.table')) {
                $('.table').DataTable().destroy();
            }

            await loadShipments();
        }
    }
}