// ===============================
// NAVIGATION FUNCTION
// ===============================

function navigate(page){

  window.location.href = page;

}

// ===============================
// RENDER BOTTOM NAV
// ===============================

export function renderBottomNav(active){

return `

<div class="bottom-nav">

  <!-- HOME -->
  <button
    class="nav-item ${active==="home"?"active":""}"

    onclick="navigate('home.html')">

    <svg viewBox="0 0 24 24" class="nav-icon">

      <path d="M3 10.5L12 3l9 7.5"/>
      <path d="M5 10v10h14V10"/>

    </svg>

    <span>Home</span>

  </button>


  <!-- BUY -->
  <button
    class="nav-item ${active==="buy"?"active":""}"

    onclick="navigate('services.html')">

    <svg viewBox="0 0 24 24" class="nav-icon">

      <path d="M12 2v20"/>
      <path d="M5 12h14"/>

    </svg>

    <span>Buy</span>

  </button>


  <!-- REWARD -->
  <button
    class="nav-item ${active==="reward"?"active":""}"

    onclick="navigate('cashback.html')">

    <svg viewBox="0 0 24 24" class="nav-icon">

      <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"/>

    </svg>

    <span>Rewards</span>

  </button>


  <!-- HISTORY -->
  <button
    class="nav-item ${active==="history"?"active":""}"

    onclick="navigate('transactions.html')">

    <svg viewBox="0 0 24 24" class="nav-icon">

      <path d="M12 8v5l3 2"/>
      <circle cx="12" cy="12" r="9"/>

    </svg>

    <span>History</span>

  </button>


  <!-- PROFILE -->
  <button
    class="nav-item ${active==="profile"?"active":""}"

    onclick="navigate('profile.html')">

    <svg viewBox="0 0 24 24" class="nav-icon">

      <circle cx="12" cy="8" r="4"/>
      <path d="M5 20c1.5-3.5 5-5 7-5s5.5 1.5 7 5"/>

    </svg>

    <span>Profile</span>

  </button>

</div>

`;

}

window.navigate = navigate;