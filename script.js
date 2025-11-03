let currentUser = null;
const API = ''; // همان دامین

async function fetchAPI(url, options = {}) {
  try {
    const res = await fetch(API + url, { ...options, headers: { 'Content-Type': 'application/json' } });
    if (res.status === 503 || !res.ok) {
      document.getElementById('crash-section').classList.remove('d-none');
      return null;
    }
    return await res.json();
  } catch {
    document.getElementById('crash-section').classList.remove('d-none');
  }
}

document.getElementById('login-form').onsubmit = async e => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const data = await fetchAPI('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  if (data) {
    currentUser = data.user.username;
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('logout-link').style.display = 'block';
    if (data.role === 'admin') {
      document.getElementById('admin-section').classList.remove('d-none');
      loadAdmin();
    } else {
      document.getElementById('shop-section').classList.remove('d-none');
      loadProducts();
    }
    updateCounter();
  }
};

document.getElementById('logout-link').onclick = () => location.reload();

async function loadProducts() {
  const products = await fetchAPI('/api/products');
  const row = document.getElementById('products-row');
  row.innerHTML = '';
  products.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `<div class="card product-card h-100">
      <img src="${p.img}" class="card-img-top">
      <div class="card-body">
        <h5>${p.name}</h5>
        <p class="text-danger fw-bold">$${p.price}</p>
        <button class="btn btn-success" onclick="buy('${p.name}')">خرید</button>
      </div>
    </div>`;
    row.appendChild(col);
  });
}

async function buy(prodName) {
  const data = await fetchAPI('/api/buy', { method: 'POST', body: JSON.stringify({ username: currentUser, prodName }) });
  if (data) {
    alert(`خرید: ${prodName} - درخواست #${data.totalRequests}`);
    updateCounter();
  }
}

async function updateCounter() {
  const data = await fetchAPI('/api/counter');
  if (data) document.getElementById('counter').textContent = data.totalRequests;
}

async function loadAdmin() {
  const users = await fetchAPI('/api/users');
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '';
  users.forEach((u, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${u.username}</td><td>${u.purchases.join(', ')}</td><td>${u.requests}</td>`;
    tbody.appendChild(tr);
  });
}
