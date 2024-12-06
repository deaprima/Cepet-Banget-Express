function initializeDashboard() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (userData) {
        document.getElementById('username').textContent = userData.name;
        document.getElementById('dropdown-username').textContent = userData.name;
        document.getElementById('dropdown-email').textContent = userData.email;
    }
    setupShippingCalculator();
}

function hideAllErrors() {
    const errorElements = ['origin-error', 'destination-error', 'weight-error', 'length-error', 'width-error', 'height-error'];
    errorElements.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function setupShippingCalculator() {
    const calculator = document.getElementById('cost-calculator');
    calculator.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        hideAllErrors();
        
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const length = document.getElementById('length').value;
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;

        let isValid = true;
        
        if (!origin) {
            document.getElementById('origin-error').style.display = 'block';
            isValid = false;
        }
        if (!destination) {
            document.getElementById('destination-error').style.display = 'block';
            isValid = false;
        }
        if (!weight) {
            document.getElementById('weight-error').style.display = 'block';
            isValid = false;
        }
        if (!length) {
            document.getElementById('length-error').style.display = 'block';
            isValid = false;
        }
        if (!width) {
            document.getElementById('width-error').style.display = 'block';
            isValid = false;
        }
        if (!height) {
            document.getElementById('height-error').style.display = 'block';
            isValid = false;
        }

        if (!isValid) return;

        const formData = {
            dimensions: {
                length: parseFloat(length),
                width: parseFloat(width),
                height: parseFloat(height)
            },
            weight: parseFloat(weight)
        };

        const cost = await eel.calculate_shipping_cost(
            formData.dimensions,
            formData.weight
        )();

        displayShippingCost(cost);
    });
}

function displayShippingCost(cost) {
    document.getElementById('base-cost').textContent = `Rp ${cost.base_rate.toLocaleString()}`;
    document.getElementById('distance-cost').textContent = `Rp ${cost.distance_cost.toLocaleString()}`;
    document.getElementById('volume-cost').textContent = `Rp ${cost.volume_cost.toLocaleString()}`;
    document.getElementById('weight-cost').textContent = `Rp ${cost.weight_cost.toLocaleString()}`;
    document.getElementById('total-cost').textContent = `Rp ${cost.total.toLocaleString()}`;
}

function resetForm() {
    document.getElementById('origin').value = '';
    document.getElementById('destination').value = '';
    document.getElementById('weight').value = '';
    document.getElementById('length').value = '';
    document.getElementById('width').value = '';
    document.getElementById('height').value = '';
    
    hideAllErrors();
    
    document.getElementById('base-cost').textContent = 'Rp 0';
    document.getElementById('distance-cost').textContent = 'Rp 0';
    document.getElementById('volume-cost').textContent = 'Rp 0';
    document.getElementById('weight-cost').textContent = 'Rp 0';
    document.getElementById('total-cost').textContent = 'Rp 0';
}

document.addEventListener('DOMContentLoaded', initializeDashboard);