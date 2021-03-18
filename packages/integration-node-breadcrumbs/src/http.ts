import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

import { getSpan } from '@sentry/minimal';
import { ClientLike, IntegrationV7, Span } from '@sentry/types';
import { fill, logger, parseSemver } from '@sentry/utils';

const NODE_VERSION = parseSemver(process.versions.node);

// TODO: Tracing shouldnt live in the breadcrumbs, it has to be extracted.
export class HTTPBreadcrumbs implements IntegrationV7 {
  public name = this.constructor.name;

  private _client!: ClientLike;

  /**
   * @inheritDoc
   */
  private readonly _breadcrumbs: boolean;

  /**
   * @inheritDoc
   */
  private readonly _tracing: boolean;

  /**
   * @inheritDoc
   */
  public constructor(options: { breadcrumbs?: boolean; tracing?: boolean } = {}) {
    this._breadcrumbs = typeof options.breadcrumbs === 'undefined' ? true : options.breadcrumbs;
    this._tracing = typeof options.tracing === 'undefined' ? false : options.tracing;
  }

  /**
   * @inheritDoc
   */
  public install(client: ClientLike): void {
    this._client = client;

    // No need to instrument if we don't want to track anything
    if (!this._breadcrumbs && !this._tracing) {
      return;
    }

    const wrappedHandlerMaker = _createWrappedRequestMethodFactory(this._client, {
      breadcrumbsEnabled: this._breadcrumbs,
      tracingEnabled: this._tracing,
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const httpModule = require('http');
    fill(httpModule, 'get', wrappedHandlerMaker);
    fill(httpModule, 'request', wrappedHandlerMaker);

    // NOTE: Prior to Node 9, `https` used internals of `http` module, thus we don't patch it.
    // If we do, we'd get double breadcrumbs and double spans for `https` calls.
    // It has been changed in Node 9, so for all versions equal and above, we patch `https` separately.
    if (NODE_VERSION.major && NODE_VERSION.major > 8) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const httpsModule = require('https');
      fill(httpsModule, 'get', wrappedHandlerMaker);
      fill(httpsModule, 'request', wrappedHandlerMaker);
    }
  }
}

// for ease of reading below
type OriginalRequestMethod = RequestMethod;
type WrappedRequestMethod = RequestMethod;
type WrappedRequestMethodFactory = (original: OriginalRequestMethod) => WrappedRequestMethod;

/**
 * Function which creates a function which creates wrapped versions of internal `request` and `get` calls within `http`
 * and `https` modules. (NB: Not a typo - this is a creator^2!)
 *
 * @param breadcrumbsEnabled Whether or not to record outgoing requests as breadcrumbs
 * @param tracingEnabled Whether or not to record outgoing requests as tracing spans
 *
 * @returns A function which accepts the exiting handler and returns a wrapped handler
 */
function _createWrappedRequestMethodFactory(
  client: ClientLike,
  options: {
    breadcrumbsEnabled: boolean;
    tracingEnabled: boolean;
  },
): WrappedRequestMethodFactory {
  return function wrappedRequestMethodFactory(originalRequestMethod: OriginalRequestMethod): WrappedRequestMethod {
    return function wrappedMethod(this: typeof http | typeof https, ...args: RequestMethodArgs): http.ClientRequest {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const httpModule = this;

      const requestArgs = normalizeRequestArgs(args);
      const requestOptions = requestArgs[0];
      const requestUrl = extractUrl(requestOptions);
      const dsn = client.getDsn();

      // we don't want to record requests to Sentry as either breadcrumbs or spans, so just use the original method
      if (!dsn || requestUrl.includes(dsn.host)) {
        return originalRequestMethod.apply(httpModule, requestArgs);
      }

      const parentSpan = getSpan();
      let span: Span | undefined;

      if (options.tracingEnabled) {
        if (parentSpan) {
          span = parentSpan.startChild({
            description: `${requestOptions.method || 'GET'} ${requestUrl}`,
            op: 'request',
          });

          const sentryTraceHeader = span.toTraceparent();
          logger.log(`[Tracing] Adding sentry-trace header to outgoing request: ${sentryTraceHeader}`);
          requestOptions.headers = { ...requestOptions.headers, 'sentry-trace': sentryTraceHeader };
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return originalRequestMethod
        .apply(httpModule, requestArgs)
        .once('response', function(this: http.ClientRequest, res: http.IncomingMessage): void {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const req = this;
          if (options.breadcrumbsEnabled) {
            client.getScope()?.addBreadcrumb(
              {
                category: 'http',
                data: {
                  method: req.method,
                  status_code: res && res.statusCode,
                  url: requestUrl,
                },
                type: 'http',
              },
              {
                event: 'response',
                request: req,
                response: res,
              },
            );
          }
          if (options.tracingEnabled && span) {
            if (res.statusCode) {
              span.setHttpStatus(res.statusCode);
            }
            span.description = cleanSpanDescription(span.description, requestOptions, req);
            span.finish();
          }
        })
        .once('error', function(this: http.ClientRequest): void {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const req = this;

          if (options.breadcrumbsEnabled) {
            client.getScope()?.addBreadcrumb(
              {
                category: 'http',
                data: {
                  method: req.method,
                  url: requestUrl,
                },
                type: 'http',
              },
              {
                event: 'error',
                request: req,
              },
            );
          }
          if (options.tracingEnabled && span) {
            span.setHttpStatus(500);
            span.description = cleanSpanDescription(span.description, requestOptions, req);
            span.finish();
          }
        });
    };
  };
}

/**
 * Assemble a URL to be used for breadcrumbs and spans.
 *
 * @param requestOptions RequestOptions object containing the component parts for a URL
 * @returns Fully-formed URL
 */
export function extractUrl(requestOptions: RequestOptions): string {
  const protocol = requestOptions.protocol || '';
  const hostname = requestOptions.hostname || requestOptions.host || '';
  // Don't log standard :80 (http) and :443 (https) ports to reduce the noise
  const port =
    !requestOptions.port || requestOptions.port === 80 || requestOptions.port === 443 ? '' : `:${requestOptions.port}`;
  const path = requestOptions.path ? requestOptions.path : '/';

  return `${protocol}//${hostname}${port}${path}`;
}

/**
 * Handle various edge cases in the span description (for spans representing http(s) requests).
 *
 * @param description current `description` property of the span representing the request
 * @param requestOptions Configuration data for the request
 * @param Request Request object
 *
 * @returns The cleaned description
 */
export function cleanSpanDescription(
  description: string | undefined,
  requestOptions: RequestOptions,
  request: http.ClientRequest,
): string | undefined {
  // nothing to clean
  if (!description) {
    return description;
  }

  // eslint-disable-next-line prefer-const
  let [method, requestUrl] = description.split(' ');

  // superagent sticks the protocol in a weird place (we check for host because if both host *and* protocol are missing,
  // we're likely dealing with an internal route and this doesn't apply)
  if (requestOptions.host && !requestOptions.protocol) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    requestOptions.protocol = (request as any)?.agent?.protocol; // worst comes to worst, this is undefined and nothing changes
    requestUrl = extractUrl(requestOptions);
  }

  // internal routes can end up starting with a triple slash rather than a single one
  if (requestUrl?.startsWith('///')) {
    requestUrl = requestUrl.slice(2);
  }

  return `${method} ${requestUrl}`;
}

// the node types are missing a few properties which node's `urlToOptions` function spits out
export type RequestOptions = http.RequestOptions & { hash?: string; search?: string; pathname?: string; href?: string };
type RequestCallback = (response: http.IncomingMessage) => void;
export type RequestMethodArgs =
  | [RequestOptions | string | URL, RequestCallback?]
  | [string | URL, RequestOptions, RequestCallback?];
export type RequestMethod = (...args: RequestMethodArgs) => http.ClientRequest;

/**
 * Convert a URL object into a RequestOptions object.
 *
 * Copied from Node's internals (where it's used in http(s).request() and http(s).get()), modified only to use the
 * RequestOptions type above.
 *
 * See https://github.com/nodejs/node/blob/master/lib/internal/url.js.
 */
export function urlToOptions(url: URL): RequestOptions {
  const options: RequestOptions = {
    protocol: url.protocol,
    hostname:
      typeof url.hostname === 'string' && url.hostname.startsWith('[') ? url.hostname.slice(1, -1) : url.hostname,
    hash: url.hash,
    search: url.search,
    pathname: url.pathname,
    path: `${url.pathname || ''}${url.search || ''}`,
    href: url.href,
  };
  if (url.port !== '') {
    options.port = Number(url.port);
  }
  if (url.username || url.password) {
    options.auth = `${url.username}:${url.password}`;
  }
  return options;
}

/**
 * Normalize inputs to `http(s).request()` and `http(s).get()`.
 *
 * Legal inputs to `http(s).request()` and `http(s).get()` can take one of ten forms:
 *     [ RequestOptions | string | URL ],
 *     [ RequestOptions | string | URL, RequestCallback ],
 *     [ string | URL, RequestOptions ], and
 *     [ string | URL, RequestOptions, RequestCallback ].
 *
 * This standardizes to one of two forms: [ RequestOptions ] and [ RequestOptions, RequestCallback ]. A similar thing is
 * done as the first step of `http(s).request()` and `http(s).get()`; this just does it early so that we can interact
 * with the args in a standard way.
 *
 * @param requestArgs The inputs to `http(s).request()` or `http(s).get()`, as an array.
 *
 * @returns Equivalent args of the form [ RequestOptions ] or [ RequestOptions, RequestCallback ].
 */
export function normalizeRequestArgs(
  requestArgs: RequestMethodArgs,
): [RequestOptions] | [RequestOptions, RequestCallback] {
  let callback, requestOptions;

  // pop off the callback, if there is one
  if (typeof requestArgs[requestArgs.length - 1] === 'function') {
    callback = requestArgs.pop() as RequestCallback;
  }

  // create a RequestOptions object of whatever's at index 0
  if (typeof requestArgs[0] === 'string') {
    requestOptions = urlToOptions(new URL(requestArgs[0]));
  } else if (requestArgs[0] instanceof URL) {
    requestOptions = urlToOptions(requestArgs[0]);
  } else {
    requestOptions = requestArgs[0];
  }

  // if the options were given separately from the URL, fold them in
  if (requestArgs.length === 2) {
    requestOptions = { ...requestOptions, ...requestArgs[1] };
  }

  // return args in standardized form
  if (callback) {
    return [requestOptions, callback];
  } else {
    return [requestOptions];
  }
}