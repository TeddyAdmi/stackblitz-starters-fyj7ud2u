<script>
  (function() {
    function ping() {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'pocketnet_pong', status: 'listening' }, '*');
          window.parent.postMessage({ type: 'app_ready', status: 'ready' }, '*');
          window.parent.postMessage({ action: 'listening' }, '*');
        }
      } catch(e) {}
    }

    // Слушаем ВСЕ входящие сообщения от Bastyon и сразу ответим
    window.addEventListener('message', function(event) {
      ping();
    });

    // Шлем ответ каждые 200мс БЕЗ остановки
    setInterval(ping, 200);
  })();
</script>
