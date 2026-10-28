<?php
// Relay for «Шашки в потоке»: both players poll it several times a second,
// each one writes its own state and reads the other's. Rooms are small JSON files.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out($a) { echo json_encode($a); exit; }

// first writable place for room files; shared hosting may forbid writing next to the script
$dir = null;
foreach (array(dirname(__FILE__) . '/rooms', sys_get_temp_dir() . '/molodoi-shashki', dirname(__FILE__)) as $d) {
  if (!is_dir($d)) @mkdir($d, 0755, true);
  if (is_dir($d) && is_writable($d)) { $dir = $d; break; }
}
if (!$dir) out(array('ok' => false, 'err' => 'fs'));
function now_ms() { return (int) round(microtime(true) * 1000); }

$act = isset($_GET['a']) ? $_GET['a'] : '';
$code = isset($_GET['c']) ? preg_replace('/\D/', '', $_GET['c']) : '';
$role = (isset($_GET['r']) && $_GET['r'] === 'g') ? 'g' : 'h';

if ($act === 'create') {
  // forget rooms nobody touched for an hour
  foreach ((array) glob($dir . '/*.json') as $f) {
    if ($f && filemtime($f) < time() - 3600) @unlink($f);
  }
  for ($i = 0; $i < 40; $i++) {
    $c = (string) mt_rand(1000, 9999);
    $f = "$dir/$c.json";
    if (file_exists($f) && filemtime($f) > time() - 600) continue;
    $room = array('h' => array('t' => now_ms(), 's' => null), 'g' => null, 'round' => null);
    if (file_put_contents($f, json_encode($room), LOCK_EX) === false) out(array('ok' => false, 'err' => 'fs'));
    out(array('ok' => true, 'c' => $c, 'now' => now_ms()));
  }
  out(array('ok' => false, 'err' => 'busy'));
}

if (strlen($code) !== 4) out(array('ok' => false, 'err' => 'code'));
$f = "$dir/$code.json";
if (!file_exists($f)) out(array('ok' => false, 'err' => 'nf'));

$body = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $raw = file_get_contents('php://input', false, null, 0, 4096);
  $body = json_decode($raw, true);
}

$fp = fopen($f, 'c+');
if (!$fp) out(array('ok' => false, 'err' => 'fs'));
flock($fp, LOCK_EX);
$room = json_decode(stream_get_contents($fp), true);
if (!is_array($room)) $room = array('h' => null, 'g' => null, 'round' => null);
$now = now_ms();
$other = $role === 'h' ? 'g' : 'h';
$res = array('ok' => true, 'now' => $now);

if ($act === 'join') {
  if ($room['g'] && $now - $room['g']['t'] < 8000) {
    $res = array('ok' => false, 'err' => 'full');
  } else {
    $room['g'] = array('t' => $now, 's' => null);
  }
} elseif ($act === 'sync') {
  $room[$role] = array('t' => $now, 's' => (is_array($body) && isset($body['s'])) ? $body['s'] : null);
  if ($role === 'h' && is_array($body) && isset($body['round'])) $room['round'] = $body['round'];
  $op = $room[$other];
  $res['op'] = $op ? array('s' => $op['s'], 'age' => $now - $op['t']) : null;
  $res['round'] = $room['round'];
} elseif ($act === 'leave') {
  $room[$role] = null;
} else {
  $res = array('ok' => false, 'err' => 'act');
}

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($room));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);
out($res);
