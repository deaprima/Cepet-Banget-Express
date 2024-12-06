window.addEventListener('load', () => {
    const tableBody = document.getElementById("courierTableBody");
    if (tableBody) {
        loadCouriers();
    }
});

document.getElementById('addCourierForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('courierName').value,
        phone: document.getElementById('courierPhone').value,
        email: document.getElementById('courierEmail').value,
        address: document.getElementById('courierAddress').value,
        area: document.getElementById('courierArea').value,
        status: document.getElementById('courierStatus').value
    };
    
    try {
        const result = await eel.add_courier(formData)();
        if(result.status === 'success') {
            await showSuccessMessage('Berhasil', 'Kurir berhasil ditambahkan');
            if ($.fn.DataTable.isDataTable('.table')) {
                $('.table').DataTable().destroy();
            }
            await loadCouriers(); 
            e.target.reset();
        } else {
            await showErrorMessage('Gagal', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        await showErrorMessage('Error', 'Terjadi kesalahan saat menambahkan kurir');
    }
});

async function loadCouriers() {
    const couriers = await eel.get_couriers()();
    const tbody = document.getElementById('courierTableBody');
    tbody.innerHTML = '';

    if (couriers && couriers.length > 0) {
        couriers.forEach(courier => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${courier.id_courier}</td>
                <td>${courier.name}</td>
                <td>${courier.phone}</td>
                <td>${courier.area}</td>
                <td>
                    <span class="badge ${courier.status === 'active' ? 'bg-success' : 'bg-danger'}">
                        ${courier.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editCourier('${courier.id_courier}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCourier('${courier.id_courier}')">
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


async function editCourier(courierId) {
    try {
        const courier = await eel.get_courier_by_id(courierId)();
        document.getElementById('edit_id_courier').value = courier.id_courier;
        document.getElementById('edit_nama_courier').value = courier.name;
        document.getElementById('edit_phone_courier').value = courier.phone;
        document.getElementById('edit_email_courier').value = courier.email;
        document.getElementById('edit_address_courier').value = courier.address;
        document.getElementById('edit_area_courier').value = courier.area;
        document.getElementById('edit_status_courier').value = courier.status;
        
        new bootstrap.Modal(document.getElementById('editModal')).show();
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memuat data kurir');
    }
}

async function updateCourier() {
    const formData = {
        id: document.getElementById('edit_id_courier').value,
        name: document.getElementById('edit_nama_courier').value,
        phone: document.getElementById('edit_phone_courier').value,
        email: document.getElementById('edit_email_courier').value,
        address: document.getElementById('edit_address_courier').value,
        area: document.getElementById('edit_area_courier').value,
        status: document.getElementById('edit_status_courier').value
    };
    
    try {
        const result = await eel.update_courier(formData)();
        if(result.status === 'success') {
            await showSuccessMessage('Berhasil', 'Data kurir berhasil diperbarui');
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            
            if ($.fn.DataTable.isDataTable('.table')) {
                $('.table').DataTable().destroy();
            }
            await loadCouriers();
        } else {
            await showErrorMessage('Gagal', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        await showErrorMessage('Error', 'Terjadi kesalahan saat memperbarui data kurir');
    }
}

async function deleteCourier(courierId) {
    const confirmed = await showDeleteConfirmation();
    
    if (confirmed) {
        try {
            const result = await eel.delete_courier(courierId)();
            if (result.status === 'success') {
                await showSuccessMessage('Berhasil', 'Kurir berhasil dihapus');
                if ($.fn.DataTable.isDataTable('.table')) {
                    $('.table').DataTable().destroy();
                }
                await loadCouriers();
            } else {
                await showErrorMessage('Gagal', result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            await showErrorMessage('Error', 'Terjadi kesalahan saat menghapus kurir');
        }
    }
}