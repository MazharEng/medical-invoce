# 💊 Medical Invoice System

A modern, browser-based medical store invoice generator using HTML, CSS, JavaScript, and Bootstrap 5.

## ✨ Features

- 💊 **Medicines Management** - Add/edit/delete medicines with batch tracking
- 📄 **Invoice Generation** - Create invoices with auto-calculations (5% tax)
- 📊 **Dashboard** - View statistics, low stock alerts, and recent invoices
- 🔍 **Search & Filter** - Find medicines by name or batch number
- ⚠️ **Low Stock Alerts** - Automatic warnings for medicines with quantity < 10
- 🌙 **Dark Mode** - Toggle between light and dark themes (persists across pages)
- 💾 **Local Storage** - All data stored in browser (no server needed)
- 🖨️ **Print Ready** - Generate professional printable invoices
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ✅ **Stock Validation** - Prevents overselling with real-time stock checks

## 🚀 Getting Started

### Quick Start

1. Open `index.html` in your web browser
2. Add medicines from the **💊 Medicines** page
3. Create invoices from the **📄 Invoices** page
4. View statistics on the **🏠 Dashboard**

### Project Structure

```
medical-invoice/
├── index.html              # Dashboard page
├── add-medicine.html       # Medicine management
├── invoice.html            # Invoice creation
├── css/
│   └── style.css          # Modern custom styles
├── js/
│   ├── main.js            # Utilities & dark mode
│   ├── medicine.js        # Medicine CRUD operations
│   └── invoice.js         # Invoice management
├── assets/
│   └── logo.svg           # Application logo
└── README.md              # This file
```

## 📖 How to Use

### Managing Medicines

1. Navigate to **💊 Medicines** page
2. Click **➕ Add Medicine** button
3. Fill in the form:
   - Name (required)
   - Batch number (required)
   - Price (required)
   - Quantity/Stock (required)
   - Expiry Date (required)
4. Click **Save** to add medicine
5. Use search box to find medicines
6. Click **✏️ Edit** to update or **🗑️ Delete** to remove

### Creating Invoices

1. Navigate to **📄 Invoices** page
2. Invoice number auto-generates
3. Enter customer name and date
4. Click **➕ Add Item** to add medicine rows
5. Select medicine from dropdown (shows price and stock)
6. Enter quantity (validates against available stock)
7. Totals calculate automatically (subtotal + 5% tax)
8. Click **💾 Save Invoice** to create
9. Click **🖨️ Print** to generate printable version

### Dashboard Overview

- **Total Medicines** - Count of medicines in inventory
- **Total Invoices** - Count of all invoices created
- **Low Stock Alerts** - Lists medicines with quantity < 10
- **Recent Invoices** - Shows last 5 invoices with details

## 🎨 Modern Design

### Visual Features

- Clean, professional interface with smooth animations
- Indigo primary color (#4f46e5) with excellent contrast
- Card-based layout with hover effects
- Rounded corners and subtle shadows
- Icon-enhanced navigation and buttons
- Smooth transitions and micro-interactions

### Dark Mode

- Toggle using 🌙 switch in top-right navigation
- Setting persists across all pages
- Instant application without page flash
- Accessible on all pages

## 💾 Data Storage

All data is stored locally in your browser's `localStorage`:

### Storage Keys

- **medicines** - Array of medicine objects
- **invoices** - Array of invoice objects
- **darkMode** - Boolean theme preference

### Medicine Object Structure

```json
{
  "id": 1234567890,
  "name": "Paracetamol",
  "batch": "B001",
  "price": 50,
  "quantity": 100,
  "expiry": "2025-12-31"
}
```

### Invoice Object Structure

```json
{
  "id": 1,
  "customer": "John Doe",
  "date": "2025-10-20",
  "items": [
    {
      "id": 1234567890,
      "name": "Paracetamol",
      "qty": 2,
      "price": 50
    }
  ],
  "subtotal": 100,
  "tax": 5,
  "total": 105
}
```

## 🔧 Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom modern design with animations
- **JavaScript (ES6+)** - Vanilla JavaScript, no frameworks
- **Bootstrap 5.3.2** - Responsive grid and components
- **LocalStorage API** - Client-side data persistence

## 🌐 Browser Compatibility

Works on all modern browsers:

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

**Note:** Requires JavaScript enabled and localStorage support.

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## 🔒 Data Management

### Clear All Data

Click **🗑️ Clear Data** in navigation to remove all stored data.

**Warning:** This action cannot be undone!

### Export/Backup

Data is stored in browser's localStorage. To backup:

1. Open browser's Developer Tools (F12)
2. Go to Application/Storage tab
3. Find localStorage entries
4. Copy `medicines` and `invoices` data

## ⚡ Key Features Explained

### Auto-Calculations

- Line totals = Price × Quantity
- Subtotal = Sum of all line totals
- Tax = Subtotal × 5%
- Total = Subtotal + Tax

### Stock Management

- Stock decreases automatically when invoice is saved
- Validates quantity before saving
- Shows current stock in medicine dropdown
- Alerts if insufficient stock

### Invoice Numbering

- Sequential auto-increment (1, 2, 3, ...)
- Calculated from existing invoices
- Cannot be manually changed

## 🐛 Troubleshooting

### No medicines showing in dropdown

**Solution:** Add medicines first from the Medicines page

### Invoice not saving

**Solution:** Ensure all required fields are filled and quantities are valid

### Dark mode not persisting

**Solution:** Check if browser allows localStorage access

### Data disappeared

**Solution:** Check if browser storage was cleared or in private/incognito mode

## 📄 License

This project is open source and available for personal and commercial use.

## 👨‍💻 Development

### File Descriptions

- **main.js** - Common utilities, dark mode toggle, year placeholders
- **medicine.js** - Medicine CRUD operations, search, validation
- **invoice.js** - Invoice creation, stock validation, printing, dashboard updates

### Code Features

- Modular JavaScript architecture
- Fallback functions for reliability
- Comprehensive error handling
- Console logging for debugging
- Form validation with Bootstrap

## 🎯 Future Enhancements (Optional)

- Export invoices to PDF
- Medicine categories
- Expiry date warnings
- Sales reports and analytics
- Multi-currency support
- Barcode scanning

---

**Version:** 1.0  
**Last Updated:** October 20, 2025  
**Status:** Production Ready ✅

**Note:** This is a client-side only application. No backend, server, or database required!
