<?php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if ($path === '/api/chat.php') {
    require __DIR__ . '/api/chat.php';
    exit;
}
if ($path === '/') {
    $path = '/index.html';
}

$root = realpath(__DIR__);
$relativePath = rawurldecode(ltrim(str_replace('/', DIRECTORY_SEPARATOR, $path ?: '/'), DIRECTORY_SEPARATOR));
$requestedFile = $root ? realpath($root . DIRECTORY_SEPARATOR . $relativePath) : false;
if (
    $root
    && $requestedFile
    && str_starts_with($requestedFile, $root . DIRECTORY_SEPARATOR)
    && is_file($requestedFile)
) {
    return false;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Not found';
