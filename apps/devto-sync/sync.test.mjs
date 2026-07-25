// The four checks specified in the design doc. Each one is a failure mode that
// actually shipped: the old Mode C hardcoded published:false, verified against
// /articles/me/unpublished (which cannot see a published article), and
// unconditionally unpublished anything it found published.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncArticle, fetchOwnArticle, toDevtoBody, readFrontmatterValue, RefuseError } from './sync.mjs';

// Minimal fake: records every call, replies from a scripted article list.
function fakeFetch({ articles = [], onPut } = {}) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url, method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : null });
    if (init.method === 'PUT') {
      const id = Number.parseInt(url.split('/').pop(), 10);
      const sent = JSON.parse(init.body).article;
      if (onPut) onPut(sent);
      const i = articles.findIndex((a) => a.id === id);
      // Model Dev.to's real behaviour: whatever `published` we send is applied,
      // and OMITTING it defaults to true. That is the bug being guarded.
      if (i !== -1) articles[i] = { ...articles[i], published: sent.published ?? true };
      return { ok: true, status: 200, text: async () => JSON.stringify(articles[i] ?? {}) };
    }
    return { ok: true, status: 200, text: async () => JSON.stringify(articles) };
  };
  return { impl, calls };
}

const KEY = 'test-key-never-logged';

test('published article: PUT carries published:true and it is NOT delisted', async () => {
  const articles = [{ id: 4156141, published: true, title: 'Streaming AI Responses' }];
  const { impl, calls } = fakeFetch({ articles });

  const out = await syncArticle({ id: 4156141, bodyMarkdown: '## new body', key: KEY, fetchImpl: impl });

  const put = calls.find((c) => c.method === 'PUT');
  assert.equal(put.body.article.published, true, 'must echo published:true back');
  assert.equal(articles[0].published, true, 'live article must still be published');
  assert.equal(out.published, true);

  // The old skill unconditionally unpublished anything found published.
  const unpublishing = calls.filter((c) => c.method === 'PUT' && c.body?.article?.published === false);
  assert.equal(unpublishing.length, 0, 'must never issue an unpublish call');
});

test('genuine draft: PUT carries published:false and it is NOT published', async () => {
  const articles = [{ id: 999, published: false, title: 'A real draft' }];
  const { impl, calls } = fakeFetch({ articles });

  const out = await syncArticle({ id: 999, bodyMarkdown: '## new body', key: KEY, fetchImpl: impl });

  assert.equal(calls.find((c) => c.method === 'PUT').body.article.published, false);
  assert.equal(articles[0].published, false, 'draft must stay a draft');
  assert.equal(out.published, false);
});

test('unknown id: refuses and issues NO PUT', async () => {
  const { impl, calls } = fakeFetch({ articles: [{ id: 1, published: true }] });

  await assert.rejects(
    () => syncArticle({ id: 424242, bodyMarkdown: 'x', key: KEY, fetchImpl: impl }),
    (err) => err instanceof RefuseError && /not in \/articles\/me\/all/.test(err.message),
  );
  assert.equal(calls.filter((c) => c.method === 'PUT').length, 0, 'no PUT on refusal');
});

test('lookup uses /articles/me/all, never GET /articles/<id>', async () => {
  // GET /articles/<id> serves published articles only, so it 404s for a real
  // draft - the exact case Mode C runs on.
  const { impl, calls } = fakeFetch({ articles: [{ id: 7, published: false }] });
  await fetchOwnArticle({ id: 7, key: KEY, fetchImpl: impl });

  assert.ok(calls[0].url.includes('/articles/me/all'), 'must use the authenticated list');
  assert.ok(!/\/articles\/\d+(\?|$)/.test(calls[0].url), 'must not hit the public single-article endpoint');
});

test('state change after PUT raises ALARM rather than reporting success', async () => {
  // A genuine DRAFT, with the guard bypassed - `published` is stripped from the
  // payload, so Dev.to's documented default-to-true silently publishes it.
  // false -> true is the change the safety net must catch.
  const articles = [{ id: 5, published: false }];
  const { impl } = fakeFetch({ articles, onPut: (sent) => { delete sent.published; } });

  await assert.rejects(
    () => syncArticle({ id: 5, bodyMarkdown: 'x', key: KEY, fetchImpl: impl }),
    /ALARM: published changed false -> true/,
  );
});

test('toDevtoBody strips frontmatter and absolutises relative links', () => {
  const mdx = ['---', 'title: "T"', 'devtoId: 4156141', '---', '', '## Body', 'See [posts](/blog/x).'].join('\n');
  const body = toDevtoBody(mdx);

  assert.ok(!body.includes('devtoId'), 'frontmatter must not reach Dev.to');
  assert.ok(body.includes('](https://adityadev.in/blog/x)'), 'relative link must be absolutised');
  assert.equal(readFrontmatterValue(mdx, 'devtoId'), '4156141');
});

test('empty body is refused', async () => {
  const { impl, calls } = fakeFetch({ articles: [{ id: 1, published: true }] });
  await assert.rejects(
    () => syncArticle({ id: 1, bodyMarkdown: '   ', key: KEY, fetchImpl: impl }),
    (err) => err instanceof RefuseError,
  );
  assert.equal(calls.length, 0);
});
