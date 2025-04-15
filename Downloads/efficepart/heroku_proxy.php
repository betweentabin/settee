#!/usr/bin/php
<?php
// Heroku バックエンド連携プロキシ
// このスクリプトはXサーバーからHerokuのバックエンドにリクエストを中継します

// ログディレクトリの作成（絶対パスを使用）
$base_dir = dirname(__FILE__);
$log_dir = $base_dir . '/logs';
if (!file_exists($log_dir)) {
    mkdir($log_dir, 0777, true);  // 777に設定してどのユーザーからも書き込み可能に
    // ディレクトリが正常に作成されたか確認
    if (file_exists($log_dir)) {
        chmod($log_dir, 0777); // 確実にパーミッションを設定
    } else {
        // fallback - /tmp にログを作成
        $log_dir = sys_get_temp_dir();
    }
}

// ログファイルのパス
$log_file = $log_dir . '/heroku_proxy.log';

// 権限問題を避けるためのファイル存在チェックとパーミッション設定
if (!file_exists($log_file)) {
    // ファイルが存在しない場合、空のファイルを作成
    touch($log_file);
    chmod($log_file, 0666); // 読み書き権限を全ユーザーに付与
} else {
    // ファイルが存在するが書き込めない場合、パーミッションを変更
    if (!is_writable($log_file)) {
        chmod($log_file, 0666);
    }
}

// ログ関数
function write_log($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message" . PHP_EOL;
    file_put_contents($log_file, $log_message, FILE_APPEND);
}

// リクエスト開始のログ
write_log("==================== リクエスト開始 ====================");
write_log("リクエストURI: " . $_SERVER['REQUEST_URI']);
write_log("リクエストメソッド: " . $_SERVER['REQUEST_METHOD']);
write_log("リモートアドレス: " . $_SERVER['REMOTE_ADDR']);
write_log("ユーザーエージェント: " . $_SERVER['HTTP_USER_AGENT']);

// セキュリティ設定
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// リクエスト情報の取得
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = $_SERVER['SCRIPT_NAME'];

// リクエストパスの取得
$request_path = '/';
if (strpos($request_uri, $script_name) === 0) {
    $path = substr($request_uri, strlen($script_name));
    if (!empty($path)) {
        $request_path = $path;
    }
} else {
    // パスを処理
    $path = $request_uri;
    
    // API関連のパスを抽出
    if (preg_match('|/api/([^/]+)/([^/]+)|', $path, $matches)) {
        $api_category = $matches[1];
        $api_action = $matches[2];
        $request_path = "/api/{$api_category}/{$api_action}";
    } else {
        $request_path = $path;
    }
}

write_log("リクエストパス: $request_path (元のURI: $request_uri)");

// 静的ファイルの処理（/static/ で始まるパス）
if (strpos($request_path, '/static/') === 0) {
    $file_path = $base_dir . $request_path;
    write_log("静的ファイルアクセス: {$file_path}");
    
    if (file_exists($file_path)) {
        // MIMEタイプの判定
        $ext = pathinfo($file_path, PATHINFO_EXTENSION);
        $mime_types = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml'
        ];
        
        $mime_type = isset($mime_types[$ext]) ? $mime_types[$ext] : 'application/octet-stream';
        
        // ヘッダー設定
        header("Content-Type: $mime_type");
        header("Content-Length: " . filesize($file_path));
        
        // ファイル出力
        readfile($file_path);
        write_log("静的ファイル配信完了: {$request_path} ({$mime_type})");
        exit;
    } else {
        write_log("エラー: 静的ファイルが見つかりません: {$file_path}");
        header('HTTP/1.0 404 Not Found');
        echo "File not found";
        exit;
    }
}

// Herokuへの接続情報
$heroku_url = 'https://efficepart-backend.herokuapp.com'; // あなたのHerokuアプリのURLに変更してください

// APIパスへのリクエストの場合、Herokuに転送
if (strpos($request_path, '/api/') === 0) {
    $api_url = $heroku_url . $request_path;
    write_log("Heroku APIリクエスト: {$api_url}");
    
    // cURLセッションの初期化
    $ch = curl_init($api_url);
    
    // cURLオプションの設定
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // POSTの場合はPOSTデータを設定
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        
        // POSTデータの設定
        if (count($_POST) > 0) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($_POST));
            write_log("POSTデータ: " . json_encode($_POST));
        } else {
            // JSON形式のPOSTデータがある場合
            $post_data = file_get_contents('php://input');
            if (!empty($post_data)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
                write_log("POSTデータ(JSON): " . $post_data);
                // JSONヘッダーの追加
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            }
        }
    }
    
    // リクエストの実行
    $start_time = microtime(true);
    $response = curl_exec($ch);
    $execution_time = microtime(true) - $start_time;
    
    // エラーチェック
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        write_log("cURLエラー: {$error}");
        header('Content-Type: application/json');
        echo json_encode(['error' => "APIリクエストに失敗しました: {$error}"]);
        curl_close($ch);
        exit;
    }
    
    // HTTPステータスコードの取得
    $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    write_log("HTTPステータスコード: {$status_code}");
    
    // レスポンスのContent-Typeを取得
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    if ($content_type) {
        header("Content-Type: {$content_type}");
    } else {
        // コンテンツタイプが取得できない場合、レスポンスの内容から推測
        if (strpos($response, '<!DOCTYPE html>') !== false || strpos($response, '<html') !== false) {
            header('Content-Type: text/html; charset=UTF-8');
        } else {
            header('Content-Type: application/json; charset=UTF-8');
        }
    }
    
    // cURLセッションの終了
    curl_close($ch);
    
    write_log("Herokuからのレスポンス取得完了（{$execution_time}秒）");
    write_log("レスポンスデータ: " . substr($response, 0, 200) . (strlen($response) > 200 ? '...' : ''));
    
    // レスポンスの出力
    echo $response;
    
    write_log("==================== リクエスト終了 ====================");
    exit;
}

// 上記以外のリクエストは通常のindex.htmlまたは他の静的ファイルを表示
$file_path = '';

if ($request_path === '/' || $request_path === '') {
    $file_path = $base_dir . '/index.html';
} else {
    // スラッシュで始まるパスの処理
    $path = ltrim($request_path, '/');
    $file_path = $base_dir . '/' . $path;
    
    // ディレクトリの場合はindex.htmlを追加
    if (is_dir($file_path)) {
        $file_path = rtrim($file_path, '/') . '/index.html';
    }
}

write_log("ファイルパス: {$file_path}");

if (file_exists($file_path)) {
    // MIMEタイプの判定
    $ext = pathinfo($file_path, PATHINFO_EXTENSION);
    $mime_types = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml'
    ];
    
    $mime_type = isset($mime_types[$ext]) ? $mime_types[$ext] : 'application/octet-stream';
    
    // ヘッダー設定
    header("Content-Type: {$mime_type}");
    
    // ファイル出力
    readfile($file_path);
    write_log("ファイル配信完了: {$file_path}");
} else {
    write_log("エラー: ファイルが見つかりません: {$file_path}");
    header('HTTP/1.0 404 Not Found');
    echo "File not found";
}

write_log("==================== リクエスト終了 ====================");
?> 