document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const adminStatus = document.getElementById("admin-status");
  const authModal = document.getElementById("auth-modal");
  const userMenuButton = document.getElementById("user-menu-button");
  const closeAuthModal = document.getElementById("close-auth-modal");
  const openLoginFormButton = document.getElementById("open-login-form");
  const loginForm = document.getElementById("login-form");
  const loggedOutPanel = document.getElementById("auth-panel-logged-out");
  const loggedInPanel = document.getElementById("auth-panel-logged-in");
  const loggedInUser = document.getElementById("logged-in-user");
  const logoutButton = document.getElementById("logout-button");

  let authState = {
    authenticated: false,
    username: null,
  };

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function openModal() {
    authModal.classList.remove("hidden");
  }

  function closeModal() {
    authModal.classList.add("hidden");
  }

  function updateAdminControls() {
    const isTeacher = authState.authenticated;

    signupForm.classList.toggle("hidden", !isTeacher);
    activitySelect.disabled = !isTeacher;
    document.getElementById("email").disabled = !isTeacher;

    if (isTeacher) {
      adminStatus.textContent = `Logged in as ${authState.username}. You can manage registrations.`;
      adminStatus.className = "info-panel success-panel";
    } else {
      adminStatus.textContent = "Teacher login is required to register or unregister students.";
      adminStatus.className = "info-panel";
    }

    loggedOutPanel.classList.toggle("hidden", isTeacher);
    loggedInPanel.classList.toggle("hidden", !isTeacher);
    loggedInUser.textContent = isTeacher
      ? `Signed in as ${authState.username}`
      : "";
  }

  async function fetchAuthStatus() {
    try {
      const response = await fetch("/auth/status");
      authState = await response.json();
      updateAdminControls();
    } catch (error) {
      console.error("Error fetching auth status:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        authState.authenticated
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!authState.authenticated) {
      showMessage("Teacher login is required to unregister students.", "error");
      openModal();
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authState.authenticated) {
      showMessage("Teacher login is required to register students.", "error");
      openModal();
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  userMenuButton.addEventListener("click", openModal);
  closeAuthModal.addEventListener("click", closeModal);
  authModal.addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
      closeModal();
    }
  });
  openLoginFormButton.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Login failed.", "error");
        return;
      }

      loginForm.reset();
      loginForm.classList.add("hidden");
      closeModal();
      await fetchAuthStatus();
      await fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to sign in. Please try again.", "error");
      console.error("Error signing in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Logout failed.", "error");
        return;
      }

      closeModal();
      await fetchAuthStatus();
      await fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  // Initialize app
  fetchAuthStatus().then(fetchActivities);
});
