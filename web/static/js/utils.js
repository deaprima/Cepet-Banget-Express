function showError(inputId, message) {
    const inputElement = document.getElementById(inputId);
    let errorElement = inputElement.nextElementSibling;

    if (!errorElement || !errorElement.classList.contains("error-message")) {
        errorElement = document.createElement("small");
        errorElement.classList.add("error-message", "text-danger");
        inputElement.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
}

function clearErrors() {
    const errorMessages = document.querySelectorAll(".error-message");
    errorMessages.forEach((error) => error.remove());
}

async function showSuccessMessage(title, message) {
    await Swal.fire({
        title: title,
        text: message,
        icon: 'success',
        confirmButtonColor: '#003366', 
        confirmButtonText: 'OK'
    });
}

async function showErrorMessage(title, message) {
    await Swal.fire({
        title: title,
        text: message,
        icon: 'error',
        confirmButtonColor: '#003366', 
        confirmButtonText: 'OK'
    });
}

async function showDeleteConfirmation() {
    const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Data yang dihapus tidak dapat dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#003366', 
        cancelButtonColor: '#FD7702', 
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    });
    return result.isConfirmed;
}