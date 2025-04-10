document.addEventListener('DOMContentLoaded', async function () {
  const embedDiv = document.getElementById('kofi-feed-embed');
  if (!embedDiv) {
    console.error('Ko‑fi feed embed div not found');
    return;
  }

  // Retrieve required attributes.
  const pageId = embedDiv.getAttribute('data-feed-id');
  const feedTheme = embedDiv.getAttribute('data-feed-theme');
  const feedName = embedDiv.getAttribute('data-feed-name') || 'Feed';
  // New: data-feed-items defines allowed types (e.g., "posts, images, supporters")
  const feedItemsAttr = embedDiv.getAttribute('data-feed-items') || '';

  if (!pageId) {
    console.error('Missing required attribute: data-feed-id');
    return;
  }

  const CACHE_EXPIRY_MS = 300000; // 5 minutes

  // Utility: Add a stylesheet to the document head.
  function addStylesheet(url) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return link;
  }

  // Utility: Create an element with a given class name.
  function createElementWithClass(tag, className) {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  }

  // Utility: Display an error message.
  function displayErrorMessage(message) {
    const errorDiv = createElementWithClass('div', 'kofi-error-message');
    errorDiv.innerText = message;
    embedDiv.appendChild(errorDiv);
  }

  // Utility: Lazy load images.
  function lazyLoadImages() {
    document.querySelectorAll('.lazy').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }

  // Function: Check subscriber status.
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

  // Function: Add Powered-by Footer.
  function addPoweredByFooter() {
    const poweredByDiv = createElementWithClass('div', 'kofi-powered-by-kofi-tools');
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
    addStylesheet('https://embed.ko-fi.tools/css/powered-by.css').onload = () => {
      embedDiv.appendChild(poweredByDiv);
    };
  }

  let isSubscriber = await checkSubscriberStatus(pageId);
  if (!isSubscriber && !document.querySelector('.kofi-powered-by-kofi-tools')) {
    addPoweredByFooter();
  }

  // Theme mapping for feed embed.
  const themeStyles = {
    default: 'https://embed.ko-fi.tools/css/feed.css',
    low: 'https://embed.ko-fi.tools/css/feed-low.css',
    none: null,
  };

  const themeUrl = themeStyles[feedTheme];
  if (themeUrl) {
    addStylesheet(themeUrl);
  } else if (feedTheme === 'none') {
    console.log('No feed CSS loaded (theme = "none")');
  } else {
    console.warn('Invalid data-feed-theme attribute. Defaulting to default theme.');
    addStylesheet('https://embed.ko-fi.tools/css/feed.css');
  }

  // Main container.
  const container = createElementWithClass('div', 'kofi-feed-container');
  embedDiv.appendChild(container);

  // Header: use data-feed-name.
  const header = createElementWithClass('div', 'kofi-feed-header');
  const headerTitle = document.createElement('h2');
  headerTitle.innerText = feedName;
  header.appendChild(headerTitle);
  container.appendChild(header);

  // Load More element.
  const loadMoreDiv = createElementWithClass('div', 'kofi-feed-load-more');
  loadMoreDiv.innerHTML = '<p>Fetching Posts...</p>';
  embedDiv.appendChild(loadMoreDiv);

  let currentPage = 0;
  let loading = false;
  let allLoaded = false;

  // Add profile image to header.
  function addProfileImage(data) {
    if (data.curatorProfilePic && !header.querySelector('.kofi-feed-profile')) {
      const profileImg = document.createElement('img');
      profileImg.src = data.curatorProfilePic;
      profileImg.className = 'kofi-feed-profile';
      header.insertBefore(profileImg, headerTitle);
    }
  }

  // Render a single feed item based on its type.
  function renderFeedItem(item) {
    const card = createElementWithClass('div', 'kofi-feed-item');

    switch(item.type) {
      case 'Message': {
        const msgElem = createElementWithClass('p', 'kofi-feed-message');
        msgElem.innerText = item.message || '';
        card.appendChild(msgElem);
        break;
      }
      case 'poll': {
        const titleElem = createElementWithClass('h3', 'kofi-feed-title');
        titleElem.innerText = item.title || '';
        card.appendChild(titleElem);
        const descElem = createElementWithClass('p', 'kofi-feed-description');
        descElem.innerText = item.description || '';
        card.appendChild(descElem);
        if (item.image) {
          const img = document.createElement('img');
          img.className = 'kofi-feed-image lazy';
          img.setAttribute('data-src', item.image);
          img.alt = item.title || '';
          const link = document.createElement('a');
          link.href = item.link;
          link.target = '_blank';
          link.appendChild(img);
          card.appendChild(link);
        }
        break;
      }
      case 'Post': {
        const titleElem = createElementWithClass('h3', 'kofi-feed-title');
        titleElem.innerText = item.title || '';
        card.appendChild(titleElem);
        const descElem = createElementWithClass('p', 'kofi-feed-description');
        descElem.innerText = item.description || '';
        card.appendChild(descElem);
        if (item.image) {
          const img = document.createElement('img');
          img.className = 'kofi-feed-image lazy';
          img.setAttribute('data-src', item.image);
          img.alt = item.title || '';
          const link = document.createElement('a');
          link.href = item.link;
          link.target = '_blank';
          link.appendChild(img);
          card.appendChild(link);
        }
        if (item.locked) {
          const lockDiv = createElementWithClass('div', 'kofi-feed-locked-message');
          lockDiv.innerText = "This post is locked and only available to subscribers.";
          card.appendChild(lockDiv);
        }
        break;
      }
      case 'image': {
        const titleElem = createElementWithClass('h3', 'kofi-feed-title');
        titleElem.innerText = item.title || '';
        card.appendChild(titleElem);
        const descElem = createElementWithClass('p', 'kofi-feed-description');
        descElem.innerText = item.description || '';
        card.appendChild(descElem);
        if (item.image) {
          const img = document.createElement('img');
          img.className = 'kofi-feed-image lazy';
          img.setAttribute('data-src', item.image);
          img.alt = item.title || '';
          const link = document.createElement('a');
          link.href = item.link;
          link.target = '_blank';
          link.appendChild(img);
          card.appendChild(link);
        }
        if (item.locked) {
          const lockDiv = createElementWithClass('div', 'kofi-feed-locked-message');
          lockDiv.innerText = "This image is locked.";
          card.appendChild(lockDiv);
        }
        break;
      }
      case 'tip': {
        const userElem = createElementWithClass('h3', 'kofi-feed-tip-user');
        userElem.innerText = item.user || '';
        card.appendChild(userElem);
        const tipMsg = createElementWithClass('p', 'kofi-feed-tip-message');
        tipMsg.innerText = item.message || '';
        card.appendChild(tipMsg);
        if (item.reply) {
          const replyElem = createElementWithClass('p', 'kofi-feed-tip-reply');
          replyElem.innerText = "Reply: " + item.reply;
          card.appendChild(replyElem);
        }
        if (item.image) {
          const img = document.createElement('img');
          img.className = 'kofi-feed-image lazy';
          img.setAttribute('data-src', item.image);
          img.alt = item.user || '';
          card.appendChild(img);
        }
        if (item.link) {
          const linkElem = createElementWithClass('a', 'kofi-view-post-button');
          linkElem.innerText = 'View Profile';
          linkElem.href = item.link;
          linkElem.target = '_blank';
          card.appendChild(linkElem);
        }
        break;
      }
      case 'supporter': {
        const nameElem = createElementWithClass('h3', 'kofi-feed-supporter-name');
        nameElem.innerText = item.name || '';
        card.appendChild(nameElem);
        const supMsg = createElementWithClass('p', 'kofi-feed-supporter-message');
        supMsg.innerText = item.message || '';
        card.appendChild(supMsg);
        if (item.link) {
          const linkElem = createElementWithClass('a', 'kofi-view-post-button');
          linkElem.innerText = 'View Profile';
          linkElem.href = item.link;
          linkElem.target = '_blank';
          card.appendChild(linkElem);
        }
        break;
      }
      case 'member': {
        const nameElem = createElementWithClass('h3', 'kofi-feed-member-name');
        nameElem.innerText = item.name || '';
        card.appendChild(nameElem);
        if (item.image) {
          const img = document.createElement('img');
          img.className = 'kofi-feed-image lazy';
          img.setAttribute('data-src', item.image);
          img.alt = item.name || '';
          card.appendChild(img);
        }
        const memberMsg = createElementWithClass('p', 'kofi-feed-member-message');
        memberMsg.innerText = item.message || '';
        card.appendChild(memberMsg);
        if (item.link) {
          const linkElem = createElementWithClass('a', 'kofi-view-post-button');
          linkElem.innerText = 'View Profile';
          linkElem.href = item.link;
          linkElem.target = '_blank';
          card.appendChild(linkElem);
        }
        break;
      }
      default: {
        const pre = document.createElement('pre');
        pre.innerText = JSON.stringify(item, null, 2);
        card.appendChild(pre);
      }
    }
    container.appendChild(card);
  }

  // Render feed data.
  function renderFeedData(page, data) {
    // Filter items client-side if data-feed-items is set.
    if (feedItemsAttr.trim() !== "") {
      const allowed = feedItemsAttr.split(",").map(s => s.trim().toLowerCase());
      data.feedItems = data.feedItems.filter(item => allowed.includes(item.type.toLowerCase()));
    }
    data.feedItems.forEach(item => renderFeedItem(item));
    lazyLoadImages();
    if (!isSubscriber && !document.querySelector('.kofi-powered-by-kofi-tools')) {
      addPoweredByFooter();
    }
  }

  async function loadFeed(page) {
    if (loading || allLoaded) return;
    loading = true;

    const cacheKey = `ko-fi-feed-${pageId}-page-${page}`;
    let cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        cachedData = JSON.parse(cachedData);
      } catch {
        console.error('Error parsing cached feed data');
      }
    }
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
      if (page === 0) addProfileImage(cachedData.data);
      renderFeedData(page, cachedData.data);
    }
    try {
      const url = `https://api.ko-fi.tools/feed?pageid=${pageId}&page=${page}`;
      const response = await fetch(url);
      const data = await response.json();
      if (page === 0) addProfileImage(data);
      if (!data.feedItems || !data.feedItems.length) {
        allLoaded = true;
        loadMoreDiv.remove();
        return;
      }
      renderFeedData(page, data);
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (error) {
      displayErrorMessage('An error occurred while fetching posts.');
      console.error('Error fetching feed data:', error);
    } finally {
      loading = false;
    }
  }

  function observeLoadMore() {
    if (!loadMoreDiv) return;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !allLoaded) {
        currentPage++;
        loadFeed(currentPage);
      }
    }).observe(loadMoreDiv);
  }

  loadFeed(currentPage);
  observeLoadMore();
});
