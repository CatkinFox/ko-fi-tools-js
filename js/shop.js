document.addEventListener('DOMContentLoaded', async function () {
  const embedDiv = document.getElementById('kofi-shop-embed');
  if (!embedDiv) {
    console.error('Ko‑fi shop div not found');
    return;
  }

  const pageId = embedDiv.getAttribute('data-shop-id');
  const storeCurrency = embedDiv.getAttribute('data-shop-currency');
  const shopTheme = embedDiv.getAttribute('data-shop-theme');
  const soldOutOption = embedDiv.getAttribute('data-shop-soldout') || "show"; // Default: show sold-out products

  if (!pageId || !storeCurrency) {
    console.error('Missing required attributes: data-shop-id or data-shop-currency');
    return;
  }

  // --- Configuration & Utilities ---
  const CACHE_EXPIRY_MS = 300000; // 5 minutes

  // Utility: Add a stylesheet to the document head
  function addStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return link; // Return the link element to handle `onload` events
  }

  // Theme mapping for shop embed
  const themeStyles = {
    default: 'https://embed.ko-fi.tools/css/shop.css',
    low: 'https://embed.ko-fi.tools/css/shop-low.css',
    none: null,
  };

  const themeUrl = themeStyles[shopTheme];
  if (themeUrl) {
    addStylesheet(themeUrl);
  } else if (shopTheme === 'none') {
    console.log('No shop CSS will be loaded (theme = "none")');
  } else {
    console.warn('Invalid or missing data-shop-theme attribute. Defaulting to default theme.');
    addStylesheet('https://embed.ko-fi.tools/css/shop.css');
  }

  // Utility: Create an element with a class name
  function createElementWithClass(tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  }

  // Utility: Display an error message
  function displayErrorMessage(message) {
    const errorDiv = createElementWithClass('div', 'error-message');
    errorDiv.innerText = message;
    embedDiv.appendChild(errorDiv);
  }

  // Utility: Lazy load images
  function lazyLoadImages() {
    document.querySelectorAll('.lazy').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }

  // Function: Check subscriber status
  async function checkSubscriberStatus(id) {
    try {
      const response = await fetch(`https://api.ko-fi.tools/subscriber?id=${id}`);
      if (!response.ok) {
        console.error(`Failed to fetch subscriber status: ${response.status}`);
        return false;
      }
      const data = await response.json();
      return data.subscriber === true;
    } catch (error) {
      console.error('Error checking subscriber status:', error);
      return false;
    }
  }

  // --- Powered-by Footer ---
  function addPoweredByFooter() {
    const poweredByDiv = createElementWithClass('div', 'powered-by-kofi-tools');
    poweredByDiv.innerHTML = '<p>Powered by <a href="https://ko-fi.tools/" target="_blank">Ko‑fi.tools</a></p>';
    poweredByDiv.setAttribute('style', `
      display: block !important;
      opacity: 1 !important;
      z-index: 999 !important;
      position: absolute !important;
      color: #fff !important;
      padding: 20px !important;
      border-radius: 40px !important;
      background: #ff6383 !important;
    `);

    // Load the stylesheet and append the footer after it's loaded
    addStylesheet('https://embed.ko-fi.tools/css/powered-by.css').onload = () => {
      embedDiv.appendChild(poweredByDiv);
    };
  }

  let isSubscriber = await checkSubscriberStatus(pageId);

  if (!isSubscriber && !document.querySelector('.powered-by-kofi-tools')) {
    addPoweredByFooter();
  }

  // --- DOM Setup ---
  const container = createElementWithClass('div', 'kofi-shop-container');
  embedDiv.appendChild(container);

  const initialLoadDiv = createElementWithClass('div', 'kofi-shop-load-more');
  initialLoadDiv.innerHTML = '<p>Fetching Products...</p>';
  embedDiv.appendChild(initialLoadDiv);

  // Function: Create a shop product card
  function createProductCard(product) {
    const card = createElementWithClass('div', 'kofi-shop-item');
    card.innerHTML = `
      <img class="lazy" data-src="${product.Image}" alt="${product.Title}">
      <div class="kofi-shop-info">
        <p>${product.Title}</p>
        <p>Orders: ${product.Orders}</p>
        <p>${product.Description}</p>
        <p>${storeCurrency}${product.Price}</p>
        <a href="${product.Link}" target="_blank">Buy</a>
      </div>
    `;
    return card;
  }

  // Function: Render page data
  function renderPageData(page, data, update = false) {
    if (update) {
      container.querySelectorAll(`.kofi-shop-item[data-page="${page}"]`).forEach(item => item.remove());
    }
    data.forEach(product => {
      if (soldOutOption === "hide" && product.SoldOut === true) {
        return;
      }
      const card = createProductCard(product);
      card.setAttribute('data-page', page);
      container.appendChild(card);
    });
    lazyLoadImages();

    if (!isSubscriber && page === 0 && !document.querySelector('.powered-by-kofi-tools')) {
      addPoweredByFooter();
    }

    if (page === 0) {
      const loadMoreEl = document.querySelector('.kofi-shop-load-more');
      if (loadMoreEl) {
        loadMoreEl.innerHTML = '<p>Loading more products...</p>';
      }
    }
  }

  // --- Data Loading with Cache ---
  let currentPage = 0;
  let loading = false;
  let allLoaded = false;

  async function loadProducts(page) {
    if (loading || allLoaded) return;
    loading = true;

    const cacheKey = `ko-fi-shop-${pageId}-page-${page}`;
    let cachedData = null;
    const cacheRaw = localStorage.getItem(cacheKey);

    if (cacheRaw) {
      try {
        cachedData = JSON.parse(cacheRaw);
      } catch (e) {
        console.error("Error parsing cached shop data:", e);
      }
    }

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS)) {
      renderPageData(page, cachedData.data);
    }

    try {
      const response = await fetch(`https://api.ko-fi.tools/shop?pageid=${pageId}&page=${page}`);
      const data = await response.json();
      if (data.error || !data.length) {
        allLoaded = true;
        const loadMoreDiv = document.querySelector('.kofi-shop-load-more');
        if (loadMoreDiv) loadMoreDiv.remove();
        loading = false;
        return;
      }

      if (!cachedData || (Date.now() - cachedData.timestamp >= CACHE_EXPIRY_MS)) {
        renderPageData(page, data, true);
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
      }
    } catch (error) {
      displayErrorMessage('An error occurred while fetching products.');
      console.error('Error fetching products:', error);
    } finally {
      loading = false;
    }
  }

  // --- Infinite Scroll Setup ---
  function observeLoadMore() {
    const loadMoreDiv = document.querySelector('.kofi-shop-load-more');
    if (!loadMoreDiv) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !allLoaded) {
        observer.disconnect();
        currentPage++;
        loadProducts(currentPage).then(() => {
          observeLoadMore();
        });
      }
    });
    observer.observe(loadMoreDiv);
  }

  // Initial load and observer setup
  loadProducts(currentPage);
  observeLoadMore();
});
