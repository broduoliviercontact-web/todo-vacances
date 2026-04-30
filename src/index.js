export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const match = url.pathname.match(/^\/api\/lists\/(.+)$/);
    if (match) {
      const id = match[1];
      if (request.method === 'GET') {
        const data = await env.TODO_KV.get(id);
        if (!data) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: corsHeaders });
        return new Response(data, { headers: corsHeaders });
      }
      if (request.method === 'POST') {
        const body = await request.json();
        await env.TODO_KV.put(id, JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true, id }), { headers: corsHeaders });
      }
    }

    if (url.pathname === '/api/lists') {
      return new Response(JSON.stringify({ error: 'Use /api/lists/{id}' }), { status: 400, headers: corsHeaders });
    }

    // Serve index.html from KV
    const html = await env.TODO_KV.get('__index_html__');
    if (!html) return new Response('HTML not found in KV', { status: 500 });
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
};
