interface PackingItem {
  id: string;
  text: string;
  checked: boolean;
  subItems?: PackingItem[];
}

interface Category {
  id: string;
  name: string;
  items: PackingItem[];
}

interface PackingList {
  id: string;
  title: string;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

function error(message: string, code: string, status: number): Response {
  return json({ error: message, code }, status);
}

function kvKey(listId: string): string {
  return `list:${listId}`;
}

async function getList(kv: KVNamespace, listId: string): Promise<PackingList | null> {
  return kv.get<PackingList>(kvKey(listId), 'json');
}

// Router: match method + path and dispatch to handlers
export default {
  async fetch(request: Request, env: { KV: KVNamespace }): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const segments = path.split('/').filter(Boolean);

    try {
      // POST /api/lists
      if (method === 'POST' && segments[0] === 'api' && segments[1] === 'lists' && segments.length === 2) {
        const body: { id?: string; title?: string; categories?: { name: string; items?: ({ text: string } | string)[] }[] } = await request.json().catch(() => ({}));
        const categories: Category[] = (body.categories || []).map(c => ({
          id: crypto.randomUUID(),
          name: c.name,
          items: (c.items || []).map(i => ({ id: crypto.randomUUID(), text: typeof i === 'string' ? i : i.text, checked: false })),
        }));
        const list: PackingList = {
          id: body.id || crypto.randomUUID(),
          title: body.title || 'Ma liste de vacances',
          categories,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list, 201);
      }

      // PUT /api/lists/:listId (full save)
      if (method === 'PUT' && segments[0] === 'api' && segments[1] === 'lists' && segments.length === 3) {
        const existing = await getList(env.KV, segments[2]);
        const body: { title?: string; categories?: { id: string; name: string; items?: { id: string; text: string; checked: boolean; subItems?: { id: string; text: string; checked: boolean }[] }[] }[] } = await request.json().catch(() => ({}));
        const list: PackingList = {
          id: segments[2],
          title: body.title || 'Ma liste de vacances',
          categories: (body.categories || []).map(c => ({
            id: c.id || crypto.randomUUID(),
            name: c.name,
            items: (c.items || []).map(i => ({
              id: i.id || crypto.randomUUID(),
              text: i.text,
              checked: i.checked,
              subItems: i.subItems ? i.subItems.map(s => ({ id: s.id, text: s.text, checked: s.checked })) : undefined,
            })),
          })),
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list);
      }

      // GET /api/lists/:listId
      if (method === 'GET' && segments[0] === 'api' && segments[1] === 'lists' && segments.length === 3) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        return json(list);
      }

      // DELETE /api/lists/:listId
      if (method === 'DELETE' && segments[0] === 'api' && segments[1] === 'lists' && segments.length === 3) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        await env.KV.delete(kvKey(segments[2]));
        return json({ deleted: true });
      }

      // POST /api/lists/:listId/categories
      if (method === 'POST' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments.length === 4) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const body: { name?: string } = await request.json().catch(() => ({}));
        const name = (body.name || '').trim();
        if (!name) return error('Le nom de la catégorie est requis', 'BAD_REQUEST', 400);
        list.categories.push({ id: crypto.randomUUID(), name, items: [] });
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list, 201);
      }

      // DELETE /api/lists/:listId/categories/:categoryId
      if (method === 'DELETE' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments.length === 5) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        list.categories = list.categories.filter(c => c.id !== segments[4]);
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list);
      }

      // POST /api/lists/:listId/categories/:categoryId/items
      if (method === 'POST' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments[5] === 'items' && segments.length === 6) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const category = list.categories.find(c => c.id === segments[4]);
        if (!category) return error('Catégorie introuvable', 'NOT_FOUND', 404);
        const body: { text?: string } = await request.json().catch(() => ({}));
        const text = (body.text || '').trim();
        if (!text) return error('Le texte de l\'item est requis', 'BAD_REQUEST', 400);
        category.items.push({ id: crypto.randomUUID(), text, checked: false });
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list, 201);
      }

      // PATCH /api/lists/:listId/categories/:categoryId/items/:itemId
      if (method === 'PATCH' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments[5] === 'items' && segments.length === 7) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const category = list.categories.find(c => c.id === segments[4]);
        if (!category) return error('Catégorie introuvable', 'NOT_FOUND', 404);
        const item = category.items.find(i => i.id === segments[6]);
        if (!item) return error('Item introuvable', 'NOT_FOUND', 404);
        const body: { checked?: boolean; text?: string } = await request.json().catch(() => ({}));
        if (typeof body.checked === 'boolean') item.checked = body.checked;
        if (typeof body.text === 'string' && body.text.trim()) item.text = body.text.trim();
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list);
      }

      // DELETE /api/lists/:listId/categories/:categoryId/items/:itemId
      if (method === 'DELETE' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments[5] === 'items' && segments.length === 7) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const category = list.categories.find(c => c.id === segments[4]);
        if (!category) return error('Catégorie introuvable', 'NOT_FOUND', 404);
        category.items = category.items.filter(i => i.id !== segments[6]);
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list);
      }

      // POST /api/lists/:listId/categories/:categoryId/items/:itemId/subitems
      if (method === 'POST' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments[5] === 'items' && segments[7] === 'subitems' && segments.length === 8) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const category = list.categories.find(c => c.id === segments[4]);
        if (!category) return error('Catégorie introuvable', 'NOT_FOUND', 404);
        const item = category.items.find(i => i.id === segments[6]);
        if (!item) return error('Item introuvable', 'NOT_FOUND', 404);
        const body: { text?: string } = await request.json().catch(() => ({}));
        const text = (body.text || '').trim();
        if (!text) return error('Le texte du sous-item est requis', 'BAD_REQUEST', 400);
        if (!item.subItems) item.subItems = [];
        item.subItems.push({ id: crypto.randomUUID(), text, checked: false });
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list, 201);
      }

      // PATCH /api/lists/:listId/categories/:categoryId/items/:itemId/subitems/:subItemId
      if (method === 'PATCH' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments[5] === 'items' && segments[7] === 'subitems' && segments.length === 9) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const category = list.categories.find(c => c.id === segments[4]);
        if (!category) return error('Catégorie introuvable', 'NOT_FOUND', 404);
        const item = category.items.find(i => i.id === segments[6]);
        if (!item) return error('Item introuvable', 'NOT_FOUND', 404);
        if (!item.subItems) return error('Sous-item introuvable', 'NOT_FOUND', 404);
        const subItem = item.subItems.find(s => s.id === segments[8]);
        if (!subItem) return error('Sous-item introuvable', 'NOT_FOUND', 404);
        const body: { checked?: boolean; text?: string } = await request.json().catch(() => ({}));
        if (typeof body.checked === 'boolean') subItem.checked = body.checked;
        if (typeof body.text === 'string' && body.text.trim()) subItem.text = body.text.trim();
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list);
      }

      // DELETE /api/lists/:listId/categories/:categoryId/items/:itemId/subitems/:subItemId
      if (method === 'DELETE' && segments[0] === 'api' && segments[1] === 'lists' && segments[3] === 'categories' && segments[5] === 'items' && segments[7] === 'subitems' && segments.length === 9) {
        const list = await getList(env.KV, segments[2]);
        if (!list) return error('Liste introuvable', 'NOT_FOUND', 404);
        const category = list.categories.find(c => c.id === segments[4]);
        if (!category) return error('Catégorie introuvable', 'NOT_FOUND', 404);
        const item = category.items.find(i => i.id === segments[6]);
        if (!item) return error('Item introuvable', 'NOT_FOUND', 404);
        if (!item.subItems) return error('Sous-item introuvable', 'NOT_FOUND', 404);
        item.subItems = item.subItems.filter(s => s.id !== segments[8]);
        list.updatedAt = new Date().toISOString();
        await env.KV.put(kvKey(list.id), JSON.stringify(list));
        return json(list);
      }

      return error('Route introuvable', 'NOT_FOUND', 404);
    } catch (e) {
      return error('Erreur serveur', 'SERVER_ERROR', 500);
    }
  },
};
