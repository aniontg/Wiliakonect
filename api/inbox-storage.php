<?php
declare(strict_types=1);

function inboxStorageConfig(): array
{
    $url = rtrim(getenv('SUPABASE_URL') ?: '', '/');
    $serviceKey = getenv('SUPABASE_SECRET_KEY')
        ?: (getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '');
    $parsedUrl = parse_url($url);
    if (
        !$parsedUrl
        || ($parsedUrl['scheme'] ?? '') !== 'https'
        || empty($parsedUrl['host'])
        || $serviceKey === ''
        || strlen($serviceKey) > 4096
    ) {
        throw new RuntimeException('The private Supabase inbox connection is not configured.');
    }
    if (!function_exists('curl_init')) {
        throw new RuntimeException('The PHP cURL extension is required for inbox storage.');
    }

    return [$url, $serviceKey];
}

function requestInboxStorage(string $method, string $path, ?array $body = null, array $headers = []): array
{
    [$url, $serviceKey] = inboxStorageConfig();
    $curl = curl_init($url . '/rest/v1/' . $path);
    $requestHeaders = [
        'apikey: ' . $serviceKey,
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    foreach ($headers as $header) {
        $requestHeaders[] = $header;
    }

    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_HTTPHEADER => $requestHeaders,
    ]);
    if ($body !== null) {
        curl_setopt(
            $curl,
            CURLOPT_POSTFIELDS,
            json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        );
    }

    $responseBody = curl_exec($curl);
    $curlError = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if (!is_string($responseBody) || $status < 200 || $status >= 300) {
        error_log('Supabase support inbox request failed: HTTP ' . $status . ' ' . $curlError);
        throw new RuntimeException('The support inbox could not save this item. Please try again.');
    }
    if ($responseBody === '') {
        return [];
    }

    $response = json_decode($responseBody, true);
    if (!is_array($response)) {
        throw new RuntimeException('The support inbox returned an invalid response.');
    }
    return $response;
}

function inboxUuid(string $value): bool
{
    return preg_match(
        '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
        $value,
    ) === 1;
}

function consumeInboxRateLimit(string $scope, int $limit): ?bool
{
    $secret = getenv('CHAT_RATE_LIMIT_SECRET')
        ?: (getenv('SUPABASE_SECRET_KEY') ?: (getenv('SUPABASE_SERVICE_ROLE_KEY') ?: ''));
    if (!$secret) {
        return null;
    }

    $clientKey = hash_hmac(
        'sha256',
        $scope . ':' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
        $secret,
    );
    $path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wiliakonect-' . $scope . '-rate-limits.json';
    $file = @fopen($path, 'c+');
    if (!$file || !flock($file, LOCK_EX)) {
        if ($file) {
            fclose($file);
        }
        return null;
    }

    @chmod($path, 0600);
    $raw = stream_get_contents($file);
    $limits = is_string($raw) ? json_decode($raw, true) : [];
    if (!is_array($limits)) {
        $limits = [];
    }

    $now = time();
    foreach ($limits as $key => $record) {
        if (!is_array($record) || ($now - (int)($record['start'] ?? 0)) >= 60) {
            unset($limits[$key]);
        }
    }
    if (count($limits) > 2000) {
        uasort($limits, static fn(array $left, array $right): int =>
            ((int)($left['start'] ?? 0)) <=> ((int)($right['start'] ?? 0))
        );
        $limits = array_slice($limits, -2000, null, true);
    }

    $record = $limits[$clientKey] ?? ['start' => $now, 'count' => 0];
    $allowed = (int)$record['count'] < $limit;
    if ($allowed) {
        $record['count'] = (int)$record['count'] + 1;
        $limits[$clientKey] = $record;
    }

    rewind($file);
    ftruncate($file, 0);
    fwrite($file, json_encode($limits, JSON_UNESCAPED_SLASHES));
    fflush($file);
    flock($file, LOCK_UN);
    fclose($file);
    return $allowed;
}

function appendInboxConversationMessage(string $conversationId, string $role, string $text): void
{
    $existing = requestInboxStorage(
        'GET',
        'support_inbox?id=eq.' . rawurlencode($conversationId) . '&kind=eq.conversation&select=messages',
    );
    $messages = $existing[0]['messages'] ?? [];
    if (!is_array($messages)) {
        $messages = [];
    }
    $messages[] = ['role' => $role, 'text' => $text];
    $messages = array_slice($messages, -40);
    requestInboxStorage(
        'POST',
        'support_inbox?on_conflict=id',
        [
            'id' => $conversationId,
            'visitor_id' => $conversationId,
            'kind' => 'conversation',
            'messages' => $messages,
            'status' => 'new',
        ],
        ['Prefer: return=minimal,resolution=merge-duplicates'],
    );
}
