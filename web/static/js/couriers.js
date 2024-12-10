window.addEventListener('load', () => {
    const tableBody = document.getElementById("courierTableBody");
    if (tableBody) {
        loadCouriers();
    }
});

async function checkDuplicateField(field, value) {
    try {
        const result = await eel.check_duplicate_courier_field(field, value)();
        return result.isDuplicate;
    } catch (error) {
        console.error(`Error checking duplicate ${field}:`, error);
        return true; // Anggap sebagai duplikat jika terjadi kesalahan
    }
}

function showFieldError(inputElement, message) {
    inputElement.classList.add('is-invalid');
    let feedbackDiv = document.getElementById(`${inputElement.id}Feedback`);
    if (!feedbackDiv) {
        feedbackDiv = document.createElement('div');
        feedbackDiv.id = `${inputElement.id}Feedback`;
        feedbackDiv.className = 'invalid-feedback';
        inputElement.parentNode.appendChild(feedbackDiv);
    }
    feedbackDiv.textContent = message;
}

function clearFieldError(inputElement) {
    inputElement.classList.remove('is-invalid');
    const feedbackDiv = document.getElementById(`${inputElement.id}Feedback`);
    if (feedbackDiv) {
        feedbackDiv.textContent = '';
    }
}

document.getElementById('courierEmail').addEventListener('blur', async function() {
    const email = this.value.trim();
    if (email) {
        const isDuplicate = await checkDuplicateField("email", email);
        if (isDuplicate) {
            showFieldError(this, 'Email already exists');
        } else {
            clearFieldError(this);
        }
    }
});

document.getElementById('courierPhone').addEventListener('blur', async function() {
    const phone = this.value.trim();
    if (phone) {
        const isDuplicate = await checkDuplicateField("phone", phone);
        if (isDuplicate) {
            showFieldError(this, 'Nomor telepon already exists');
        } else {
            clearFieldError(this);
        }
    }
});

['courierEmail', 'courierPhone'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        clearFieldError(this);
    });
});

document.getElementById('addCourierForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('courierName').value.trim(),
        phone: document.getElementById('courierPhone').value.trim(),
        email: document.getElementById('courierEmail').value.trim(),
        address: document.getElementById('courierAddress').value.trim(),
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
            if (result.field) {
                const inputElement = document.getElementById(`courier${result.field.charAt(0).toUpperCase() + result.field.slice(1)}`);
                showFieldError(inputElement, result.message);
                inputElement.focus();
            } else {
                await showErrorMessage('Gagal', result.message);
            }
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
        await showErrorMessage('Error', 'Terjadi kesalahan saat memuat data kurir');
    }
}

async function updateCourier() {
    const formData = {
        id: document.getElementById('edit_id_courier').value,
        name: document.getElementById('edit_nama_courier').value.trim(),
        phone: document.getElementById('edit_phone_courier').value.trim(),
        email: document.getElementById('edit_email_courier').value.trim(),
        address: document.getElementById('edit_address_courier').value.trim(),
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
        await showErrorMessage('Error', 'Terjadi kesalahan saat mengupdate kurir');
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