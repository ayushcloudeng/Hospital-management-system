// Login with Backend API
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!email || !password || !role) {
    alert('Please fill in all fields');
    return;
  }

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    // Call login API
    const user = await API.auth.login(email, password);

    // Check if user role matches selected role
    if (user.role !== role) {
      alert(`Invalid role. You are registered as ${user.role}, but trying to login as ${role}`);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      return;
    }

    // Redirect based on role
    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else if (user.role === "doctor") {
      window.location.href = "doctor.html";
    } else if (user.role === "patient") {
      window.location.href = "patient.html";
    }

  } catch (error) {
    alert('Login failed: ' + (error.message || 'Invalid credentials'));
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'SIGN IN';
    submitBtn.disabled = false;
  }
});
