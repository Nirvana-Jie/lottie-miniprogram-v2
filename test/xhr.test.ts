import { afterEach, describe, expect, it, vi } from 'vitest';

type RequestOptions = {
  data?: unknown;
  header?: Record<string, string>;
  method?: string;
  url?: string;
  success?: (response: { data: unknown; statusCode: number; header: Record<string, string> }) => void;
  fail?: (response: { errMsg?: string }) => void;
};

async function loadXHR(request: (options: RequestOptions) => { abort?: () => void }) {
  vi.resetModules();
  (globalThis as any).tt = { request };
  delete (globalThis as any).wx;
  const module = await import('../src/adapter/XMLHttpRequest');
  return module.default;
}

async function loadInjectedXHR(request: (options: RequestOptions) => { abort?: () => void }) {
  vi.resetModules();
  delete (globalThis as any).tt;
  delete (globalThis as any).wx;
  const adapter = await import('../src/adapter');
  adapter.setup(
    {
      getContext: () => ({}),
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
    },
    { api: { request } },
  );
  const module = await import('../src/adapter/XMLHttpRequest');
  return { XHR: module.default, restore: adapter.restore };
}

afterEach(() => {
  delete (globalThis as any).tt;
  delete (globalThis as any).wx;
});

describe('Miniapp XMLHttpRequest', () => {
  it('stores response headers and preserves the upstream success event order', async () => {
    let sentOptions: RequestOptions | undefined;
    const XHR = await loadXHR((options) => {
      sentOptions = options;
      options.success?.({
        data: { ok: true },
        statusCode: 200,
        header: {
          'content-type': 'application/json',
          'x-request-id': 'abc',
        },
      });
      return { abort() {} };
    });
    const xhr = new XHR();
    const events: string[] = [];

    xhr.onreadystatechange = () => events.push(`state:${xhr.readyState}`);
    xhr.onloadstart = () => events.push('loadstart');
    xhr.onload = () => events.push('load');
    xhr.onloadend = () => events.push('loadend');

    xhr.open('GET', 'https://example.com/data.json');
    events.length = 0;
    xhr.setRequestHeader('x-token', '123');
    xhr.send('payload');

    expect(sentOptions).toMatchObject({
      data: 'payload',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-token': '123',
      },
      method: 'GET',
      url: 'https://example.com/data.json',
    });
    expect(events).toEqual(['loadstart', 'state:2', 'state:3', 'state:4', 'load', 'loadend']);
    expect(xhr.status).toBe(200);
    expect(xhr.response).toBe('{"ok":true}');
    expect(xhr.responseText).toBe('{"ok":true}');
    expect(xhr.getResponseHeader('content-type')).toBe('application/json');
    expect(xhr.getResponseHeader('missing')).toBeNull();
    expect(xhr.getAllResponseHeaders()).toBe('content-type: application/json\nx-request-id: abc');
  });

  it('converts ArrayBuffer responses to responseText', async () => {
    const body = new Uint8Array([65, 66, 67]).buffer;
    const XHR = await loadXHR((options) => {
      options.success?.({
        data: body,
        statusCode: 200,
        header: {},
      });
      return {};
    });
    const xhr = new XHR();

    xhr.open('GET', 'https://example.com/binary');
    xhr.send();

    expect(xhr.response).toBe(body);
    expect(xhr.responseText).toBe('ABC');
  });

  it('marks failed requests as DONE before error and loadend', async () => {
    const XHR = await loadXHR((options) => {
      options.fail?.({ errMsg: 'request:fail network' });
      return {};
    });
    const xhr = new XHR();
    const events: string[] = [];

    xhr.onreadystatechange = () => events.push(`state:${xhr.readyState}`);
    xhr.onerror = (message) => events.push(`error:${message}`);
    xhr.onloadend = () => events.push('loadend');

    xhr.open('GET', 'https://example.com/fail');
    events.length = 0;
    xhr.send();

    expect(xhr.readyState).toBe(XHR.DONE);
    expect(events).toEqual(['state:4', 'error:request:fail network', 'loadend']);
  });

  it('marks aborted requests as DONE before abort and loadend', async () => {
    const XHR = await loadXHR((options) => {
      options.fail?.({ errMsg: 'request:fail abort' });
      return {};
    });
    const xhr = new XHR();
    const events: string[] = [];

    xhr.onreadystatechange = () => events.push(`state:${xhr.readyState}`);
    xhr.onabort = (message) => events.push(`abort:${message}`);
    xhr.onloadend = () => events.push('loadend');

    xhr.open('GET', 'https://example.com/abort');
    events.length = 0;
    xhr.send();

    expect(xhr.readyState).toBe(XHR.DONE);
    expect(events).toEqual(['state:4', 'abort:request:fail abort', 'loadend']);
  });

  it('coerces non-serializable object responses to string responseText', async () => {
    const body: Record<string, unknown> = {};
    body.self = body;
    const XHR = await loadXHR((options) => {
      options.success?.({
        data: body,
        statusCode: 200,
        header: {},
      });
      return {};
    });
    const xhr = new XHR();

    xhr.open('GET', 'https://example.com/circular');
    xhr.send();

    expect(xhr.response).toBe('[object Object]');
    expect(xhr.responseText).toBe('[object Object]');
  });

  it('uses the injected miniapp api when tt is not global', async () => {
    let sentOptions: RequestOptions | undefined;
    const { XHR, restore } = await loadInjectedXHR((options) => {
      sentOptions = options;
      options.success?.({
        data: 'ok',
        statusCode: 200,
        header: {},
      });
      return {};
    });
    const xhr = new XHR();

    xhr.open('GET', 'https://example.com/card.json');
    xhr.send();

    expect(sentOptions?.url).toBe('https://example.com/card.json');
    expect(xhr.responseText).toBe('ok');

    restore();
  });
});
