// commissions.js
document.addEventListener('DOMContentLoaded', async function () {
  const embedDiv = document.getElementById('kofi-commissions-embed');
  if (!embedDiv) {
    console.error('Ko‑fi commissions embed div not found');
    return;
  }

  const pageId = embedDiv.getAttribute('data-commissions-id');
  const storeCurrency = embedDiv.getAttribute('data-commissions-currency');
  const themeOption = embedDiv.getAttribute('data-commissions-theme');
  if (!pageId || !storeCurrency) {
    console.error('Missing required attributes: data-commissions-id or data-commissions-currency');
    return;
  }

  // --- Configuration & Utilities ---
  const CACHE_EXPIRY_MS = 300000; // 5 minutes

  // Utility: add a stylesheet to the document head
  function addStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  // Theme mapping for commissions embed (using "default", "low", and "none")
  const themeStyles = {
    default: 'https://embed.ko-fi.tools/css/commissions.css',
    low: 'https://embed.ko-fi.tools/css/commissions-low.css',
    none: null
  };

  const themeUrl = themeStyles[themeOption];
  if (themeUrl) {
    addStylesheet(themeUrl);
  } else if (themeOption === 'none') {
    console.log('No commissions CSS will be loaded (theme = "none")');
  } else {
    console.warn('Invalid or missing data-commissions-theme attribute. Defaulting to default theme.');
    addStylesheet('https://embed.ko-fi.tools/css/commissions.css');
  }

  // Utility: create an element with a class name
  function createElementWithClass(tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  }

  // Utility: display an error message
  function displayErrorMessage(message) {
    const errorDiv = createElementWithClass('div', 'error-message');
    errorDiv.innerText = message;
    embedDiv.appendChild(errorDiv);
  }

  // Utility: lazy load images by replacing data-src with src
  function lazyLoadImages() {
    document.querySelectorAll('.lazy').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }

  // Function: check subscriber status
  async function checkSubscriberStatus(id) {
    try {
      const response = await fetch(`https://api.ko-fi.tools/subscriber?id=${id}`);
      const data = await response.json();
      return data.subscriber === true;
    } catch (error) {
      console.error('Error checking subscriber status:', error);
      return false;
    }
  }

  let isSubscriber = await checkSubscriberStatus(pageId);

  // --- DOM Setup ---
  // Create the main container for commission items.
  const container = createElementWithClass('div', 'kofi-commissions-container');
  embedDiv.appendChild(container);

  // Create and append the initial loading message.
  const initialLoadDiv = createElementWithClass('div', 'kofi-commissions-load-more');
  initialLoadDiv.innerHTML = '<p>Fetching Commissions...</p>';
  embedDiv.appendChild(initialLoadDiv);

  // Function: add the "Powered by Ko‑fi.tools" footer (only for non‑subscribers)
    function addPoweredByFooter() {
      const poweredByDiv = createElementWithClass('div', 'powered-by-kofi-tools');
      poweredByDiv.innerHTML = '<p>Powered by <a href="https://ko-fi.tools/" target="_blank">Ko‑fi.tools</a></p>';
      poweredByDiv.setAttribute("style", `
        display: block !important;
        opacity: 1 !important;
        z-index: 999 !important;
        position: absolute !important;
        color: #fff !important;
        padding: 20px !important;
        border-radius: 40px !important;
        background: #ff6383 !important;
      `);
    
      // Add the stylesheet for "Powered by" styles
      addStylesheet('https://embed.ko-fi.tools/css/powered-by.css');
    
      embedDiv.appendChild(poweredByDiv);
    }


  // Function: create a commission product card element.
  function createProductCard(product) {
    const card = createElementWithClass('div', 'kofi-commissions-item');
    card.innerHTML = `
      <img class="lazy" data-src="${product.Image}" alt="${product.Title}">
      <div class="kofi-commissions-info">
        <p>${product.Title}</p>
        <p>Orders: ${product.Orders}</p>
        <p>${product.Description}</p>
        <p>${storeCurrency}${product.Price}</p>
        <a href="${product.Link}" target="_blank">Buy</a>
      </div>
    `;
    return card;
  }

  // Function: render (or update) a page of results.
  // Each card is appended directly into container (tagged with data-page).
  function renderPageData(page, data, update = false) {
    if (update) {
      container.querySelectorAll(`.kofi-commissions-item[data-page="${page}"]`).forEach(item => item.remove());
    }
    data.forEach(product => {
      const card = createProductCard(product);
      card.setAttribute('data-page', page);
      container.appendChild(card);
    });
    lazyLoadImages();
    if (!isSubscriber && page === 0 && !document.querySelector('.powered-by-kofi-tools')) {
      addPoweredByFooter();
    }
    // For the first page, update the load-more element text.
    if (page === 0) {
      const loadMoreEl = document.querySelector('.kofi-commissions-load-more');
      if (loadMoreEl) {
        loadMoreEl.innerHTML = '<p>Loading more commissions...</p>';
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
    const cacheKey = `ko-fi-commissions-${pageId}-page-${page}`;
    let cachedData = null;
    const cacheRaw = localStorage.getItem(cacheKey);
    if (cacheRaw) {
      try {
        cachedData = JSON.parse(cacheRaw);
      } catch (e) {
        console.error("Error parsing cached commissions:", e);
      }
    }
    // If cached data exists and is fresh, render it immediately.
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS)) {
      renderPageData(page, cachedData.data);
    }
    // Fetch fresh data from the API.
    try {
      const response = await fetch(`https://api.ko-fi.tools/commissions?pageid=${pageId}&page=${page}`);
      const data = await response.json();
      if (data.error) {
        displayErrorMessage('Failed to load commissions.');
        console.error(data.error);
        loading = false;
        return;
      }
      if (!data.length) {
        allLoaded = true;
        const loadMoreDiv = document.querySelector('.kofi-commissions-load-more');
        if (loadMoreDiv) loadMoreDiv.remove();
        loading = false;
        return;
      }
      // Force re-render if the cache is expired or data is different.
      if (
        !cachedData ||
        (Date.now() - cachedData.timestamp >= CACHE_EXPIRY_MS) ||
        JSON.stringify(data) !== JSON.stringify(cachedData.data)
      ) {
        renderPageData(page, data, true);
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
      }
    } catch (error) {
      displayErrorMessage('An error occurred while fetching commissions.');
      console.error('Error fetching commissions:', error);
    } finally {
      loading = false;
    }
  }

  // --- Infinite Scroll Setup ---
  function observeLoadMore() {
    const loadMoreDiv = document.querySelector('.kofi-commissions-load-more');
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

  // Initial load and observer setup.
  loadProducts(currentPage);
  observeLoadMore();
});
