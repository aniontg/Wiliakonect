<?php
declare(strict_types=1);

require_once __DIR__ . '/inbox-storage.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respondLead(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respondLead(405, ['error' => 'Use POST to submit an enquiry.']);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    respondLead(415, ['error' => 'Send enquiries as JSON.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $expectedOrigin = $scheme . '://' . strtolower($_SERVER['HTTP_HOST'] ?? '');
    if (!hash_equals($expectedOrigin, strtolower(rtrim($origin, '/')))) {
        respondLead(403, ['error' => 'Cross-site enquiry requests are not allowed.']);
    }
}

$body = file_get_contents('php://input');
if (!is_string($body) || strlen($body) > 5000) {
    respondLead(413, ['error' => 'Your enquiry is too large.']);
}

$input = json_decode($body, true);
if (!is_array($input)) {
    respondLead(400, ['error' => 'Send a valid JSON enquiry.']);
}

$name = trim(is_string($input['name'] ?? null) ? $input['name'] : '');
$email = trim(is_string($input['email'] ?? null) ? $input['email'] : '');
$service = trim(is_string($input['service'] ?? null) ? $input['service'] : '');
$message = trim(is_string($input['message'] ?? null) ? $input['message'] : '');
$visitorId = trim(is_string($input['visitor_id'] ?? null) ? $input['visitor_id'] : '');
$consent = ($input['consent'] ?? false) === true;
$allowedServices = [
    '',
    'Website or digital experience',
    'Wiliakonect website builder or CMS',
    'Software or business tools',
    'IT support and guidance',
    'Something else',
];

if (
    $name === ''
    || strlen($name) > 80
    || strlen($email) > 160
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || $message === ''
    || strlen($message) > 1200
    || !inboxUuid($visitorId)
    || !in_array($service, $allowedServices, true)
    || !$consent
) {
    respondLead(400, ['error' => 'Check your contact details, consent, and message, then try again.']);
}

$rateLimitAllowed = consumeInboxRateLimit('enquiry', 4);
if ($rateLimitAllowed === null) {
    respondLead(503, ['error' => 'The enquiry inbox is temporarily unavailable. Please use the Contact page or email us directly.']);
}
if (!$rateLimitAllowed) {
    respondLead(429, ['error' => 'Too many enquiries were submitted. Please wait a minute before trying again.']);
}

try {
    requestInboxStorage('POST', 'support_inbox?on_conflict=id', [
        'id' => sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0xffff),
        ),
        'visitor_id' => $visitorId,
        'kind' => 'enquiry',
        'visitor_name' => $name,
        'visitor_email' => $email,
        'service' => $service !== '' ? $service : null,
        'message' => $message,
        'consented_at' => gmdate('c'),
        'status' => 'new',
    ], ['Prefer: return=minimal,resolution=merge-duplicates']);
} catch (Throwable $error) {
    error_log('Unable to store a website enquiry: ' . $error->getMessage());
    respondLead(503, ['error' => 'Your enquiry could not be saved securely. Please try again or email us directly.']);
}

respondLead(201, ['saved' => true]);
