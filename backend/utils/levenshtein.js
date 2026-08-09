function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function fuzzyMatch(query, target) {
  const q = String(query).toLowerCase();
  const t = String(target).toLowerCase();
  if (t.includes(q)) return 0;
  const maxDist = q.length <= 6 ? 1 : 2;
  const windowSizes = [q.length - 2, q.length - 1, q.length, q.length + 1, q.length + 2].filter((s) => s >= q.length - 2 && s > 0);
  let best = Infinity;
  for (const size of windowSizes) {
    if (t.length < size) continue;
    for (let i = 0; i <= t.length - size; i++) {
      best = Math.min(best, levenshtein(q, t.slice(i, i + size)));
      if (best <= maxDist) return best;
    }
  }
  return best;
}

function fuzzySearch(rows, query) {
  const q = String(query).trim();
  const maxDist = q.length <= 6 ? 1 : 2;
  return rows
    .map((row) => ({
      row,
      dist: Math.min(
        fuzzyMatch(q, row.title),
        fuzzyMatch(q, row.author_name || '')
      )
    }))
    .filter(({ dist }) => dist <= maxDist)
    .sort((a, b) => a.dist - b.dist || a.row.title.localeCompare(b.row.title))
    .map(({ row }) => row);
}

module.exports = { levenshtein, fuzzySearch };
