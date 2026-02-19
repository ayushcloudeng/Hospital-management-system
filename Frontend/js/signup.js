// Signup Form Handler
document.getElementById("signupForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;
    const contact = document.getElementById("contact").value;
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const specialization = document.getElementById("specialization").value;

    if (!name || !email || !password || !role) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;

        // Prepare user data
        const userData = {
            name,
            email,
            password,
            role,
            contact: contact || undefined,
            age: age ? parseInt(age) : undefined,
            gender: gender || undefined,
            specialization: (role === 'doctor' && specialization) ? specialization : undefined,
        };

        // Call register API
        const user = await API.auth.register(userData);

        alert('Account created successfully! Redirecting to dashboard...');

        // Redirect based on role
        if (user.role === "admin") {
            window.location.href = "admin.html";
        } else if (user.role === "doctor") {
            window.location.href = "doctor.html";
        } else if (user.role === "patient") {
            window.location.href = "patient.html";
        }

    } catch (error) {
        alert('Registration failed: ' + (error.message || 'Please try again'));
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'SIGN UP';
        submitBtn.disabled = false;
    }
});

// Show/hide fields based on role
document.getElementById("role").addEventListener("change", function () {
    const role = this.value;
    const ageBox = document.getElementById("ageBox");
    const genderBox = document.getElementById("genderBox");
    const specializationBox = document.getElementById("specializationBox");

    if (role === "patient") {
        ageBox.style.display = "block";
        genderBox.style.display = "block";
        specializationBox.style.display = "none";
    } else if (role === "doctor") {
        ageBox.style.display = "none";
        genderBox.style.display = "none";
        specializationBox.style.display = "block";
    } else {
        ageBox.style.display = "none";
        genderBox.style.display = "none";
        specializationBox.style.display = "none";
    }
});
