// Invoice logic using localStorage key 'invoices'
const INV_KEY = 'invoices';
const TAX_RATE = 0.05;

// Fallback formatCurrency if appUtils not loaded
function formatCurrency(value){
  if(window.appUtils && window.appUtils.formatCurrency){
    return window.appUtils.formatCurrency(value);
  }
  return Number(value).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}

function getInvoices(){
  try{ return JSON.parse(localStorage.getItem(INV_KEY) || '[]'); }catch(e){ 
    console.error('Error loading invoices:', e);
    return [];
  }
}
function saveInvoices(list){
  try{
    localStorage.setItem(INV_KEY, JSON.stringify(list));
    console.log('Invoices saved:', list.length);
  }catch(e){
    console.error('Error saving invoices:', e);
  }
}

function nextInvoiceNo(){
  const list = getInvoices();
  const max = list.reduce((a,b)=> {
    const val = Number(String(b.id).replace('#',''));
    return Math.max(a, isNaN(val)?0:val);
  }, 1000);
  return '#' + (max+1);
}

function addInvoice(inv){
  inv.id = nextInvoiceNo();
  const list = getInvoices();
  list.push(inv);
  saveInvoices(list);
  // update dashboard
  updateDashboardSummary();
}

function deleteInvoice(id){
  const list = getInvoices().filter(i=>String(i.id)!==String(id));
  saveInvoices(list);
  updateDashboardSummary();
}

// UI bindings
document.addEventListener('DOMContentLoaded', ()=>{
  const invoiceForm = document.getElementById('invoice-form');
  if(invoiceForm){
    // fill invoice no and date
    document.getElementById('invoice-no').value = nextInvoiceNo();
    document.getElementById('invoice-date').value = new Date().toISOString().slice(0,10);

    // item add
    document.getElementById('add-item').addEventListener('click', addInvoiceRow);
    renderInvoiceItems([]);
    renderInvoicesTable();

    document.getElementById('save-invoice').addEventListener('click', (e)=>{
      e.preventDefault();
      
      console.log('Save invoice clicked');
      
      if(!invoiceForm.checkValidity()){
        invoiceForm.classList.add('was-validated');
        console.warn('Form validation failed');
        return;
      }
      
      if(!window.medStore || !window.medStore.findMedicineById){
        alert('Error: Medicine system not loaded. Please refresh the page.');
        console.error('medStore not available during save');
        return;
      }
      
      const inv = buildInvoiceFromForm();
      console.log('Built invoice:', inv);
      
      // validate items
      if(!inv.items || inv.items.length===0){
        return alert('Add at least one medicine to save invoice');
      }
      
      // check stock availability
      for(const it of inv.items){
        const med = window.medStore.findMedicineById(it.id);
        if(!med) return alert(`Medicine not found: ${it.name}`);
        if(it.qty > med.quantity){
          return alert(`Insufficient stock for ${med.name}. Available: ${med.quantity}`);
        }
      }
      
      // all good -> reduce stock now
      for(const it of inv.items){
        const med = window.medStore.findMedicineById(it.id);
        med.quantity = Math.max(0, med.quantity - it.qty);
        window.medStore.upsertMedicine(med);
      }
      
      addInvoice(inv);
      console.log('Invoice saved successfully');
      alert('Invoice saved successfully!');
      
      // reset
      invoiceForm.reset();
      document.getElementById('invoice-no').value = nextInvoiceNo();
      document.getElementById('invoice-date').value = new Date().toISOString().slice(0,10);
      renderInvoiceItems([]);
      renderInvoicesTable();
    });

    document.getElementById('print-invoice').addEventListener('click', ()=>{
      const inv = buildInvoiceFromForm();
      inv.id = document.getElementById('invoice-no').value;
      if(!inv.items || inv.items.length === 0) return alert('Please add items to print');
      printInvoiceWindow(inv);
    });
  }
  
  // Render recent invoices table if on dashboard
  const recentTable = document.querySelector('#recent-invoices-table tbody');
  if(recentTable){
    renderInvoicesTable();
  }
  
  // update dashboard summary if present
  updateDashboardSummary();
});

function addInvoiceRow(){
  const tbody = document.querySelector('#invoice-items-table tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <select class="form-select med-select">
        <option value="">-- select --</option>
      </select>
    </td>
    <td><input type="number" class="form-control price" min="0" step="0.01" readonly></td>
    <td><input type="number" class="form-control qty" min="1" value="1"></td>
    <td class="line-total">0</td>
    <td><button class="btn btn-sm btn-danger remove-item">X</button></td>
  `;
  tbody.appendChild(tr);
  populateMedSelect(tr.querySelector('.med-select'));

  tr.querySelector('.med-select').addEventListener('change', (e)=>{
    const id = Number(e.target.value);
    if(!window.medStore || !window.medStore.findMedicineById){
      console.error('medStore not available!');
      alert('Error: Medicine system not loaded. Please refresh the page.');
      return;
    }
    
    const med = window.medStore.findMedicineById(id);
    if(med){
      tr.querySelector('.price').value = med.price;
      tr.querySelector('.qty').value = 1;
      updateRowTotal(tr);
    } else {
      tr.querySelector('.price').value = '';
      tr.querySelector('.line-total').textContent = '0';
    }
  });

  tr.querySelector('.qty').addEventListener('input', ()=> updateRowTotal(tr));
  tr.querySelector('.remove-item').addEventListener('click', ()=>{ tr.remove(); calculateTotals(); });
}

function populateMedSelect(select){
  if(!window.medStore || !window.medStore.getMedicines){
    console.error('medStore not available! Make sure medicine.js is loaded before invoice.js');
    select.innerHTML = '<option value="">Error: Medicine system not loaded</option>';
    return;
  }
  
  const meds = window.medStore.getMedicines();
  if(!meds || meds.length === 0){
    select.innerHTML = '<option value="">No medicines available - Add medicines first</option>';
    console.warn('No medicines in storage. Add medicines from the Add Medicine page.');
    return;
  }
  select.innerHTML = '<option value="">-- select --</option>' + meds.map(m=>`<option value="${m.id}">${m.name} (B:${m.batch}) - ${formatCurrency(m.price)}</option>`).join('');
}

function updateRowTotal(tr){
  const price = Number(tr.querySelector('.price').value) || 0;
  const qty = Number(tr.querySelector('.qty').value) || 0;
  tr.querySelector('.line-total').textContent = formatCurrency(price*qty);
  calculateTotals();
}

function calculateTotals(){
  const rows = document.querySelectorAll('#invoice-items-table tbody tr');
  let subtotal = 0;
  rows.forEach(r=>{
    const lt = Number((r.querySelector('.line-total').textContent||'0').replace(/,/g,'')) || 0;
    subtotal += lt;
  });
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('tax').textContent = formatCurrency(tax);
  document.getElementById('total').textContent = formatCurrency(total);
}

function buildInvoiceFromForm(){
  if(!window.medStore || !window.medStore.findMedicineById){
    console.error('medStore not available in buildInvoiceFromForm');
    return { items: [] };
  }
  
  const items = [];
  document.querySelectorAll('#invoice-items-table tbody tr').forEach(r=>{
    const sel = r.querySelector('.med-select');
    const id = Number(sel.value);
    if(!id) return;
    const med = window.medStore.findMedicineById(id);
    if(!med) {
      console.error('Medicine not found for id:', id);
      return;
    }
    const qty = Number(r.querySelector('.qty').value) || 0;
    items.push({ id: med.id, name: med.name, qty, price: med.price });
  });
  
  // recompute totals to be safe
  let subtotal = 0;
  items.forEach(it=> subtotal += (it.price * it.qty));
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  
  const inv = {
    id: null,
    customer: 'Walk-in',
    date: document.getElementById('invoice-date').value,
    items,
    subtotal,
    tax,
    total
  };
  return inv;
}

function renderInvoiceItems(list){
  const tbody = document.querySelector('#invoice-items-table tbody');
  tbody.innerHTML = '';
  if(list.length===0) addInvoiceRow();
}

function renderInvoicesTable(){
  const tbody = document.querySelector('#invoices-table tbody');
  const recent = document.querySelector('#recent-invoices-table tbody');
  
  // If neither table exists, return early
  if(!tbody && !recent) return;
  
  const list = getInvoices().slice().reverse();
  
  // Render main invoices table if it exists (invoice.html page)
  if(tbody){
    tbody.innerHTML = '';
    if(list.length === 0){
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No invoices yet. Create your first invoice above!</td></tr>';
    } else {
      list.forEach((inv, i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${inv.id}</td>
          <td>${inv.date}</td>
          <td>${formatCurrency(inv.total)}</td>
          <td>
            <button class="btn btn-sm btn-outline-secondary view-inv" data-id="${inv.id}">👁️ View</button>
            <button class="btn btn-sm btn-outline-danger del-inv" data-id="${inv.id}">🗑️ Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Render recent invoices table if it exists (index.html dashboard)
  if(recent){
    recent.innerHTML = '';
    const slice = getInvoices().slice(-5).reverse();
    if(slice.length === 0){
      recent.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No invoices yet</td></tr>';
    } else {
      slice.forEach(inv=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${inv.id}</td><td>${inv.date}</td><td>${formatCurrency(inv.total)}</td><td><button class="btn btn-sm btn-outline-secondary view-inv" data-id="${inv.id}">👁️ View</button></td>`;
        recent.appendChild(tr);
      });
    }
  }

  // attach actions
  document.querySelectorAll('.del-inv').forEach(b=> b.addEventListener('click', ()=>{
    if(confirm('Delete invoice?')){ deleteInvoice(b.dataset.id); renderInvoicesTable(); }
  }));

  document.querySelectorAll('.view-inv').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.dataset.id;
    const inv = getInvoices().find(i=>String(i.id)===id);
    if(!inv) return alert('Invoice not found');
    printInvoiceWindow(inv);
  }));
}

function updateDashboardSummary(){
  try {
    // total invoices
    const invCount = getInvoices().length;
    const totalInvoicesEl = document.getElementById('total-invoices');
    if(totalInvoicesEl) {
      totalInvoicesEl.textContent = invCount;
    }
    
    if(window.medStore && window.medStore.getMedicines){
      const meds = window.medStore.getMedicines();
      const medCount = meds.length;
      const totalMedicinesEl = document.getElementById('total-medicines');
      if(totalMedicinesEl) {
        totalMedicinesEl.textContent = medCount;
      }
      
      // low stock
      const low = meds.filter(m=>m.quantity<10);
      const list = document.getElementById('low-stock-list');
      if(list){
        list.innerHTML = low.length? low.map(m=>`<li class="low-stock">${m.name} (qty: ${m.quantity})</li>`).join('') : '<li>None</li>';
      }
    } else {
      console.warn('medStore not available in updateDashboardSummary');
    }
  } catch(e) {
    console.error('Error updating dashboard summary:', e);
  }
}

function printInvoiceWindow(inv){
  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice #${inv.id}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;max-width:800px}
        h1{text-align:center;margin-bottom:10px}
        .header{text-align:center;margin-bottom:30px}
        .info{display:flex;justify-content:space-between;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        th,td{border:1px solid #ddd;padding:10px;text-align:left}
        th{background:#f5f5f5}
        .total-row{font-weight:bold}
        .text-right{text-align:right}
        @media print{body{margin:20px}}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Medical Invoice</h1>
        <p>Invoice #${inv.id}</p>
      </div>
      <div class="info">
        <div><strong>Date:</strong> ${inv.date}</div>
      </div>
      <table>
        <thead>
          <tr><th>Medicine</th><th>Price</th><th>Qty</th><th class="text-right">Total</th></tr>
        </thead>
        <tbody>
          ${inv.items.map(it=>`<tr><td>${it.name}</td><td>${formatCurrency(it.price)}</td><td>${it.qty}</td><td class="text-right">${formatCurrency(it.price*it.qty)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div style="text-align:right;max-width:300px;margin-left:auto">
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span>Subtotal:</span><span>${formatCurrency(inv.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0"><span>Tax (5%):</span><span>${formatCurrency(inv.tax)}</span></div>
        <div class="total-row" style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #000"><span>Total:</span><span>${formatCurrency(inv.total)}</span></div>
      </div>
      <script>window.onload=()=>window.print()</script>
    </body>
    </html>
  `);
  w.document.close();
}

// expose functions for dashboard
window.invoiceStore = { getInvoices, addInvoice, deleteInvoice, nextInvoiceNo, updateDashboardSummary };
