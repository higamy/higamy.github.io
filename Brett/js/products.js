// ===== Products Catalog =====
// Fixed product listings. To update inventory, edit the PRODUCTS array below.

const PRODUCTS = [
  {
    id: '1',
    name: 'Holland Lop Doe',
    category: 'animals',
    price: '$55.00',
    status: 'available',
    description: 'Beautiful broken tort Holland Lop doe, 12 weeks old. Friendly and well-socialized. Great pet or breeding quality.',
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&h=400&fit=crop'
  },
  {
    id: '2',
    name: 'Raw Chicken & Rabbit Blend (5 lb)',
    category: 'animal-products',
    price: '$18.00',
    status: 'available',
    description: 'Our signature raw dog feed blend. Ground chicken, rabbit, organs, and bone. No fillers, no preservatives. Frozen fresh.',
    image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&h=400&fit=crop'
  },
  {
    id: '3',
    name: 'Raw Beef & Tripe Mix (5 lb)',
    category: 'animal-products',
    price: '$22.00',
    status: 'available',
    description: 'Premium raw beef with green tripe. Excellent for dogs transitioning to raw diet. Locally sourced Indiana beef.',
    image: 'https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?w=600&h=400&fit=crop'
  },
  {
    id: '4',
    name: 'Bunny Snuggle Sack',
    category: 'trinkets',
    price: '$15.00',
    status: 'available',
    description: 'Handmade fleece snuggle sack for rabbits. Cozy hideaway your bunny will love. Machine washable.',
    image: 'https://images.unsplash.com/photo-1591382386627-349b692688ff?w=600&h=400&fit=crop'
  },
  {
    id: '5',
    name: 'Netherland Dwarf Buck',
    category: 'animals',
    price: '$45.00',
    status: 'coming-soon',
    description: 'Black otter Netherland Dwarf buck, expected ready in 4 weeks. Reserve now!',
    image: 'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=600&h=400&fit=crop'
  },
  {
    id: '6',
    name: 'Rabbit Hay Feeder (Handmade)',
    category: 'trinkets',
    price: '$25.00',
    status: 'available',
    description: 'Solid wood hay feeder, handcrafted locally. Keeps hay clean and accessible. Fits all cage sizes.',
    image: 'https://images.unsplash.com/photo-1589933767411-38a58367efd7?w=600&h=400&fit=crop'
  },
  {
    id: '7',
    name: 'Mini Rex Doe',
    category: 'animals',
    price: '$50.00',
    status: 'available',
    description: 'Gorgeous blue Mini Rex doe with plush velvet coat. 10 weeks old, very sweet temperament.',
    image: 'https://images.unsplash.com/photo-1623686070581-5d2eb8187fc2?w=600&h=400&fit=crop'
  },
  {
    id: '8',
    name: 'Raw Turkey & Organ Mix (5 lb)',
    category: 'animal-products',
    price: '$20.00',
    status: 'available',
    description: 'Lean ground turkey with liver, heart, and gizzard. Perfect for dogs with chicken sensitivities.',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop'
  },
  {
    id: '9',
    name: 'Bunny Treat Sampler Box',
    category: 'trinkets',
    price: '$12.00',
    status: 'available',
    description: 'Assorted dried herbs, flowers, and hay treats your bunny will go crazy for. All natural, no additives.',
    image: 'https://images.unsplash.com/photo-1579101403207-44ff78d923f8?w=600&h=400&fit=crop'
  }
];

// ===== Rendering =====

let currentFilter = 'all';

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const emptyMsg = document.getElementById('emptyMsg');

  const filtered = currentFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';

  grid.innerHTML = filtered.map(p => `
    <div class="product-card" data-id="${p.id}">
      ${p.image
        ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" class="product-img" loading="lazy">`
        : `<div class="product-img-placeholder">${getCategoryEmoji(p.category)}</div>`
      }
      <div class="product-info">
        <span class="category-tag">${getCategoryLabel(p.category)}</span>
        <span class="badge ${p.status}">${getStatusLabel(p.status)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="description">${escapeHtml(p.description || '')}</p>
        ${p.price ? `<p class="price">${escapeHtml(p.price)}</p>` : ''}
        <a href="contact.html" class="btn btn-primary btn-sm" style="margin-top: 0.75rem; display:inline-block; text-align:center;">Inquire</a>
      </div>
    </div>
  `).join('');
}

function getCategoryEmoji(cat) {
  switch(cat) {
    case 'animals': return '&#x1f407;';
    case 'animal-products': return '&#x1f969;';
    case 'trinkets': return '&#x1f381;';
    default: return '&#x1f4e6;';
  }
}

function getCategoryLabel(cat) {
  switch(cat) {
    case 'animals': return 'Animals';
    case 'animal-products': return 'Raw Feed & Products';
    case 'trinkets': return 'Trinkets & Goods';
    default: return 'Other';
  }
}

function getStatusLabel(status) {
  switch(status) {
    case 'available': return 'Available';
    case 'coming-soon': return 'Coming Soon';
    case 'sold': return 'Sold';
    default: return status;
  }
}

// ===== Filter =====

function filterProducts(category, btn) {
  currentFilter = category;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProducts();
}

// ===== Utilities =====

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Init =====
renderProducts();
