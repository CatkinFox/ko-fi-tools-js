<?php
// Determine the error code from the server variable if available, otherwise default to 404.
$error_code = isset($_SERVER['REDIRECT_STATUS']) ? $_SERVER['REDIRECT_STATUS'] : 404;

// Set the HTTP response code
http_response_code($error_code);
?>
<!DOCTYPE html>
<html data-bs-theme="light" lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Ko-fi Tools | Error <?= $error_code ?></title>
    <link rel="canonical" href="https://ko-fi.tools/<?= $error_code ?>">
    <meta property="og:url" content="https://ko-fi.tools/<?= $error_code ?>">
    <meta name="twitter:card" content="summary_large_image">
    <meta property="og:description" content="Ko-fi Tools allows you to embed and display your Ko-fi shop, gallery, commissions, feed and top supporters on your very own websites using a simple embed code.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://ko-fi.tools/assets/img/meta.png">
    <meta property="og:title" content="Ko-Fi Tools | Embed your Ko-fi page, on your own website!">
    <meta name="description" content="Ko-fi Tools allows you to embed and display your Ko-fi shop, gallery, commissions, feed and top supporters on your very own websites using a simple embed code.">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/img/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32x32.png">
    <link rel="stylesheet" href="https://ko-fi.tools/assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://ko-fi.tools/assets/css/Lato.css">
    <link rel="stylesheet" href="https://ko-fi.tools/assets/css/Nunito.css">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.12.0/css/all.css">
    <link rel="stylesheet" href="https://ko-fi.tools/assets/css/bs-theme-overrides.css">
    <link rel="stylesheet" href="https://ko-fi.tools/assets/css/styles.css">
</head>
<body>
    <p class="bg-primary text-center text-light pt-2 pb-2 mb-0">
        <strong>Ko-fi.tools is <span style="text-decoration: underline;">not affiliated</span> with Ko-fi.com</strong>
    </p>
    <header class="bg-info pt-5 pb-5 mb-5">
        <div class="container">
            <div class="row">
                <div class="col">
                    <h1 class="fw-bold text-center text-light"><?= $error_code ?></h1>
                </div>
            </div>
        </div>
    </header>
    <div class="container">
        <div class="col">
            <p class="text-center">
                Woops, looks like you have landed on a page that doesn't exist. Use the button below to go home.
            </p>
        </div>
        <div class="col text-center">
            <a class="btn btn-primary fs-5 fw-bold link-light border rounded-pill" role="button" href="https://ko-fi.tools/"><i class="fas fa-undo me-2"></i>Home</a>
        </div>
    </div>
    <footer class="position-absolute bottom-0 w-100 text-white bg-primary pt-3 mt-5">
        <div class="container">
            <div class="row row-cols-1 row-cols-md-2">
                <div class="col">
                    <p class="fs-5 fw-bold m-0">Ko-fi tools</p>
                    <ul class="list-unstyled">
                        <li><a href="contact">Contact Me</a></li>
                        <li><a href="support">Help and Support</a></li>
                        <li><a href="https://status.ko-fi.tools/">Status Page</a></li>
                        <li><a href="https://ko-fi.com/catkin" target="_blank">Support Us</a></li>
                    </ul>
                </div>
                <div class="col">
                    <p class="fs-5 fw-bold m-0">Important stuff</p>
                    <ul class="list-unstyled">
                        <li><a href="https://ko-fi.tools/privacy-policy">Privacy Policy</a></li>
                        <li><a href="https://ko-fi.tools/terms-of-service">Terms of Service</a></li>
                    </ul>
                    <p class="mb-0 mt-5" style="font-size: 14px;"><em>Ko-fi.tools, letting you embed awesome since 2024.</em></p>
                    <p style="font-size: 14px;"><em>The name Ko-fi, and the Ko-fi cup are trademarks of Ko-fi Labs Limited.</em></p>
                </div>
            </div>
        </div>
    </footer>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://ko-fi.tools/assets/js/bs-init.js"></script>
    <script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script>
    <script src="https://ko-fi.tools/assets/js/ko-fi.js"></script>
</body>
</html>