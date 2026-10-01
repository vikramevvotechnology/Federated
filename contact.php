<?php
/**
 * Federated.One — contact form mailer (Hostinger / PHP).
 *
 * Receives the enquiry form from contact.html (JSON POST from assets/js/main.js,
 * or a normal form POST), validates it, and emails it to RECIPIENT.
 * Replies to the email go straight to the visitor (Reply-To).
 */

const RECIPIENT    = 'vikramevvotechnology@gmail.com';
const FROM_ADDRESS = 'no-reply@federated.one';   // must be on the site's own domain
const FROM_NAME    = 'Federated.One Website';
const SUBJECT      = 'New enquiry from the Federated.One website';

ini_set('display_errors', '0');   // never let PHP notices corrupt the JSON reply
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed']);
}

// Accept JSON (sent by main.js) or classic form-encoded posts
$raw  = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    $data = $_POST;
}

// Spam trap: real visitors never fill this hidden field — pretend success
if (!empty($data['_honey'])) {
    respond(200, ['success' => true]);
}

// Normalise input: trim, strip control characters, cap length
function field(array $data, string $key, int $max = 500): string {
    $value = isset($data[$key]) ? (string) $data[$key] : '';
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr(trim($value), 0, $max);
}
// Single-line values must never contain line breaks (prevents header injection)
function line(string $value): string {
    return trim(preg_replace('/[\r\n]+/', ' ', $value));
}

$topics = [
    'pilot'       => 'I Am Ready for a Pilot',
    'partnership' => 'Partnership',
    'platform'    => 'Platform question',
    'other'       => 'Something else',
];

$name    = line(field($data, 'name', 120));
$email   = line(field($data, 'email', 160));
$org     = line(field($data, 'organization', 160));
$role    = line(field($data, 'role', 120));
$orgType = line(field($data, 'organization_type', 80));
$country = line(field($data, 'country', 80));
$message = field($data, 'message', 5000);
$topic   = $topics[field($data, 'topic', 40)] ?? 'Not specified';
$consent = !empty($data['consent']);

$errors = [];
if ($name === '')                                   $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     $errors[] = 'email';
if ($org === '')                                    $errors[] = 'organization';
if ($orgType === '')                                $errors[] = 'organization_type';
if (mb_strlen($message) < 10)                       $errors[] = 'message';
if (!$consent)                                      $errors[] = 'consent';
if ($errors) {
    respond(422, ['success' => false, 'message' => 'Please check: ' . implode(', ', $errors)]);
}

// Build the email (plain text keeps it readable everywhere)
$rows = [
    'Topic'             => $topic,
    'Name'              => $name,
    'Email'             => $email,
    'Organization'      => $org,
    'Job title'         => $role !== '' ? $role : '—',
    'Organization type' => $orgType,
    'Country'           => $country !== '' ? $country : '—',
];
$body = "A new enquiry was sent from the Federated.One contact form.\n\n";
foreach ($rows as $label => $value) {
    $body .= str_pad($label . ':', 20) . $value . "\n";
}
$body .= "\nMessage:\n" . $message . "\n\n";
$body .= "—\nSent " . gmdate('Y-m-d H:i') . " UTC from " . ($_SERVER['HTTP_HOST'] ?? 'federated.one') . "\n";
$body .= "Reply to this email to answer " . $name . " directly.\n";

$headers = [
    'From: ' . FROM_NAME . ' <' . FROM_ADDRESS . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: Federated.One contact form',
];
$subject = '=?UTF-8?B?' . base64_encode(SUBJECT . ' — ' . $topic) . '?=';

$sent = mail(RECIPIENT, $subject, $body, implode("\r\n", $headers), '-f' . FROM_ADDRESS);

if (!$sent) {
    respond(500, ['success' => false, 'message' => 'The mail server could not send the message']);
}
respond(200, ['success' => true]);
