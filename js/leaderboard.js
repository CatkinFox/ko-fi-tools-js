// leaderboard.js
document.addEventListener('DOMContentLoaded', async function () {
    const embedDiv = document.getElementById('kofi-leaderboard-embed');
    if (!embedDiv) {
        console.error('Ko‑fi leaderboard div not found');
        return;
    }

    // Retrieve required attributes
    const pageId = embedDiv.getAttribute('data-leaderboard-id');
    const leaderboardTheme = embedDiv.getAttribute('data-leaderboard-theme');
    const leaderboardName = embedDiv.getAttribute('data-leaderboard-name');
    if (!pageId) {
        console.error('Missing required attribute: data-leaderboard-id');
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

    // Theme mapping for leaderboard embed
    const themeStyles = {
        default: 'https://embed.ko-fi.tools/css/leaderboard.css',
        low: 'https://embed.ko-fi.tools/css/leaderboard-low.css',
        none: null
    };

    const themeUrl = themeStyles[leaderboardTheme];
    if (themeUrl) {
        addStylesheet(themeUrl);
    } else if (leaderboardTheme === 'none') {
        console.log('No leaderboard CSS will be loaded (theme = "none")');
    } else {
        console.warn('Invalid or missing data-leaderboard-theme attribute. Defaulting to default theme.');
        addStylesheet('https://embed.ko-fi.tools/css/leaderboard.css');
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

    // --- Subscriber Check ---
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
    if (!isSubscriber) {
        addStylesheet('https://embed.ko-fi.tools/css/powered-by.css');
    }

    // Function: add the "Powered by Ko‑fi.tools" footer (only for non‑subscribers)
    function addPoweredByFooter() {
        // Avoid adding the footer more than once.
        if (document.querySelector('.powered-by')) return;

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
        embedDiv.appendChild(poweredByDiv);
    }

    // --- DOM Setup ---
    // Main container for the leaderboard embed
    const container = createElementWithClass('div', 'kofi-leaderboard-container');
    embedDiv.appendChild(container);

    // Create and append an initial loading message.
    const loadingDiv = createElementWithClass('div', 'kofi-leaderboard-loading');
    loadingDiv.innerHTML = '<p>Fetching Leaderboard...</p>';
    embedDiv.appendChild(loadingDiv);

    // Function: render the leaderboard data
    function renderLeaderboard(data) {
        // Clear previous content from the container to avoid duplication.
        container.innerHTML = "";

        // Remove the loading message if it exists.
        if (loadingDiv) {
            loadingDiv.remove();
        }

        // Create a header that displays the curator’s profile and name wrapped in a link.
        const header = createElementWithClass('div', 'kofi-leaderboard-header');
        const curatorLink = document.createElement('a');
        curatorLink.href = "https://ko-fi.com/" + pageId;
        curatorLink.target = "_blank";
        // If the curator profile picture exists, add it.
        if (data.curatorProfilePic) {
            const curatorImg = document.createElement('img');
            curatorImg.className = 'kofi-leaderboard-curator-profile';
            curatorImg.src = data.curatorProfilePic;
            curatorImg.alt = 'Curator Profile';
            curatorLink.appendChild(curatorImg);
        }
        // Add the curator name (or a default title) inside the same link.
        const headerText = document.createElement('h2');
        headerText.innerText = leaderboardName ? `${leaderboardName}` : 'Leaderboard';
        curatorLink.appendChild(headerText);
        header.appendChild(curatorLink);
        container.appendChild(header);

        // Create a list container for supporter items.
        const listContainer = createElementWithClass('div', 'kofi-leaderboard-list');
        container.appendChild(listContainer);

        if (!data.supporters || !data.supporters.length) {
            const noData = createElementWithClass('p', 'kofi-leaderboard-no-data');
            noData.innerText = 'No leaderboard data found.';
            listContainer.appendChild(noData);
            return;
        }

        // Loop through each supporter and create a card where the entire card is clickable.
        data.supporters.forEach(supporter => {
            const card = createElementWithClass('div', 'kofi-leaderboard-item');
            const link = document.createElement('a');
            link.className = 'supporter-link';
            link.href = supporter.link;
            link.target = '_blank';

            // Order
            const orderSpan = createElementWithClass('span', 'kofi-leaderboard-supporter-order');
            orderSpan.innerText = supporter.order;
            link.appendChild(orderSpan);

            // Profile picture (lazy-loaded)
            const img = document.createElement('img');
            img.className = 'kofi-leaderboard-supporter-profile lazy';
            img.setAttribute('data-src', supporter.profilePicture);
            img.alt = supporter.name;
            link.appendChild(img);

            // Supporter name
            const nameSpan = createElementWithClass('span', 'kofi-leaderboard-supporter-name');
            nameSpan.innerText = supporter.name;
            link.appendChild(nameSpan);

            // Append the link (wrapping all elements) to the card.
            card.appendChild(link);
            listContainer.appendChild(card);
        });

        // Trigger lazy-loading for images.
        lazyLoadImages();

        // If the user is not a subscriber, add the Powered by footer.
        if (!isSubscriber) {
            addPoweredByFooter();
        }
    }

    // --- Data Loading with Cache ---
    async function loadLeaderboard() {
        const cacheKey = `ko-fi-leaderboard-${pageId}`;
        let cachedData = null;
        const cacheRaw = localStorage.getItem(cacheKey);
        if (cacheRaw) {
            try {
                cachedData = JSON.parse(cacheRaw);
            } catch (e) {
                console.error("Error parsing cached leaderboard data:", e);
            }
        }
        // Render cached data immediately if it exists and is fresh.
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS)) {
            renderLeaderboard(cachedData.data);
        }
        // Fetch fresh data from the API.
        try {
            const response = await fetch(`https://api.ko-fi.tools/leaderboard?pageid=${pageId}`);
            const data = await response.json();
            if (data.error) {
                displayErrorMessage('Error: ' + data.error);
                return;
            }
            renderLeaderboard(data);
            // Update the cache.
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
        } catch (error) {
            displayErrorMessage('An error occurred while fetching leaderboard data.');
            console.error('Error fetching leaderboard data:', error);
        }
    }

    // Initial load.
    loadLeaderboard();
});
