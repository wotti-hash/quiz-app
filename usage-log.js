// ══════════════════════════════════════════════════════════════
//  QUIZ HUB 利用ログ（共有）
//  各アプリの </body> 直前に <script src="usage-log.js"></script> を1行追加するだけ。
//  起動時に {アプリ・なまえ・日時・端末} を Firebase の usage/ に記録する。
//  toieba と同じFirebaseプロジェクトのRealtime Database を再利用（rooms/ とは別の usage/ に保存）。
//  ※ Firebase無料枠(Spark)で運用。APIキーはWebでは公開前提の値。
// ══════════════════════════════════════════════════════════════
(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyDML1qE08Wk3Yah_e35PqGOlXlKEX5-wLc",
    authDomain: "toieba-game.firebaseapp.com",
    databaseURL: "https://toieba-game-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "toieba-game",
    storageBucket: "toieba-game.firebasestorage.app",
    messagingSenderId: "987291900786",
    appId: "1:987291900786:web:dc0430a21c1995c4b3dbeb"
  };

  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

  // 端末ID（なまえが無くても端末単位で区別できる）
  function deviceId() {
    var d = localStorage.getItem('quizhub_device');
    if (!d) { d = 'd-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('quizhub_device', d); }
    return d;
  }

  // 既存アプリのセーブからなまえを拾う（あれば prompt を省略）
  function knownName() {
    try { var f = JSON.parse(localStorage.getItem('fractionTower_v1')); if (f && f.name) return f.name; } catch (e) {}
    try { var g = JSON.parse(localStorage.getItem('factorTower_v1')); if (g && g.name) return g.name; } catch (e) {}
    var k = localStorage.getItem('kokugoTowerCurUser_v1'); if (k) return k;
    try { var t = sessionStorage.getItem('toieba_name'); if (t) return t; } catch (e) {}
    return null;
  }

  function getName() {
    var n = localStorage.getItem('quizhub_name');
    if (n) return n;
    n = knownName();
    if (!n) {
      try { n = window.prompt('なまえを入力してね（学習の記録用）'); } catch (e) { n = null; }
    }
    n = (n || 'ゲスト').toString().trim().slice(0, 16) || 'ゲスト';
    localStorage.setItem('quizhub_name', n);
    return n;
  }

  function appId() {
    var p = (location.pathname.split('/').pop() || 'unknown').replace(/\.html.*$/, '');
    return p || 'unknown';
  }

  function loadScript(src, cb) {
    var s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = cb; s.onerror = function () {}; document.head.appendChild(s);
  }
  function ensureFirebase(cb) {
    if (window.firebase && window.firebase.database && window.firebase.auth) return init(cb);
    loadScript(SDK + 'firebase-app-compat.js', function () {
      loadScript(SDK + 'firebase-auth-compat.js', function () {
        loadScript(SDK + 'firebase-database-compat.js', function () { init(cb); });
      });
    });
  }
  function init(cb) {
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
      // 匿名認証が成立してからDBへ書き込む（ルールが auth != null を要求するため）。cbは認証成立後に一度だけ発火。
      var fired = false;
      firebase.auth().onAuthStateChanged(function (user) {
        if (user && !fired) { fired = true; cb(); }
      });
      firebase.auth().signInAnonymously().catch(function () {});
    } catch (e) {}
  }

  function record(extra) {
    ensureFirebase(function () {
      try {
        var data = {
          app: appId(),
          title: document.title || '',
          name: getName(),
          device: deviceId(),
          ts: firebase.database.ServerValue.TIMESTAMP
        };
        if (extra) for (var k in extra) data[k] = extra[k];
        firebase.database().ref('usage').push(data);
      } catch (e) {}
    });
  }

  // 起動ログを1回記録
  record({ event: 'open' });

  // 任意：アプリ側から QuizHubLog({event:'clear', detail:'3F L2'}) で追加イベントも送れる
  window.QuizHubLog = function (extra) { record(extra || {}); };
})();
