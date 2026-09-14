/* ==========================================================================
   Small Business Management System — app.js
   --------------------------------------------------------------------------
   Sections:
     1. Utilities
     2. Data layer (mock data, persisted to localStorage for this prototype)
     3. Toast notifications
     4. Confirm dialog
     5. Shared shell behaviour (nav highlight, mobile sidebar)
     6. Dashboard page
     7. Customers page
     8. Products page
     9. Orders page
     10. Sales page
     11. Boot
   --------------------------------------------------------------------------
   WHERE THE BACKEND CONNECTS
   Every place that currently reads/writes through the DataStore object
   (section 2) is exactly where a `fetch('/api/...')` call will replace mock
   logic later. See the comments inside DataStore for the planned endpoints.
   ========================================================================== */

/* -------------------------------------------------------------------------
   1. Utilities
   ------------------------------------------------------------------------- */
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

const API_BASE_URL = "http://127.0.0.1:8000";

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* -------------------------------------------------------------------------
   2. Data layer
   --------------------------------------------------------------------------
   This prototype keeps mock data in localStorage purely so records survive
   navigating between pages (each HTML page is a full reload, not an SPA).
   That is a FRONTEND-ONLY convenience. When the FastAPI backend is wired up,
   every method below gets rewritten to call the REST API instead:

     Customers -> GET/POST /api/customers, PUT/DELETE /api/customers/{id}
     Products  -> GET/POST /api/products,  PUT/DELETE /api/products/{id}
     Orders    -> GET/POST /api/orders
     Sales     -> GET /api/sales

   The rest of the app only talks to DataStore, never to localStorage
   directly — so swapping the implementation below for fetch() calls will
   NOT require touching any page-level rendering code.
   ------------------------------------------------------------------------- */
const DataStore = (() => {
  const KEYS = {
    customers: 'sbms_customers',
    products: 'sbms_products',
    orders: 'sbms_orders',
    seeded: 'sbms_seeded_v1',
  };

  function seed() {
    if (localStorage.getItem(KEYS.seeded)) return;

    const customers = [
      { id: 'CUST-001', name: 'Maria Alonzo', email: 'maria@brewhouse.ph', phone: '0917 234 5566', address: 'Silang, Cavite' },
      { id: 'CUST-002', name: 'Jonas Reyes', email: 'jonas.reyes@gmail.com', phone: '0928 771 0022', address: 'Tagaytay City, Cavite' },
      { id: 'CUST-003', name: 'Bea Fernandez', email: 'bea.f@outlook.com', phone: '0915 402 8891', address: 'Dasmarinas, Cavite' },
      { id: 'CUST-004', name: 'Carlo Uy', email: 'carlo.uy@uymotors.com', phone: '0918 662 1140', address: 'Imus, Cavite' },
      { id: 'CUST-005', name: 'Dianne Santos', email: 'dianne.santos@yahoo.com', phone: '0921 550 3378', address: 'General Trias, Cavite' },
    ];

    const products = [
      { id: 'PRD-001', name: 'Espresso Machine — Countertop', category: 'Equipment', price: 18500, stock: 6, description: 'Dual-boiler countertop espresso machine for small cafes.' },
      { id: 'PRD-002', name: 'Arabica Beans (1kg)', category: 'Supplies', price: 620, stock: 42, description: 'Locally roasted arabica beans, medium roast.' },
      { id: 'PRD-003', name: 'Paper Cups (Box of 500)', category: 'Packaging', price: 850, stock: 15, description: '12oz double-wall paper cups.' },
      { id: 'PRD-004', name: 'Milk Frother — Handheld', category: 'Equipment', price: 450, stock: 0, description: 'Battery-powered handheld milk frother.' },
      { id: 'PRD-005', name: 'Syrup — Vanilla 750ml', category: 'Supplies', price: 380, stock: 9, description: 'Vanilla flavoring syrup, 750ml bottle.' },
      { id: 'PRD-006', name: 'Take-out Bags (Pack of 100)', category: 'Packaging', price: 300, stock: 3, description: 'Kraft paper take-out bags with handles.' },
    ];

    const orders = [
      { id: 'ORD-1001', customerId: 'CUST-001', date: '2026-08-28', status: 'Completed', items: [{ productId: 'PRD-001', qty: 1 }, { productId: 'PRD-002', qty: 4 }] },
      { id: 'ORD-1002', customerId: 'CUST-002', date: '2026-08-30', status: 'Completed', items: [{ productId: 'PRD-003', qty: 2 }] },
      { id: 'ORD-1003', customerId: 'CUST-003', date: '2026-09-02', status: 'Processing', items: [{ productId: 'PRD-005', qty: 3 }, { productId: 'PRD-002', qty: 2 }] },
      { id: 'ORD-1004', customerId: 'CUST-004', date: '2026-09-03', status: 'Pending', items: [{ productId: 'PRD-004', qty: 2 }] },
      { id: 'ORD-1005', customerId: 'CUST-001', date: '2026-09-05', status: 'Completed', items: [{ productId: 'PRD-006', qty: 5 }] },
      { id: 'ORD-1006', customerId: 'CUST-005', date: '2026-09-06', status: 'Cancelled', items: [{ productId: 'PRD-001', qty: 1 }] },
      { id: 'ORD-1007', customerId: 'CUST-002', date: '2026-09-07', status: 'Completed', items: [{ productId: 'PRD-002', qty: 6 }, { productId: 'PRD-005', qty: 1 }] },
      { id: 'ORD-1008', customerId: 'CUST-003', date: '2026-09-08', status: 'Processing', items: [{ productId: 'PRD-003', qty: 1 }] },
    ];

    localStorage.setItem(KEYS.customers, JSON.stringify(customers));
    localStorage.setItem(KEYS.products, JSON.stringify(products));
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
    localStorage.setItem(KEYS.seeded, 'true');
  }

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function nextId(prefix, list, pad = 3, startAt = 1) {
    let max = startAt - 1;
    list.forEach((item) => {
      const num = parseInt(String(item.id).replace(prefix, ''), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    });
    return prefix + String(max + 1).padStart(pad, '0');
  }

  return {
    // ---- Customers ---- GET /api/customers
    getCustomers: () => read(KEYS.customers),
    saveCustomer(customer) {
      const list = read(KEYS.customers);
      if (customer.id) {
        // PUT /api/customers/{id}
        const idx = list.findIndex((c) => c.id === customer.id);
        list[idx] = customer;
      } else {
        // POST /api/customers
        customer.id = nextId('CUST-', list);
        list.push(customer);
      }
      write(KEYS.customers, list);
      return customer;
    },
    deleteCustomer(id) {
      // DELETE /api/customers/{id}
      write(KEYS.customers, read(KEYS.customers).filter((c) => c.id !== id));
    },

    // ---- Products ---- GET /api/products
    getProducts: () => read(KEYS.products),
    saveProduct(product) {
      const list = read(KEYS.products);
      if (product.id) {
        // PUT /api/products/{id}
        const idx = list.findIndex((p) => p.id === product.id);
        list[idx] = product;
      } else {
        // POST /api/products
        product.id = nextId('PRD-', list);
        list.push(product);
      }
      write(KEYS.products, list);
      return product;
    },
    deleteProduct(id) {
      // DELETE /api/products/{id}
      write(KEYS.products, read(KEYS.products).filter((p) => p.id !== id));
    },

    // ---- Orders ---- GET /api/orders
    getOrders: () => read(KEYS.orders),
    saveOrder(order) {
      const list = read(KEYS.orders);
      if (order.id) {
        const idx = list.findIndex((o) => o.id === order.id);
        list[idx] = order;
      } else {
        // POST /api/orders
        order.id = nextId('ORD-', list, 4, 1001);
        list.push(order);
      }
      write(KEYS.orders, list);
      return order;
    },
    deleteOrder(id) {
      write(KEYS.orders, read(KEYS.orders).filter((o) => o.id !== id));
    },

    // ---- Derived helpers ----
    getCustomerById(id) {
      return read(KEYS.customers).find((c) => c.id === id);
    },
    getProductById(id) {
      return read(KEYS.products).find((p) => p.id === id);
    },
    orderTotal(order) {
      return order.items.reduce((sum, line) => {
        const product = this.getProductById(line.productId);
        return sum + (product ? product.price * line.qty : 0);
      }, 0);
    },
    // ---- Sales ---- GET /api/sales — for now, "sales" = completed orders
    getSales() {
      return this.getOrders()
        .filter((o) => o.status === 'Completed')
        .map((o) => ({
          orderId: o.id,
          date: o.date,
          customerId: o.customerId,
          amount: this.orderTotal(o),
          status: o.status,
        }));
    },

    seed,
  };
})();

/* -------------------------------------------------------------------------
   3. Toast notifications (replaces browser alert())
   ------------------------------------------------------------------------- */
function ensureToastStack() {
  let stack = $('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'success', duration = 3400) {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' toast-error' : ''}`;
  toast.innerHTML = `<span class="toast-msg"></span><button class="toast-close" aria-label="Dismiss">&times;</button>`;
  toast.querySelector('.toast-msg').textContent = message;
  const remove = () => toast.remove();
  toast.querySelector('.toast-close').addEventListener('click', remove);
  stack.appendChild(toast);
  setTimeout(remove, duration);
}

/* -------------------------------------------------------------------------
   4. Confirm dialog (custom, not window.confirm)
   ------------------------------------------------------------------------- */
function confirmAction({ title = 'Are you sure?', message = '', confirmLabel = 'Delete', danger = true } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="modal-header">
          <h2 id="confirm-title"></h2>
        </div>
        <div class="modal-body"><p></p></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm"></button>
        </div>
      </div>`;
    overlay.querySelector('h2').textContent = title;
    overlay.querySelector('.modal-body p').textContent = message;
    overlay.querySelector('[data-action="confirm"]').textContent = confirmLabel;

    function close(result) {
      overlay.remove();
      resolve(result);
    }
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', onKey); }
    });

    document.body.appendChild(overlay);
  });
}

/* -------------------------------------------------------------------------
   5. Shared shell behaviour
   ------------------------------------------------------------------------- */
function initShell() {
  // Highlight the active nav link based on the current file name.
  const current = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === current);
  });

  // Mobile sidebar toggle
  const menuBtn = $('.mobile-menu-btn');
  const sidebar = $('.sidebar');
  const scrim = $('.sidebar-scrim');
  if (menuBtn && sidebar && scrim) {
    const open = () => { sidebar.classList.add('open'); scrim.classList.add('open'); };
    const close = () => { sidebar.classList.remove('open'); scrim.classList.remove('open'); };
    menuBtn.addEventListener('click', open);
    scrim.addEventListener('click', close);
    $$('.nav-link').forEach((l) => l.addEventListener('click', close));
  }

  // Generic modal open/close wiring for any [data-modal-target] / [data-modal-close]
  $$('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      btn.closest('.modal-overlay').classList.remove('open');
    });
  });
  $$('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

function openModal(id) {
  $(`#${id}`).classList.add('open');
}
function closeModal(id) {
  $(`#${id}`).classList.remove('open');
}

/* Generic field validation helper: marks .form-field invalid/valid */
function validateField(fieldEl, isValid) {
  fieldEl.classList.toggle('invalid', !isValid);
  return isValid;
}

/* -------------------------------------------------------------------------
   6. Dashboard page
   ------------------------------------------------------------------------- */
 async function initDashboard() {
  try {
    const [customersResponse, productsResponse, orderResponse] =
      await Promise.all([
        fetch(`${API_BASE_URL}/api/customers`),
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/orders`)
      ]);

    if (
      !customersResponse.ok ||
      !productsResponse.ok ||
      !orderResponse.ok
    ) {
      throw new Error('Failed to load dashboard data');
    }

    const customers = await customersResponse.json();
    const products = await productsResponse.json();
    const orders = await orderResponse.json();

    // Statistics
    $('#stat-customers').textContent = customers.length;
    $('#stat-products').textContent = products.length;
    $('#stat-orders').textContent = orders.length;

    // Total Sales
    const totalSales = orders.reduce((sum, order) => {
      return sum + order.total;
    }, 0);

    $('#stat-sales').textContent = formatCurrency(totalSales);

    // Recent Orders
    const recentOrdersBody = $('#recent-orders-body');

    if (orders.length === 0) {
      recentOrdersBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <h3>No orders found</h3>
              <p>Create your first order to get started.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      const recentOrders = [...orders]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

      recentOrdersBody.innerHTML = recentOrders.map((order) => `
        <tr>
          <td class="cell-primary">#${order.id}</td>
          <td>Customer #${order.customer_id}</td>
          <td class="cell-muted">${order.date}</td>
          <td>${formatCurrency(order.total)}</td>
          <td>${escapeHtml(order.status)}</td>
        </tr>
      `).join('');
    }

    console.log('Dashboard customers:', customers);
    console.log('Dashboard products:', products);
    console.log('Dashboard orders:', orders);

    renderMonthlyBarChart('#sales-overview-chart', orders);

  } catch (error) {
    console.error('Dashboard API error:', error);
    showToast('Failed to load dashboard data.');
  }
}

function renderMonthlyBarChart(selector, orders) {
  const container = $(selector);
  if (!container) return;

  const now = new Date('2026-09-09');
  const months = [];

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-US', {
        month: 'short'
      }),
      total: 0
    });
  }

  // Add order totals to the correct month
  orders.forEach((order) => {
    const d = new Date(order.date);

    const key = `${d.getFullYear()}-${d.getMonth()}`;

    const bucket = months.find(
      (m) => m.key === key
    );

    if (bucket) {
      bucket.total += Number(order.total) || 0;
    }
  });

  const max = Math.max(
    ...months.map((m) => m.total),
    1
  );

  container.innerHTML = months.map((m) => `
    <div class="bar-chart-col">
      <span class="bar-chart-value">
        ${m.total
          ? formatCurrency(m.total).replace('.00', '')
          : ''}
      </span>

      <div
        class="bar-chart-bar"
        style="height:${Math.max(
          (m.total / max) * 100,
          3
        )}%"
      ></div>

      <span class="bar-chart-label">
        ${m.label}
      </span>
    </div>
  `).join('');
}

function statusBadge(status) {
  const map = {
    Pending: 'badge-pending',
    Processing: 'badge-processing',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled',
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

/* -------------------------------------------------------------------------
   7. Customers page
   ------------------------------------------------------------------------- */
function initCustomersPage() {
  let searchTerm = '';

  async function render() {
    try {
     const response = await fetch(`${API_BASE_URL}/api/customers`);


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load customers')
      }

      const customers = await response.json();

      const list = customers.filter((c) => {
        const haystack = `${c.name} ${c.email} ${c.phone} ${c.address}`.toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
      });

      const tbody = $('#customers-body');

      if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <h3>No customers found</h3>
          <p>${searchTerm ? 'Try a different search term.' : 'Add your first customer to get started.'}</p>
          ${searchTerm ? '' : '<button class="btn btn-primary" id="empty-add-customer">Add Customer</button>'}
        </div>
      </td></tr>`;

      const emptyBtn = $('#empty-add-customer');

      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => openCustomerForm());
      }

      return;
      }

      tbody.innerHTML = list.map((c) => `
      <tr>
        <td class="cell-primary">${c.id}</td>
        <td>${escapeHtml(c.name)}</td>
        <td class="cell-muted">${escapeHtml(c.email)}</td>
        <td class="cell-muted">${escapeHtml(c.phone)}</td>
        <td class="cell-muted">${escapeHtml(c.address)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" title="View" data-view="${c.id}">${iconEye()}</button>
            <button class="icon-btn" title="Edit" data-edit="${c.id}">${iconEdit()}</button>
            <button class="icon-btn danger" title="Delete" data-delete="${c.id}">${iconTrash()}</button>
          </div>
        </td>
      </tr>
    `).join('');

    $$('[data-view]', tbody).forEach((b) =>
    b.addEventListener('click', () => viewCustomer(b.dataset.view))
  );

  $$('[data-edit]', tbody).forEach((b) =>
    b.addEventListener('click', () => openCustomerForm(b.dataset.edit))
  );

  $$('[data-delete]', tbody).forEach((b) =>
      b.addEventListener('click', () => removeCustomer(b.dataset.delete))
  );
   
 } catch (error) {
  console.error('Error loading customers:', error);
  showToast(error.message);
 }


}

  async function viewCustomer(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to load customer')
      
    }

    const c = await response.json();

    $('#view-customer-body').innerHTML = `
      <div class="form-grid">
        <div class="form-field">
          <label>Name</label>
          <p>${escapeHtml(c.name)}</p>
        </div>

        <div class="form-field">
          <label>Email</label>
          <p>${escapeHtml(c.email)}</p>
        </div>

        <div class="form-field">
          <label>Phone</label>
          <p>${escapeHtml(c.phone)}</p>
        </div>

        <div class="form-field">
          <label>Address</label>
          <p>${escapeHtml(c.address)}</p>
        </div>
      </div>
    `;

    openModal('view-customer-modal');

  } catch (error) {
    console.error('Error loading customer:', error);
    showToast(error.message);
  }
}

  async function openCustomerForm(id) {
  const form = $('#customer-form');

  form.reset();

  $$('.form-field', form).forEach((f) => f.classList.remove('invalid'));

  $('#customer-form-id').value = '';
  $('#customer-modal-title').textContent = 'Add Customer';

  if (id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`);

      if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.detail || 'Failed to load customer');
}

      const c = await response.json();

      if (c && c.id) {
        $('#customer-modal-title').textContent = 'Edit Customer';
        $('#customer-form-id').value = c.id;
        $('#customer-name').value = c.name;
        $('#customer-email').value = c.email;
        $('#customer-phone').value = c.phone;
        $('#customer-address').value = c.address;
      }

    } catch (error) {
      console.error('Error loading customer:', error);
      showToast(error.message);
      return;
    }
  }

  openModal('customer-modal');
}

  async function removeCustomer(id) {
    let c = null;

    try {
      const getResponse = await fetch(`${API_BASE_URL}/api/customers/${id}`);

      if (getResponse.ok) {
        c = await getResponse.json();
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    }

    const ok = await confirmAction({
      title: 'Delete customer?',
      message: `This will permanently remove ${c ? c.name : 'this customer'} from your records.`,
      confirmLabel: 'Delete customer',
    });

    if(!ok) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'DELETE'
      });

      if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete customer')
      }

      const data = await response.json();

      console.log('Customer deleted:', data);

      await render();

      showToast('Customer deleted.');
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast(error.message);
    }
    
  }

  function validateCustomerForm() {
    let valid = true;
    const nameField = $('#customer-name').closest('.form-field');
    const emailField = $('#customer-email').closest('.form-field');
    const phoneField = $('#customer-phone').closest('.form-field');

    valid = validateField(nameField, $('#customer-name').value.trim().length > 1) && valid;
    valid = validateField(emailField, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#customer-email').value.trim())) && valid;
    valid = validateField(phoneField, $('#customer-phone').value.trim().length >= 7) && valid;
    return valid;
  }

  $('#customer-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateCustomerForm()) return;

  const id = $('#customer-form-id').value;

  const customer = {
    name: $('#customer-name').value.trim(),
    email: $('#customer-email').value.trim(),
    phone: $('#customer-phone').value.trim(),
    address: $('#customer-address').value.trim(),
  };

  try {
    let response;

    if (id) {
      // EDIT CUSTOMER
      response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
      });
    } else {
      // ADD CUSTOMER
      response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customer)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save customer')
    }

    const data = await response.json();

    console.log('Customer saved:', data);

    closeModal('customer-modal');
    render();

    showToast(id ? 'Customer updated.' : 'Customer added.');

  } catch (error) {
    console.error('Error saving customer:', error);
    showToast(error.message);
  }
});

  $('#add-customer-btn').addEventListener('click', () => openCustomerForm());
  $('#customer-search').addEventListener('input', debounce((e) => {
    searchTerm = e.target.value;
    render();
  }, 150));

  render();
}

/* -------------------------------------------------------------------------
   8. Products page
   ------------------------------------------------------------------------- */
function stockBadge(stock) {
  if (stock <= 0) return '<span class="badge badge-outstock">Out of Stock</span>';
  if (stock <= 5) return '<span class="badge badge-lowstock">Low Stock</span>';
  return '<span class="badge badge-instock">In Stock</span>';
}

function initProductsPage() {
  let searchTerm = '';
  let categoryFilter = 'all';

 async function render() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);

   if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.detail || 'Failed to load products');
}

    const products = await response.json();

    const list = products.filter((p) => {
      const matchesSearch = `${p.name} ${p.category || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || p.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    const tbody = $('#products-body');

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <h3>No products found</h3>
          <p>${searchTerm || categoryFilter !== 'all'
            ? 'Try adjusting your search or filter.'
            : 'Add your first product to get started.'}</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((p) => `
      <tr>
        <td class="cell-primary">${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td class="cell-muted">${escapeHtml(p.category || '—')}</td>
        <td>${formatCurrency(p.price)}</td>
        <td class="cell-muted">${p.stock ?? 0}</td>
        <td>${stockBadge(p.stock ?? 0)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" title="View" data-view="${p.id}">${iconEye()}</button>
            <button class="icon-btn" title="Edit" data-edit="${p.id}">${iconEdit()}</button>
            <button class="icon-btn danger" title="Delete" data-delete="${p.id}">${iconTrash()}</button>
          </div>
        </td>
      </tr>
    `).join('');

    $$('[data-view]', tbody).forEach((b) =>
      b.addEventListener('click', () => viewProduct(b.dataset.view))
    );

    $$('[data-edit]', tbody).forEach((b) =>
      b.addEventListener('click', () => openProductForm(b.dataset.edit))
    );

    $$('[data-delete]', tbody).forEach((b) =>
      b.addEventListener('click', () => removeProduct(b.dataset.delete))
    );

  } catch (error) {
    console.error('Error loading products:', error);
    showToast(error.message);
  }
}

async function openProductForm(id) {
  const form = $('#product-form');

  form.reset();

  $$('.form-field', form).forEach((f) => {
    f.classList.remove('invalid');
  });

  $('#product-form-id').value = '';
  $('#product-modal-title').textContent = 'Add Product';

  if (id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load product');
      }

      const p = await response.json();

      $('#product-modal-title').textContent = 'Edit Product';
      $('#product-form-id').value = p.id;
      $('#product-name').value = p.name;
      $('#product-price').value = p.price;

    } catch (error) {
      console.error('Error loading product:', error);
      showToast(error.message);
      return;
    }
  }

  openModal('product-modal');
}

  function populateCategoryFilter() {
    const categories = Array.from(new Set(DataStore.getProducts().map((p) => p.category)));
    const select = $('#product-category-filter');
    select.innerHTML = '<option value="all">All categories</option>' +
      categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }

  async function viewProduct(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to load product');
    }

    const p = await response.json();

    $('#view-product-body').innerHTML = `
      <div class="form-grid">
        <div class="form-field">
          <label>Product Name</label>
          <p>${escapeHtml(p.name)}</p>
        </div>

        <div class="form-field">
          <label>Price</label>
          <p>${formatCurrency(p.price)}</p>
        </div>
      </div>
    `;

    openModal('view-product-modal');

  } catch (error) {
    console.error('Error loading product:', error);
    showToast(error.message);
  }
}

  async function removeProduct(id) {
    let p = null;

    try {
      const getResponse = await fetch(`${API_BASE_URL}/api/products/${id}`);

      if (getResponse.ok) {
        p = await getResponse.json();
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }

    const ok = await confirmAction({
       title: 'Delete product?',
       message: `This will permanently remove ${p ? p.name : 'this product'} from your catalog.`,
       confirmLabel: 'Delete product',
    });

    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE'
      });

      if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete product')
      }

      const data = await response.json();

      console.log('Product deleted:', data);

      await render();

      showToast('Product deleted.');

    } catch (error) {
      console.error('Error deleting product:', error)
      showToast(error.message);
    }
    
  }

  function validateProductForm() {
    let valid = true;
    valid = validateField($('#product-name').closest('.form-field'), $('#product-name').value.trim().length > 1) && valid;
    valid = validateField($('#product-category').closest('.form-field'), $('#product-category').value.trim().length > 0) && valid;
    valid = validateField($('#product-price').closest('.form-field'), Number($('#product-price').value) > 0) && valid;
    valid = validateField($('#product-stock').closest('.form-field'), Number($('#product-stock').value) >= 0 && $('#product-stock').value !== '') && valid;
    return valid;
  }

  $('#product-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateProductForm()) return;

  const id = $('#product-form-id').value;

  const product = {
    name: $('#product-name').value.trim(),
    price: Number($('#product-price').value),
  };

  try {
    let response;

    if (id) {
      // EDIT PRODUCT — gagawin natin sa next step
      response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
    } else {
      // ADD PRODUCT
      response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save product');
    }

    const data = await response.json();

    console.log('Product saved:', data);

    closeModal('product-modal');

    await render();

    showToast(id ? 'Product updated.' : 'Product added.');

  } catch (error) {
    console.error('Error saving product:', error);
    showToast(error.message);
  }
});

  $('#add-product-btn').addEventListener('click', () => openProductForm());
  $('#product-search').addEventListener('input', debounce((e) => {
    searchTerm = e.target.value;
    render();
  }, 150));
  $('#product-category-filter').addEventListener('change', (e) => {
    categoryFilter = e.target.value;
    render();
  });

  populateCategoryFilter();
  render();
}

/* -------------------------------------------------------------------------
   9. Orders page
   ------------------------------------------------------------------------- */
function initOrdersPage() {
 let searchTerm = '';
 let statusFilter = 'all';
 let lineItemCount = 0;
 let apiProducts = [];

  async function render() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`);

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    const orders = await response.json();

   const list = orders.filter((o) => {
  const matchesSearch = `${o.id} ${o.customer_id}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === 'all' || o.status === statusFilter;

  return matchesSearch && matchesStatus;
  });

    const tbody = $('#orders-body');

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <h3>No orders found</h3>
          <p>${searchTerm ? 'Try a different search term.' : 'Create your first order to get started.'}</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((o) => `
      <tr>
        <td class="cell-primary">${o.id}</td>
        <td>Customer #${o.customer_id}</td>
        <td>${formatDate(o.date)}</td>
        <td class="cell-muted">${o.quantity} item${o.quantity === 1 ? '' : 's'}</td>
        <td>${formatCurrency(o.total)}</td>
        <td>${statusBadge(o.status)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" title="View" data-view="${o.id}">${iconEye()}</button>
            <button class="icon-btn" title="Edit" data-edit="${o.id}">${iconEdit()}</button>
            <button class="icon-btn danger" title="Delete" data-delete="${o.id}">${iconTrash()}</button>
          </div>
        </td>
      </tr>
    `).join('');

    $$('[data-view]', tbody).forEach((b) =>
      b.addEventListener('click', () => viewOrder(b.dataset.view))
    );

    $$('[data-edit]', tbody).forEach((b) =>
      b.addEventListener('click', () => openOrderForm(b.dataset.edit))
    );

    $$('[data-delete]', tbody).forEach((b) =>
      b.addEventListener('click', () => removeOrder(b.dataset.delete))
    );

  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Failed to load orders.');
  }
}

  async function viewOrder(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`);

      if (!response.ok) {
        throw new error('Failed to load order')
      }

      const o = await response.json();

      $('#view-order-body').innerHTML = `
      <div class="form-grid">
        <div class="form-field">
          <label>Order ID</label>
          <p>${o.id}</p>
        </div>

        <div class="form-field">
          <label>Customer ID</label>
          <p>${o.customer_id}</p>
        </div>

        <div class="form-field">
          <label>Product ID</label>
          <p>${o.product_id}</p>
        </div>

        <div class="form-field">
          <label>Quantity</label>
          <p>${o.quantity}</p>
        </div>

        <div class="form-field">
          <label>Date</label>
          <p>${formatDate(o.date)}</p>
        </div>

        <div class="form-field">
          <label>Total</label>
          <p>${formatCurrency(o.total)}</p>
        </div>

        <div class="form-field">
          <label>Status</label>
          <p>${statusBadge(o.status)}</p>
        </div>
      </div>
    `;

    openModal('view-order-modal');
    } catch (error) {
      console.error('Error loading order:', error);
      showToast('Failed to load order.')
    }
  }
 async function populateCustomerSelect() {
  const select = $('#order-customer');

  try {
    const response = await fetch(`${API_BASE_URL}/api/customers`);

    if (!response.ok) {
      throw new Error('Failed to load customers');
    }

    const customers = await response.json();

    select.innerHTML = customers.map((c) =>
      `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join('');

  } catch (error) {
    console.error('Error loading customers:', error);
    showToast('Failed to load customers.');
  }
}

 function productOptions(selectedId) {
  return apiProducts.map((p) => `
    <option value="${p.id}" ${Number(p.id) === Number(selectedId) ? 'selected' : ''}>
      ${escapeHtml(p.name)} — ${formatCurrency(p.price)}
    </option>
  `).join('');
}
async function loadOrderProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);

    if (!response.ok) {
      throw new Error('Failed to load products');
    }

    apiProducts = await response.json();

  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products.');
  }
}

  function addLineItemRow(productId, qty) {
  lineItemCount += 1;

  const rowId = `line-${lineItemCount}`;

  const row = document.createElement('div');
  row.className = 'line-item-row';
  row.dataset.rowId = rowId;

  row.innerHTML = `
    <select class="line-product">${productOptions(productId)}</select>

    <input
      type="number"
      class="line-qty"
      min="1"
      value="${qty || 1}"
    >

    <span class="line-total">${formatCurrency(0)}</span>

    <button
      type="button"
      class="icon-btn danger"
      title="Remove line"
    >
      ${iconTrash()}
    </button>
  `;

  $('#line-items-list').appendChild(row);

  const updateLine = () => {
    const productId = Number(
      row.querySelector('.line-product').value
    );

    const product = apiProducts.find(
      (p) => Number(p.id) === productId
    );

    const qtyVal =
      Number(row.querySelector('.line-qty').value) || 0;

    const total = product
      ? product.price * qtyVal
      : 0;

    row.querySelector('.line-total').textContent =
      formatCurrency(total);

    updateOrderTotal();
  };

  row.querySelector('.line-product')
    .addEventListener('change', updateLine);

  row.querySelector('.line-qty')
    .addEventListener('input', updateLine);

  row.querySelector('.icon-btn')
    .addEventListener('click', () => {
      row.remove();
      updateOrderTotal();
    });

  updateLine();
  }

 function updateOrderTotal() {
  const rows = $$('.line-item-row', $('#line-items-list'));
  let total = 0;

  rows.forEach((row) => {
    const productId = Number(
      row.querySelector('.line-product').value
    );

    const product = apiProducts.find(
      (p) => Number(p.id) === productId
    );

    const qty = Number(
      row.querySelector('.line-qty').value
    ) || 0;

    total += product
      ? product.price * qty
      : 0;
  });

  $('#order-total-value').textContent = formatCurrency(total);

  validateField(
    $('#line-items-list').closest('.form-field'),
    rows.length > 0
  );
}

  async function openOrderForm(id) {
    const form = $('#order-form');

    form.reset();
    $$('.form-field', form).forEach((f) => f.classList.remove('invalid'));
    $('#line-items-list').innerHTML = '';
  $('#order-form-id').value = '';
  $('#order-modal-title').textContent = 'Create Order';

  await populateCustomerSelect();
  await loadOrderProducts();

  if (id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${id}`);

      if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load order');
      }

      const o = await response.json();

       $('#order-modal-title').textContent = 'Edit Order';
      $('#order-form-id').value = o.id;
      const customerId = String(o.customer_id);

if ([...$('#order-customer').options].some(option => option.value === customerId)) {
  $('#order-customer').value = customerId;
}

      // API currently doesn't have date/status yet
      $('#order-date').value = todayISO();
      $('#order-status').value = 'Pending';

      addLineItemRow(String(o.product_id), o.quantity);

    } catch (error) {
      console.error('Error loading order:', error);
      showToast(error.message);
      return;

    } 
  } else {
    $('#order-date').value = todayISO();
    $('#order-status').value = 'Pending';

    addLineItemRow();
  }

  updateOrderTotal();
  openModal('order-modal');
    
  }

async function removeOrder(id) {
  const ok = await confirmAction({
    title: 'Delete order?',
    message: `This will permanently remove order ${id}.`,
    confirmLabel: 'Delete order',
  });

  if (!ok) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/orders/${id}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete order');
    }

    const data = await response.json();

    console.log('Order deleted:', data);

    await render();

    showToast('Order deleted.');
  } catch (error) {
    console.error('Error deleting order:', error);
    showToast(error.message);
  }
}

  function validateOrderForm() {
    let valid = true;
    valid = validateField($('#order-customer').closest('.form-field'), !!$('#order-customer').value) && valid;
    valid = validateField($('#order-date').closest('.form-field'), !!$('#order-date').value) && valid;
    valid = validateField($('#line-items-list').closest('.form-field'), $$('.line-item-row', $('#line-items-list')).length > 0) && valid;
    return valid;
  }

  $('#order-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateOrderForm()) return;

  const id = $('#order-form-id').value;

  const row = $('.line-item-row', $('#line-items-list'));

  if (!row) {
    showToast('Please add a product.');
    return;
  }

  console.log('CUSTOMER SELECT:', $('#order-customer').value);
  console.log('PRODUCT SELECT:', row.querySelector('.line-product').value);

 const order = {
  customer_id: Number($('#order-customer').value),
  product_id: Number(row.querySelector('.line-product').value),
  quantity: Number(row.querySelector('.line-qty').value),
  date: $('#order-date').value,
  status: $('#order-status').value,
 total: Number($('#order-total-value').textContent.replace(/[^0-9.-]+/g, ''))
};

  console.log('ORDER DATA:', JSON.stringify(order, null, 2));

  try {
    let response;

    if (id) {
      response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });
    } else {
      response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      });
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to save order')
    }

    const data = await response.json();

    console.log('Order saved:', data);

    closeModal('order-modal');

    await render();

    showToast(id ? 'Order updated.' : 'Order created.');

  } catch (error) {
    console.error('Error saving order:', error);
    showToast(error.message);
  }
});
  
  $('#add-order-btn').addEventListener('click', () => openOrderForm());
  $('#add-line-item-btn').addEventListener('click', () => addLineItemRow());
  $('#order-search').addEventListener('input', debounce((e) => {
    searchTerm = e.target.value;
    render();
  }, 150));
  $('#order-status-filter').addEventListener('change', (e) => {
    statusFilter = e.target.value;
    render();
  });

  render();
}

/* -------------------------------------------------------------------------
   10. Sales page
   ------------------------------------------------------------------------- */
async function initSalesPage() {
  try {
    const [orderResponse, customerResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/orders`),
      fetch(`${API_BASE_URL}/api/customers`)
    ]);

    if (!orderResponse.ok || !customerResponse.ok) {
      throw new Error('Failed to load sales data');
    }

    const orders = await orderResponse.json();
    const customers = await customerResponse.json();
  

  const customerMap = new Map(
    customers.map((customer) => [Number(customer.id), customer.name])
  );

  const sales = orders 
    .filter((o) => o.status === 'Completed')
    .map((o) => ({
      orderId: o.id,
      date: o.date,
      customerId: o.customer_id,
      customerName:
        customerMap.get(Number(o.customer_id)) ||
        `Customer #${o.customer_id}`,
      amount: Number(o.total) || 0,
      status: o.status
    }));

    console.log("ORDERS:", orders);
    console.log("CUSTOMERS:", customers);
    console.log("SALES:", sales)

  const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const avg = sales.length ? total / sales.length : 0;

   $('#sales-total').textContent = formatCurrency(total);
   $('#sales-count').textContent = sales.length;
   $('#sales-avg').textContent = formatCurrency(avg);
  
    const tbody = $('#sales-body');

    console.log("TBODY:", tbody);
    console.log("SALES LENGTH:", sales.length);



    if (sales.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <p>No completed sales yet.</p>
            </div>
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = [...sales]
         .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((s) => {
          return `
            <tr>
              <td class="cell-muted">${formatDate(s.date)}</td>
              <td class="cell-primary">${s.orderId}</td>
              <td>${escapeHtml(s.customerName)}</td>
              <td>${formatCurrency(s.amount)}</td>
              <td>${statusBadge(s.status)}</td>
            </tr>`;
        })
        .join('');

        console.log("TABLE HTML:", tbody.innerHTML);
    }

    renderMonthlyBarChart('#sales-summary-chart', sales);

  } catch (error) {
    console.error('Error loading sales:', error);

     $('#sales-total').textContent = formatCurrency(0);
    $('#sales-count').textContent = '0';
    $('#sales-avg').textContent = formatCurrency(0);

    $('#sales-body').innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <p>Failed to load sales data.</p>
          </div>
        </td>
      </tr>`;
  }
  }

/* -------------------------------------------------------------------------
   Small inline icon helpers (kept tiny/dependency-free)
   ------------------------------------------------------------------------- */
function iconEye() {
  return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
}
function iconEdit() {
  return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
}
function iconTrash() {
  return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>';
}

async function testCustomer() {
  const response = await fetch(`${API_BASE_URL}/api/customers`);
  const data = await response.json();

  console.log(data);
}

document.addEventListener('DOMContentLoaded', () => {
  DataStore.seed();
  initShell();

  testCustomer();

  const page = document.body.dataset.page;
  const initByPage = {
    dashboard: initDashboard,
    customers: initCustomersPage,
    products: initProductsPage,
    orders: initOrdersPage,
    sales: initSalesPage,
  };
  if (initByPage[page]) initByPage[page]();
});
