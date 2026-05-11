const BASE_URL = 'https://packing-list-api.pliskain.workers.dev';

async function request(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
}

export function createList(id, title, categories) {
  return request('POST', '/api/lists', { id, title, categories });
}

export function getList(listId) {
  return request('GET', `/api/lists/${listId}`);
}

export function addCategory(listId, name) {
  return request('POST', `/api/lists/${listId}/categories`, { name });
}

export function deleteCategory(listId, categoryId) {
  return request('DELETE', `/api/lists/${listId}/categories/${categoryId}`);
}

export function addItem(listId, categoryId, text) {
  return request('POST', `/api/lists/${listId}/categories/${categoryId}/items`, { text });
}

export function patchItem(listId, categoryId, itemId, patch) {
  return request('PATCH', `/api/lists/${listId}/categories/${categoryId}/items/${itemId}`, patch);
}

export function deleteItem(listId, categoryId, itemId) {
  return request('DELETE', `/api/lists/${listId}/categories/${categoryId}/items/${itemId}`);
}

export function addSubItem(listId, categoryId, itemId, text) {
  return request('POST', `/api/lists/${listId}/categories/${categoryId}/items/${itemId}/subitems`, { text });
}

export function patchSubItem(listId, categoryId, itemId, subItemId, patch) {
  return request('PATCH', `/api/lists/${listId}/categories/${categoryId}/items/${itemId}/subitems/${subItemId}`, patch);
}

export function deleteSubItem(listId, categoryId, itemId, subItemId) {
  return request('DELETE', `/api/lists/${listId}/categories/${categoryId}/items/${itemId}/subitems/${subItemId}`);
}

export function saveList(listId, data) {
  return request('PUT', `/api/lists/${listId}`, data);
}
