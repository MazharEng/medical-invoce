// Apply dark mode immediately (before DOMContentLoaded) to prevent flash
(function(){
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  if(savedDarkMode) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }
})();

// Navbar utilities, dark mode, and common functions
document.addEventListener('DOMContentLoaded', () => {
  // Year placeholders
  const y = new Date().getFullYear();
  const year1 = document.getElementById('year');
  const year2 = document.getElementById('year2');
  const year3 = document.getElementById('year3');
  if(year1) year1.textContent = y;
  if(year2) year2.textContent = y;
  if(year3) year3.textContent = y;

  // Dark mode toggle
  const toggle = document.getElementById('darkModeToggle');
  if(toggle){
    const saved = localStorage.getItem('darkMode') === 'true';
    toggle.checked = saved;
    toggle.addEventListener('change', () => {
      const isDark = toggle.checked;
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('darkMode', isDark);
    });
  }

  // Clear all data
  const clearLink = document.getElementById('clear-data');
  if(clearLink){
    clearLink.addEventListener('click', (e)=>{
      e.preventDefault();
      if(confirm('Clear all local data (medicines & invoices)?')){
        localStorage.removeItem('medicines');
        localStorage.removeItem('invoices');
        location.reload();
      }
    })
  }
});

// small helper
function uid(){
  return Date.now() + Math.floor(Math.random()*1000);
}

function formatCurrency(v){
  return Number(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Export helpers for other modules
window.appUtils = { uid, formatCurrency };
