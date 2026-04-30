/**
 * Cloudflare Worker for Todo Vacances
 *
 * Serves HTML from KV and handles API requests for list persistence.
 *
 * Routes:
 *   GET  /              → index.html (from KV key __index_html__)
 *   GET  /api/lists/:id → JSON data for list ID
 *   POST /api/lists/:id → Save JSON data for list ID
 *   GET  /api/lists     → 400 error (use /api/lists/{id})
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // API: /api/lists/:id
    const listMatch = url.pathname.match(/^\/api\/lists\/(.+)$/);
    if (listMatch) {
      const id = listMatch[1];

      // GET → retrieve list
      if (request.method === 'GET') {
        const data = await env.TODO_KV.get(id);
        if (!data) {
          return jsonResponse({ error: 'Not found' }, 404);
        }
        return jsonResponse(JSON.parse(data));
      }

      // POST → save list
      if (request.method === 'POST') {
        const body = await request.json();
        await env.TODO_KV.put(id, JSON.stringify(body));
        return jsonResponse({ ok: true, id });
      }

      return methodNotAllowed();
    }

    // API: /api/lists (no ID) → error
    if (url.pathname === '/api/lists') {
      return jsonResponse({ error: 'Use /api/lists/{id}' }, 400);
    }

    // Serve index.html from KV (covers / and any SPA routes)
    const html = await env.TODO_KV.get('__index_html__');
    if (!html) {
      return new Response('HTML not found in KV', { status: 500 });
    }
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...CORS_HEADERS,
      },
    });
  },
};

// Helpers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function methodNotAllowed() {
  return new Response('Method Not Allowed', { status: 405 });
}
