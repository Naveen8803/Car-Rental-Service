/* js/script.js
   Unified script for:
   - navbar login/logout display
   - register & login handling (stores users + loggedInUser)
   - fleet rendering, filtering, Rent Now -> booking modal
   - booking creation saved per user
   - bookings page displays only current user's bookings
   - contact form simple feedback
*/

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Auto remove after animation
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------
     Utility helpers
  ------------------------- */
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));
  const getUsers = () => JSON.parse(localStorage.getItem('driveAwayUsers')) || [];
  const saveUsers = (arr) => localStorage.setItem('driveAwayUsers', JSON.stringify(arr));
  const getBookings = () => JSON.parse(localStorage.getItem('driveAwayBookings')) || [];
  const saveBookings = (arr) => localStorage.setItem('driveAwayBookings', JSON.stringify(arr));
  const getLoggedInUser = () => JSON.parse(localStorage.getItem('loggedInUser')) || null;

  /* -------------------------
     NAVBAR: show Login / Logout
  ------------------------- */
  const navAuthLink = qs('#auth-link');
  const updateNavAuth = () => {
    const user = getLoggedInUser();
    if (!navAuthLink) return;
    if (user) {
      navAuthLink.textContent = 'Logout';
      navAuthLink.href = '#';
      navAuthLink.onclick = (e) => {
        e.preventDefault();
        if (confirm('Log out now?')) {
          localStorage.removeItem('loggedInUser');
          window.location.href = 'index.html';
        }
      };
    } else {
      navAuthLink.textContent = 'Login';
      navAuthLink.href = 'auth.html';
      navAuthLink.onclick = null;
    }
  };
  updateNavAuth();

  /* -------------------------
     REGISTER (auth.html)
  ------------------------- */
  const registerForm = qs('#register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = qs('#register-name').value.trim();
      const email = qs('#register-email').value.trim().toLowerCase();
      const password = qs('#register-password').value;
      const confirm = qs('#register-confirm').value;
      const licence = qs('#register-licence').value.trim().toUpperCase();
      const aadhar = qs('#register-aadhar').value.trim();
      const phone = qs('#register-phone').value.trim();
      const address = qs('#register-address').value.trim();
      const errEl = qs('#register-error');

      if (errEl) errEl.classList.add('hidden');

      // Password check
      if (password !== confirm) {
        if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); }
        return;
      }

      // Valid state codes for Driving Licence
      const validStates = ["TN", "TS", "MH", "KA", "DL"];

      // Driving Licence validation
      const isValidLicence = (lic) => {
        if (!lic || lic.length < 4) return false;
        lic = lic.toUpperCase();
        const stateCode = lic.substring(0, 2);
        if (!validStates.includes(stateCode)) return false;
        const licenceRegex = /^[A-Z]{2}\d{2}\d{11,13}$/;
        return licenceRegex.test(lic);
      };

      if (!isValidLicence(licence)) {
        if (errEl) {
          errEl.textContent = 'Invalid Driving Licence number. Example: TS1320110001234 (TN, TS, MH, KA, DL allowed)';
          errEl.classList.remove('hidden');
        }
        return;
      }

      // Aadhar validation (12 digits)
      if (!/^\d{12}$/.test(aadhar)) {
        if (errEl) { errEl.textContent = 'Invalid Aadhar number. Must be 12 digits.'; errEl.classList.remove('hidden'); }
        return;
      }

      // Phone validation (10 digits, Indian mobile numbers start with 6-9)
      if (!/^[6-9]\d{9}$/.test(phone)) {
        if (errEl) { errEl.textContent = 'Invalid phone number. Must be 10 digits starting with 6-9.'; errEl.classList.remove('hidden'); }
        return;
      }

      let users = getUsers();
      if (users.find(u => u.email === email)) {
        if (errEl) { errEl.textContent = 'Account already exists with this email.'; errEl.classList.remove('hidden'); }
        return;
      }

      const newUser = { id: Date.now(), name, email, password, licence, aadhar, phone, address };
      users.push(newUser);
      saveUsers(users);

      showToast("✅ Registration successful! You can login now.", "success");
      registerForm.reset();

      // Switch to login view
      const regSec = qs('#register-section');
      const loginSec = qs('#login-section');
      if (regSec && loginSec) {
        regSec.classList.add('hidden');
        loginSec.classList.remove('hidden');
      }
    });
  }

  /* -------------------------
     LOGIN (auth.html)
  ------------------------- */
  const loginForm = qs('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = qs('#login-email').value.trim().toLowerCase();
      const password = qs('#login-password').value;
      const errEl = qs('#login-error');

      if (errEl) errEl.classList.add('hidden');

      const users = getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        if (errEl) { errEl.textContent = 'Invalid email or password.'; errEl.classList.remove('hidden'); }
        return;
      }

      // Successful login -> persist loggedInUser
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      updateNavAuth();
      showToast(`✅ Welcome back, ${user.name}!`, "success");
      // redirect to fleet for convenience
      setTimeout(() => { window.location.href = 'fleet.html'; }, 800);
    });
  }

  /* -------------------------
     Toggle between login & register views (auth.html)
  ------------------------- */
  const showRegisterLink = qs('#show-register');
  const showLoginLink = qs('#show-login');
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      qs('#login-section')?.classList.add('hidden');
      qs('#register-section')?.classList.remove('hidden');
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      qs('#register-section')?.classList.add('hidden');
      qs('#login-section')?.classList.remove('hidden');
    });
  }

  /* -------------------------
     CONTACT FORM (contact.html)
  ------------------------- */
  const contactForm = qs('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactForm.reset();
      const success = qs('#contact-success');
      if (success) {
        success.classList.remove('hidden');
        setTimeout(() => success.classList.add('hidden'), 3000);
      } else {
        alert('Message sent!');
      }
    });
  }

  /* -------------------------
     FLEET DATA + RENDERING (fleet.html)
  ------------------------- */
  const cars = [
    { id: 1, name: "Maruti Suzuki Swift", type: "Hatchback", location: "Mumbai", fuel: "Petrol", seats: 5, transmission: "Manual", available: 3, price: 1800, image: "images/Maruti Suzuki Swift.webp" },
    { id: 2, name: "Hyundai Creta", type: "SUV", location: "Delhi", fuel: "Diesel", seats: 5, transmission: "Automatic", available: 2, price: 2500, image: "images/hyundai-creta-2025-front-angle-low-view-744045.avif" },
    { id: 3, name: "Honda City", type: "Sedan", location: "Bangalore", fuel: "Petrol", seats: 5, transmission: "Manual", available: 5, price: 2200, image: "images/hondacity.webp" },
    { id: 4, name: "Tata Nexon EV", type: "EV", location: "Hyderabad", fuel: "Electric", seats: 5, transmission: "Automatic", available: 4, price: 2600, image: "images/tata nexon.avif" },
    { id: 5, name: "Mahindra XUV700", type: "SUV", location: "Mumbai", fuel: "Diesel", seats: 7, transmission: "Automatic", available: 1, price: 3500, image: "images/Mahindra_XUV700_Specifications_And_Accessories_7bd41ed2-ecbf-421e-8aee-41a3a84617b8_1240x.webp" },
    { id: 6, name: "Hyundai i20", type: "Hatchback", location: "Delhi", fuel: "Petrol", seats: 5, transmission: "Manual", available: 6, price: 2000, image: "images/hyundai_i20.avif" },
    { id: 7, name: "Toyota Innova Crysta", type: "SUV", location: "Bangalore", fuel: "Diesel", seats: 7, transmission: "Automatic", available: 2, price: 3000, image: "images/Toyota Innova Crysta.png" },
    { id: 8, name: "Volkswagen Virtus", type: "Sedan", location: "Hyderabad", fuel: "Petrol", seats: 5, transmission: "Automatic", available: 3, price: 2400, image: "images/virtus-exterior-right-front-three-quarter-10.avif" },
    { id: 9, name: "Kia Seltos", type: "SUV", location: "Delhi", fuel: "Diesel", seats: 5, transmission: "Manual", available: 5, price: 2700, image: "images/seltos-exterior-right-front-three-quarter-3.avif" },
    { id: 10, name: "Skoda Octavia", type: "Sedan", location: "Mumbai", fuel: "Petrol", seats: 5, transmission: "Automatic", available: 4, price: 2800, image: "images/skoda_octavia.avif" },
    { id: 11, name: "Tata Altroz", type: "Hatchback", location: "Chennai", fuel: "Petrol", seats: 5, transmission: "Manual", available: 5, price: 1900, image: "images/altroz-facelift-exterior-right-front-three-quarter-4.avif" },
    { id: 12, name: "Maruti Baleno", type: "Hatchback", location: "Delhi", fuel: "Petrol", seats: 5, transmission: "Automatic", available: 5, price: 1950, image: "images/baleno-exterior-right-front-three-quarter-71.avif" },
    { id: 13, name: "Jeep Compass", type: "SUV", location: "Mumbai", fuel: "Diesel", seats: 5, transmission: "Automatic", available: 2, price: 3700, image: "images/compass-exterior-right-front-three-quarter-83.avif" },
    { id: 14, name: "Hyundai Verna", type: "Sedan", location: "Bangalore", fuel: "Petrol", seats: 5, transmission: "Manual", available: 5, price: 2100, image: "images/verna-exterior-right-front-three-quarter-102.avif" },
    { id: 15, name: "Tesla Model 3", type: "EV", location: "Delhi", fuel: "Electric", seats: 5, transmission: "Automatic", available: 3, price: 5000, image: "images/tesla.png" },
    { id: 16, name: "MG ZS EV", type: "EV", location: "Hyderabad", fuel: "Electric", seats: 5, transmission: "Automatic", available: 4, price: 3200, image: "images/MG-ev-exterior-right-front-three-quarter-69.avif" },
    { id: 17, name: "Renault Kwid", type: "Hatchback", location: "Chennai", fuel: "Petrol", seats: 4, transmission: "Manual", available: 5, price: 1500, image: "images/kwid-exterior-right-front-three-quarter-37.webp" },
    { id: 18, name: "Ford EcoSport", type: "SUV", location: "Delhi", fuel: "Petrol", seats: 5, transmission: "Automatic", available: 5, price: 2600, image: "images/FORD.jpEg" },
    { id: 19, name: "Mahindra Thar", type: "SUV", location: "Mumbai", fuel: "Diesel", seats: 4, transmission: "Manual", available: 2, price: 3200, image: "images/thar-exterior-right-front-three-quarter-38.avif" },
    { id: 20, name: "Honda Amaze", type: "Sedan", location: "Hyderabad", fuel: "Petrol", seats: 5, transmission: "Automatic", available: 5, price: 2000, image: "images/amaze-exterior-right-front-three-quarter-4.webp" }
  ];

  const carListEl = qs('#car-list');
  // render function
  const renderCars = (list) => {
    if (!carListEl) return;
    carListEl.innerHTML = '';
    if (!list || list.length === 0) {
      qs('#no-results')?.classList.remove('hidden');
      return;
    }
    qs('#no-results')?.classList.add('hidden');

    list.forEach(car => {
      const liveAvailable = getLiveAvailable(car);

      const card = document.createElement('div');
      card.className = 'car-card';
      card.innerHTML = `
        <img src="${car.image}" alt="${car.name}" />
        <div class="car-info">
          <h3>${car.name}</h3>
          <p class="price">₹${car.price} / day</p>
          <p class="availability">Available: ${liveAvailable}</p>
          <div class="specs">
            <span>⛽ ${car.fuel}</span>
            <span>👥 ${car.seats}</span>
            <span>⚙ ${car.transmission}</span>
          </div>
          <p class="location">📍 ${car.location}</p>
          <button class="btn-primary" data-id="${car.id}" ${liveAvailable === 0 ? 'disabled' : ''}>
            ${liveAvailable === 0 ? 'Not Available' : 'Rent Now'}
          </button>
        </div>
      `;
      carListEl.appendChild(card);
    });
  };

  function getLiveAvailable(car, pickup=null, ret=null) {
    const bookings = getBookings();
    const now = new Date();
    const start = pickup ? new Date(pickup) : now;
    const end = ret ? new Date(ret) : now;

    const activeBookings = bookings.filter(b =>
      String(b.carId) === String(car.id) &&
      !(new Date(b.return) <= start || new Date(b.pickup) >= end) // overlapping
    );

    return Math.max(0, car.available - activeBookings.length);
  }

  // Render fleet helper for other calls
  function renderFleet() { renderCars(cars); }

  // initial render if on fleet page
  renderFleet();

  // filters: only type + location
  const typeSelect = qs('#car-type');
  const locSelect = qs('#location');

  const applyFilters = () => {
    const t = typeSelect?.value || 'all';
    const l = locSelect?.value || 'all';
    const filtered = cars.filter(c => (t === 'all' || c.type === t) && (l === 'all' || c.location === l));
    renderCars(filtered);
  };

  typeSelect?.addEventListener('change', applyFilters);
  locSelect?.addEventListener('change', applyFilters);

  // Rent Now click -> booking modal only if logged in
  if (carListEl) {
    carListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button.btn-primary');
      if (!btn) return;
      const loggedUser = getLoggedInUser();
      if (!loggedUser) {
        // keep behavior: prompt user to login
        if (confirm('You must be logged in to book. Go to login?')) {
          window.location.href = 'auth.html';
        }
        return;
      }
      // show booking modal and pre-fill name / phone / licence if available
      const carId = btn.getAttribute('data-id');
      const selectedCar = cars.find(c => String(c.id) === String(carId));
      // attach carId to form dataset
      const bookingFormEl = qs('#booking-form');
      if (bookingFormEl) bookingFormEl.dataset.carId = carId;

      // open modal
      qs('#booking-modal')?.classList.remove('hidden');
      // prefill with logged user data when possible
      qs('#booking-name').value = loggedUser.name || '';
      qs('#booking-phone').value = loggedUser.phone || '';
      qs('#booking-licence').value = loggedUser.licence || '';
      qs('#booking-aadhar').value = loggedUser.aadhar || '';
    });
  }

  /* -------------------------
     Booking modal actions
  ------------------------- */
  const bookingModalEl = qs('#booking-modal');
  const bookingFormEl = qs('#booking-form');
  const closeModalEl = qs('#close-modal');

  closeModalEl?.addEventListener('click', () => {
    bookingModalEl?.classList.add('hidden');
    bookingFormEl?.removeAttribute('data-car-id');
    bookingFormEl?.reset();
  });

  if (bookingFormEl) {
    bookingFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const loggedUser = getLoggedInUser();
      if (!loggedUser) {
        showToast("⚠️ Please login first to book a car.", "error");
        return;
      }

      const carId = bookingFormEl.dataset.carId;
      const name = qs('#booking-name').value.trim();
      const phone = qs('#booking-phone').value.trim();
      const licence = qs('#booking-licence').value.trim();
      const aadhar = qs('#booking-aadhar').value.trim();
      const pickup = qs('#pickup-datetime').value;
      const ret = qs('#return-datetime').value;

      // Validate dates
      const now = new Date();
      const pickupDate = new Date(pickup);
      const returnDate = new Date(ret);

      if (!pickup || !ret) {
        showToast('Please select both pickup and return date/time.');
        return;
      }

      if (pickupDate < now) {
        showToast('Pickup date/time cannot be in the past.');
        return;
      }

      if (returnDate <= pickupDate) {
        showToast('Return date/time must be after pickup date/time.');
        return;
      }

      const car = cars.find(c => String(c.id) === String(carId));
      if (!car) {
        showToast("Car not found.", "error");
        return;
      }

      let bookings = getBookings();

      // 🔎 check overlapping bookings for this car
      const overlapping = bookings.filter(b =>
        String(b.carId) === String(carId) &&
        !(new Date(ret) <= new Date(b.pickup) || new Date(pickup) >= new Date(b.return))
      );

      if (overlapping.length >= car.available) {
        showToast("❌ No cars available for the selected date/time.", "error");
        return;
      }
      // ✅ store booking if available
      const booking = {
        id: Date.now(),
        userId: loggedUser.id,
        userEmail: loggedUser.email,
        carId: carId,
        carName: car.name,
        name, phone, licence, aadhar,
        pickup, return: ret,
        totalPrice: calculatePrice(car, pickup, ret),
        discountApplied: "N/A",
        createdAt: new Date().toISOString()
      };

      bookings.push(booking);
      saveBookings(bookings);

      showToast("✅ Booking confirmed!", "success");
      bookingFormEl.reset();
      bookingModalEl.classList.add('hidden');

      // if on bookings page, re-render
      renderBookingsForCurrentUser();
      renderFleet();
      renderCars(cars);
    });
  }

  function calculatePrice(car, pickupISO, returnISO) {
    try {
      const p = new Date(pickupISO);
      const r = new Date(returnISO);
      const days = Math.max(1, Math.ceil((r - p) / (1000 * 60 * 60 * 24)));
      return car.price * days;
    } catch (err) {
      return car.price;
    }
  }

  /* -------------------------
     BOOKINGS PAGE: show only logged-in user's bookings
  ------------------------- */
  function renderBookingsForCurrentUser() {
    const bookingListEl = qs('#booking-list');
    const noBookingsEl = qs('#no-bookings');
    if (!bookingListEl) return;

    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      bookingListEl.innerHTML = `<p>Please <a href="auth.html">login</a> to view your bookings.</p>`;
      noBookingsEl?.classList.add('hidden');
      return;
    }

    const bookings = getBookings().filter(b => String(b.userId) === String(loggedUser.id));
    bookingListEl.innerHTML = '';
    if (!bookings.length) {
      noBookingsEl?.classList.remove('hidden');
      return;
    } else {
      noBookingsEl?.classList.add('hidden');
    }

    bookings.forEach(b => {
      const wrapper = document.createElement('div');
      wrapper.className = 'car-card';
      wrapper.innerHTML = `
        <div class="car-info">
          <h3>${b.carName}</h3>
          <p class="price">Booked by: ${b.name} • ${b.phone}</p>
          <p class="specs">Pickup: ${new Date(b.pickup).toLocaleString()} • Return: ${new Date(b.return).toLocaleString()}</p>
          <p class="location">Booking ID: ${b.id}</p>
          <div style="margin-top:10px;display:flex;gap:8px;">
            <button class="btn-primary btn-cancel" data-id="${b.id}" style="background:transparent;border:1px solid rgba(255,255,255,0.08);color:var(--muted);">Cancel</button>
            <button class="btn-primary btn-details" data-id="${b.id}" style="background:linear-gradient(45deg,var(--primary),var(--primary-hover));">Details</button>
          </div>
        </div>
      `;
      bookingListEl.appendChild(wrapper);
    });

    // cancel listeners
    qsa('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (!confirm('Cancel this booking?')) return;

        let bookings = getBookings();
        bookings = bookings.filter(x => String(x.id) !== String(id));
        saveBookings(bookings);

        showToast("Booking cancelled.", "info");
        renderBookingsForCurrentUser();
        renderFleet();
        renderCars(cars);
      });
    });

    // details listeners
    qsa('.btn-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const bookings = getBookings();
        const booking = bookings.find(b => String(b.id) === String(id));
        if (!booking) {
          showToast("Booking not found.", "error");
          return;
        }

        alert(`
Booking Details:
Car: ${booking.carName}
Name: ${booking.name}
Phone: ${booking.phone}
Pickup: ${new Date(booking.pickup).toLocaleString()}
Return: ${new Date(booking.return).toLocaleString()}
Booking ID: ${booking.id}
Priced at: ₹${(cars.find(c => String(c.id) === String(booking.carId))?.price) || 'N/A'} / day
        `);
      });
    });
  } // end renderBookingsForCurrentUser

  // Call it once on load
  renderBookingsForCurrentUser();

  /* -------------------------
     Small extra: ensure navbar updates on page load
  ------------------------- */
  updateNavAuth();

  /* -------------------------
     Chatbot booking logic
  ------------------------- */

  // Chatbot global state
  let chatbotBookingFlow = null; // separate from modal bookingFlow used earlier

  const chatInput = qs('#chatbot-input');
  const chatMessages = qs('#chatbot-messages');

  // parseDateTime: accept "YYYY-MM-DD HH:MM" and standard formats
  function parseDateTime(str) {
    if (!str) return null;
    // try native parse first
    let d = new Date(str);
    if (!isNaN(d)) return d;
    // try replace space with T
    d = new Date(str.replace(' ', 'T'));
    if (!isNaN(d)) return d;
    // fallback: try ISO-like adjustments
    try {
      const cleaned = str.trim().replace(/\s+/g, ' ');
      return new Date(cleaned);
    } catch (e) {
      return null;
    }
  }

  function chatAddMessage(msg, sender = 'bot') {
    if (!chatMessages) return;
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = msg;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Listen for chatbot input
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim()) {
      const userMsg = chatInput.value.trim();
      chatAddMessage(userMsg, 'user');
      chatInput.value = '';
      setTimeout(() => {
        chatHandleResponse(userMsg.trim());
      }, 250);
    }
  });

  // Helper: availability for chatbot uses the same getLiveAvailable
  // Chatbot handler
  function chatHandleResponse(rawMsg) {
    const msg = rawMsg.trim().toLowerCase();
    const loggedUser = getLoggedInUser();
    if (!loggedUser) {
      chatAddMessage("Please login first to manage bookings.", 'bot');
      return;
    }

    if (chatbotBookingFlow && typeof chatbotBookingFlow.step === 'number' && chatbotBookingFlow.step >= 1 && chatbotBookingFlow.step <= 5) {
      chatContinueBookingFlow(msg, loggedUser);
      return;
    }

    if (msg.includes('book') || msg.includes('rent')) {
      chatbotBookingFlow = { step: 1, data: {} };
      chatAddMessage("Great! Let's book a car. What type of car do you want? (SUV / Sedan / Hatchback / EV)", 'bot');
      return;
    }

    if (msg.includes('cancel') && msg.includes('booking')) {
      const bookings = getBookings().filter(b => String(b.userId) === String(loggedUser.id));
      if (!bookings.length) {
        chatAddMessage("You have no active bookings to cancel.", 'bot');
        return;
      }
      chatAddMessage(`You can cancel your bookings on the 'Bookings' page. Your bookings: ${bookings.map(b => b.carName).join(', ')}`, 'bot');
      return;
    }

    if (msg.includes('discount')) {
      chatAddMessage("All bookings via this bot get a 5% discount automatically!", 'bot');
      return;
    }

    chatAddMessage("I'm here to help with bookings. Type 'Book a car' to start.", 'bot');
  }

  function chatContinueBookingFlow(msg, loggedUser) {
    msg = msg.trim().toLowerCase();
    switch (chatbotBookingFlow.step) {
      case 1: // type
        if (!['suv','sedan','hatchback','ev'].includes(msg)) {
          chatAddMessage("Please enter a valid car type: SUV / Sedan / Hatchback / EV", 'bot');
          return;
        }
        chatbotBookingFlow.data.type = msg;
        chatbotBookingFlow.step++;
        chatAddMessage("Which city do you want to pick up the car from? (Mumbai / Delhi / Bangalore / Hyderabad / Chennai)", 'bot');
        break;

      case 2: // location
        const validLocations = ['mumbai','delhi','bangalore','hyderabad','chennai'];
        if (!validLocations.includes(msg)) {
          chatAddMessage("Please enter a valid city: Mumbai / Delhi / Bangalore / Hyderabad / Chennai", 'bot');
          return;
        }
        chatbotBookingFlow.data.location = msg.charAt(0).toUpperCase() + msg.slice(1);
        chatbotBookingFlow.step++;
        chatAddMessage("When do you want to pick up the car? (YYYY-MM-DD HH:MM)", 'bot');
        break;

      case 3: // pickup
        const pickupDate = parseDateTime(msg);
        if (!pickupDate || pickupDate < new Date()) {
          chatAddMessage("Pickup date/time must be valid and in the future. Use format YYYY-MM-DD HH:MM", 'bot');
          return;
        }
        chatbotBookingFlow.data.pickup = pickupDate.toISOString();
        chatbotBookingFlow.step++;
        chatAddMessage("When will you return the car? (YYYY-MM-DD HH:MM)", 'bot');
        break;

      case 4: // return
        const returnDate = parseDateTime(msg);
        const pickup = new Date(chatbotBookingFlow.data.pickup);
        if (!returnDate || returnDate <= pickup) {
          chatAddMessage("Return date/time must be after pickup date/time.", 'bot');
          return;
        }
        chatbotBookingFlow.data.return = returnDate.toISOString();

        // find available cars matching criteria
        const availableCars = cars.filter(c =>
          c.type.toLowerCase() === chatbotBookingFlow.data.type &&
          c.location.toLowerCase() === chatbotBookingFlow.data.location.toLowerCase() &&
          getLiveAvailable(c, chatbotBookingFlow.data.pickup, chatbotBookingFlow.data.return) > 0
        );

        if (!availableCars.length) {
          chatAddMessage("Sorry, no cars available for your selection.", 'bot');
          chatbotBookingFlow = null;
          return;
        }

        chatbotBookingFlow.data.availableCars = availableCars;
        const availabilityMsg = availableCars
          .map((c, i) => `${i+1}. ${c.name} (${getLiveAvailable(c, chatbotBookingFlow.data.pickup, chatbotBookingFlow.data.return)} available)`)
          .join('\n');

        chatAddMessage(`Available cars:\n${availabilityMsg}\nPlease type the number of the car you want to book.`, 'bot');
        chatbotBookingFlow.step = 5;
        break;

      case 5: // selection
        const choice = parseInt(msg);
        const carsList = chatbotBookingFlow.data.availableCars;
        if (isNaN(choice) || choice < 1 || choice > carsList.length) {
          chatAddMessage(`Please type a valid number between 1 and ${carsList.length}`, 'bot');
          return;
        }

        const selectedCar = carsList[choice - 1];
        const pickupDateObj = new Date(chatbotBookingFlow.data.pickup);
        const ret = new Date(chatbotBookingFlow.data.return);
        const days = Math.max(1, Math.ceil((ret - pickupDateObj) / (1000 * 60 * 60 * 24)));
        let totalPrice = selectedCar.price * days;

        // Apply 5% chatbot discount
        const discountRate = 0.05;
        const discountAmount = Math.round(totalPrice * discountRate);
        totalPrice = totalPrice - discountAmount;

        // Build booking using same keys as modal version
        const bookings = getBookings();
        const newBooking = {
          id: Date.now(),
          userId: loggedUser.id,
          userEmail: loggedUser.email,
          carId: selectedCar.id,
          carName: selectedCar.name,
          name: loggedUser.name,
          phone: loggedUser.phone,
          licence: loggedUser.licence,
          aadhar: loggedUser.aadhar,
          pickup: chatbotBookingFlow.data.pickup,
          return: chatbotBookingFlow.data.return,
          totalPrice,
          discountApplied: "5% chatbot discount",
          createdAt: new Date().toISOString()
        };

        bookings.push(newBooking);
        saveBookings(bookings);

        chatAddMessage(
          `✅ Booking confirmed! ${selectedCar.name} is reserved from ${pickupDateObj.toLocaleString()} to ${ret.toLocaleString()}.\n💰 Total Price: ₹${totalPrice.toLocaleString()} (5% chatbot discount applied)`,
          'bot'
        );

        // Re-render bookings and fleet where relevant
        renderBookingsForCurrentUser();
        renderFleet();

        // Reset chatbot flow so user can make another booking
        chatbotBookingFlow = null;
        break;
    } // end switch
  } // end chatContinueBookingFlow

}); // DOMContentLoaded end
