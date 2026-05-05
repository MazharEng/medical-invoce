// Medicines CRUD using localStorage key 'medicines'
const MED_KEY = 'medicines';

// Fallback UID generator in case appUtils not loaded
function generateUID(){
  return Date.now() + Math.floor(Math.random() * 10000);
}

// Fallback currency formatter
function formatCurrency(value){
  if(window.appUtils && window.appUtils.formatCurrency){
    return window.appUtils.formatCurrency(value);
  }
  return Number(value).toFixed(2);
}

function getMedicines(){
  try{ 
    const data = localStorage.getItem(MED_KEY) || '[]';
    return JSON.parse(data);
  }catch(e){ 
    console.error('Error loading medicines:', e);
    return [];
  }
}
function saveMedicines(list){
  try{
    localStorage.setItem(MED_KEY, JSON.stringify(list));
    console.log('Medicines saved:', list.length);
  }catch(e){
    console.error('Error saving medicines:', e);
  }
}

// Add or update medicine
function upsertMedicine(med){
  const list = getMedicines();
  if(med.id){
    const idx = list.findIndex(m=>m.id===med.id);
    if(idx>-1) list[idx]=med;
    else list.push(med);
  } else {
    // Use appUtils if available, otherwise use fallback
    med.id = (window.appUtils && window.appUtils.uid) ? window.appUtils.uid() : generateUID();
    list.push(med);
  }
  saveMedicines(list);
  // refresh dashboard if present
  if(window.invoiceStore && window.invoiceStore.updateDashboardSummary) window.invoiceStore.updateDashboardSummary();
}

function deleteMedicine(id){
  const list = getMedicines().filter(m=>m.id!==id);
  saveMedicines(list);
  if(window.invoiceStore && window.invoiceStore.updateDashboardSummary) window.invoiceStore.updateDashboardSummary();
}

function findMedicineById(id){
  return getMedicines().find(m=>m.id===id);
}

// UI bindings for add-medicine page
document.addEventListener('DOMContentLoaded', ()=>{
  console.log('Medicine page loaded');
  
  // If medicines table exists, initialize
  const medTableBody = document.querySelector('#medicines-table tbody');
  if(medTableBody){
    console.log('Initializing medicines page...');
    renderMedicines();

    const searchInput = document.getElementById('search-medicine');
    if(searchInput){
      searchInput.addEventListener('input', (e)=>{
        renderMedicines(e.target.value.trim());
      });
    }

    // Form
    const form = document.getElementById('medicine-form');
    if(!form){
      console.error('Medicine form not found!');
      return;
    }
    
    console.log('Form found, attaching submit handler');
    
    form.addEventListener('submit', (ev)=>{
      console.log('Form submit triggered');
      ev.preventDefault();
      ev.stopPropagation();
      
      // Get all field values first for debugging
      const nameVal = document.getElementById('med-name').value.trim();
      const batchVal = document.getElementById('med-batch').value.trim();
      const priceVal = document.getElementById('med-price').value;
      const qtyVal = document.getElementById('med-qty').value;
      const expiryVal = document.getElementById('med-expiry').value;
      
      console.log('Field values:', { nameVal, batchVal, priceVal, qtyVal, expiryVal });
      
      // Check browser validation
      const isValid = form.checkValidity();
      console.log('Form validity:', isValid);
      
      if(!isValid){
        console.log('Form validation failed - showing which fields are invalid:');
        const inputs = form.querySelectorAll('input');
        inputs.forEach(inp => {
          if(!inp.checkValidity()){
            console.log(`  ❌ ${inp.id}: ${inp.validationMessage}`);
          }
        });
        form.classList.add('was-validated');
        return;
      }
      
      const id = document.getElementById('medicine-id').value || null;
      const med = {
        id: id? Number(id): null,
        name: nameVal,
        batch: batchVal,
        price: Number(priceVal),
        quantity: Number(qtyVal),
        expiry: expiryVal
      };
      
      console.log('Medicine data collected:', med);
      
      // Validate data
      if(!med.name || !med.batch || isNaN(med.price) || med.price < 0 || isNaN(med.quantity) || med.quantity < 0 || !med.expiry){
        console.error('Validation failed:', med);
        alert('Please fill all fields correctly');
        return;
      }
      
      console.log('Calling upsertMedicine...');
      upsertMedicine(med);
      console.log('Medicine saved successfully');
      
      // Show success feedback
      const saveBtn = form.querySelector('button[type="submit"]');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✅ Saved!';
      saveBtn.disabled = true;
      
      setTimeout(() => {
        // reset
        form.reset();
        form.classList.remove('was-validated');
        const modalEl = document.getElementById('medicineModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();
        renderMedicines();
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }, 800);
    });

    // BACKUP: Also attach to save button directly in case form submit doesn't fire
    const saveBtn = form.querySelector('button[type="submit"]');
    if(saveBtn){
      console.log('Also attaching direct click handler to save button as backup');
      saveBtn.addEventListener('click', (e) => {
        console.log('Save button clicked directly');
        // The form submit handler above should handle it, but this logs the click
      });
    }

    // When modal shown for add
    const modalEl = document.getElementById('medicineModal');
    if(modalEl){
      modalEl.addEventListener('show.bs.modal', (event) => {
        console.log('Modal opening, relatedTarget:', event.relatedTarget?.id);
        // Check if triggered by add button (not edit)
        if(event.relatedTarget && event.relatedTarget.id === 'add-medicine-btn'){
          console.log('Resetting form for new medicine');
          document.getElementById('medicineModalLabel').textContent = 'Add Medicine';
          document.getElementById('medicine-id').value = '';
          form.reset();
          form.classList.remove('was-validated');
        }
      });
    }
  } else {
    console.log('Medicine table not found on this page');
  }
});

function renderMedicines(filter=''){
  const tbody = document.querySelector('#medicines-table tbody');
  if(!tbody) return;
  const list = getMedicines();
  const f = filter.toLowerCase();
  tbody.innerHTML = '';
  
  const filtered = list.filter(m=>!f || m.name.toLowerCase().includes(f) || m.batch.toLowerCase().includes(f));
  
  if(filtered.length === 0){
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No medicines found. Click "Add Medicine" to get started.</td></tr>';
    return;
  }
  
  filtered.forEach((m, i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td class="${m.quantity<10? 'low-stock':''}">${m.name}</td>
      <td>${m.batch}</td>
      <td>${formatCurrency(m.price)}</td>
      <td>${m.quantity}</td>
      <td>${m.expiry}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary me-1 edit-med" data-id="${m.id}">✏️ Edit</button>
        <button class="btn btn-sm btn-outline-danger del-med" data-id="${m.id}">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // attach actions
  document.querySelectorAll('.edit-med').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      const med = findMedicineById(id);
      if(!med) return;
      document.getElementById('medicineModalLabel').textContent = 'Edit Medicine';
      document.getElementById('medicine-id').value = med.id;
      document.getElementById('med-name').value = med.name;
      document.getElementById('med-batch').value = med.batch;
      document.getElementById('med-price').value = med.price;
      document.getElementById('med-qty').value = med.quantity;
      document.getElementById('med-expiry').value = med.expiry;
      const modal = new bootstrap.Modal(document.getElementById('medicineModal'));
      modal.show();
    });
  });
  document.querySelectorAll('.del-med').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(confirm('Delete this medicine?')){
        deleteMedicine(Number(btn.dataset.id));
        renderMedicines();
      }
    });
  });
}

// Expose for invoice page
window.medStore = { getMedicines, findMedicineById, upsertMedicine, deleteMedicine };
