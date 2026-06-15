import { getMiniappApi } from './miniapp-api';

const urlMap = new WeakMap<MiniappXMLHttpRequest, string>();
const methodMap = new WeakMap<MiniappXMLHttpRequest, string>();
const headerMap = new WeakMap<MiniappXMLHttpRequest, Record<string, string>>();
const responseHeaderMap = new WeakMap<MiniappXMLHttpRequest, Record<string, string>>();
const taskMap = new WeakMap<MiniappXMLHttpRequest, { abort?: () => void }>();

function trigger(target: MiniappXMLHttpRequest, type: string, ...args: unknown[]) {
  const handler = (target as any)[`on${type}`];
  if (typeof handler === 'function') {
    handler.apply(target, args);
  }
}

function changeReadyState(target: MiniappXMLHttpRequest, readyState: number) {
  target.readyState = readyState;
  trigger(target, 'readystatechange');
}

function arrayBufferToText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let text = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    text += String.fromCharCode(bytes[i]);
  }
  return text;
}

function normalizeResponseData(data: unknown) {
  if (typeof data === 'string' || data instanceof ArrayBuffer) {
    return data;
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export default class MiniappXMLHttpRequest {
  static UNSENT = 0;
  static OPENED = 1;
  static HEADERS_RECEIVED = 2;
  static LOADING = 3;
  static DONE = 4;

  onabort: null | ((...args: unknown[]) => void) = null;
  onerror: null | ((...args: unknown[]) => void) = null;
  onload: null | ((...args: unknown[]) => void) = null;
  onloadstart: null | ((...args: unknown[]) => void) = null;
  onprogress: null | ((...args: unknown[]) => void) = null;
  ontimeout: null | ((...args: unknown[]) => void) = null;
  onloadend: null | ((...args: unknown[]) => void) = null;
  onreadystatechange: null | ((...args: unknown[]) => void) = null;
  readyState = MiniappXMLHttpRequest.UNSENT;
  response: unknown = null;
  responseText: string | null = null;
  responseType = '';
  responseXML: unknown = null;
  status = 0;
  statusText = '';
  upload = {};
  withCredentials = false;

  constructor() {
    headerMap.set(this, {
      'content-type': 'application/x-www-form-urlencoded',
    });
    responseHeaderMap.set(this, {});
  }

  abort() {
    const task = taskMap.get(this);
    if (task && typeof task.abort === 'function') {
      task.abort();
    }
  }

  getAllResponseHeaders() {
    const responseHeaders = responseHeaderMap.get(this) || {};
    return Object.keys(responseHeaders)
      .map((header) => `${header}: ${responseHeaders[header]}`)
      .join('\n');
  }

  getResponseHeader(header: string) {
    const responseHeaders = responseHeaderMap.get(this) || {};
    return responseHeaders[header] ?? null;
  }

  open(method: string, url: string) {
    methodMap.set(this, method);
    urlMap.set(this, url);
    changeReadyState(this, MiniappXMLHttpRequest.OPENED);
  }

  overrideMimeType() {}

  send(data: unknown = '') {
    if (this.readyState !== MiniappXMLHttpRequest.OPENED) {
      throw new Error("Failed to execute 'send' on 'XMLHttpRequest': the object must be OPENED.");
    }
    const requestApi = getMiniappApi();
    if (!requestApi || typeof requestApi.request !== 'function') {
      throw new Error('No miniapp request API is available.');
    }

    const task = requestApi.request({
      data,
      url: urlMap.get(this),
      method: methodMap.get(this),
      header: headerMap.get(this),
      success: ({
        data: responseData,
        statusCode,
        header,
      }: {
        data: unknown;
        statusCode: number;
        header: Record<string, string>;
      }) => {
        const body = normalizeResponseData(responseData);
        this.status = statusCode;
        responseHeaderMap.set(this, header || {});
        trigger(this, 'loadstart');
        changeReadyState(this, MiniappXMLHttpRequest.HEADERS_RECEIVED);
        changeReadyState(this, MiniappXMLHttpRequest.LOADING);
        this.response = body;
        this.responseText = body instanceof ArrayBuffer ? arrayBufferToText(body) : String(body);
        changeReadyState(this, MiniappXMLHttpRequest.DONE);
        trigger(this, 'load');
        trigger(this, 'loadend');
      },
      fail: ({ errMsg }: { errMsg?: string }) => {
        changeReadyState(this, MiniappXMLHttpRequest.DONE);
        trigger(this, errMsg && errMsg.indexOf('abort') !== -1 ? 'abort' : 'error', errMsg);
        trigger(this, 'loadend');
      },
    }) as { abort?: () => void };
    taskMap.set(this, task);
  }

  setRequestHeader(header: string, value: string) {
    const headers = headerMap.get(this);
    if (headers) {
      headers[header] = value;
    }
  }
}
