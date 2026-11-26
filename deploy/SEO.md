# Sitemaps and robots.txt

Each site (the platform, every studio subdomain, and custom domains) serves
`/sitemap.xml` and `/robots.txt` from the API, so they always list that site's
current pages and products:

- `GET /api/seo/sitemap.xml`
- `GET /api/seo/robots.txt`

The API works out which site is asking from the request's host, the same way
it does for every other request.

## CloudFront

Add two cache behaviours to the distribution, above the default (S3) one:

| Path pattern   | Origin | Origin path rewrite        | Cache                         |
|----------------|--------|----------------------------|-------------------------------|
| `/sitemap.xml` | API    | `/api/seo/sitemap.xml`     | Honour origin (1 hour)        |
| `/robots.txt`  | API    | `/api/seo/robots.txt`      | Honour origin (1 hour)        |

Forward the `Host` header (or `X-Forwarded-Host`) so the API knows the site.
A CloudFront Function on viewer request can do the rewrite:

```js
function handler(event) {
  var r = event.request;
  if (r.uri === "/sitemap.xml") r.uri = "/api/seo/sitemap.xml";
  else if (r.uri === "/robots.txt") r.uri = "/api/seo/robots.txt";
  return r;
}
```

Until this is set up, the static `public/robots.txt` is served instead. That
still works, but search engines won't be told where the sitemap is.

## Custom domains (Nginx on the VPS)

Custom domains already send `/api` to the API. Add:

```nginx
location = /sitemap.xml { proxy_pass http://127.0.0.1:5060/api/seo/sitemap.xml; proxy_set_header Host $host; }
location = /robots.txt  { proxy_pass http://127.0.0.1:5060/api/seo/robots.txt;  proxy_set_header Host $host; }
```

Then submit `https://<site>/sitemap.xml` in Google Search Console for the
platform and for any studio that wants to appear in search.

# Page titles and link previews for crawlers that don't run JavaScript

The app sets each page's title, description, preview image and structured data
in the browser. Google runs JavaScript, so it already sees them. Link previews
(WhatsApp, Facebook, X, iMessage, Slack) and some search engines don't: they
read only the HTML the server sends, which is the same `index.html` for every
site, so a shared studio link shows "Zuri" instead of the business.

The API can send that HTML with the right head for the business and page:

- `GET /api/seo/page?host=bella.zuristudios.com&path=/services` returns
  `index.html` with its title, description, canonical URL, Open Graph and
  Twitter tags, and JSON-LD (the business, its services and prices, or a
  product with its price and stock). The app itself is unchanged, so a person
  who lands on it gets the normal site. Cached for 10 minutes.

Send only crawlers there; people keep getting the static `index.html` from S3.

## CloudFront (Lambda@Edge, origin request, default behaviour)

A CloudFront Function can't change the origin, so this needs Lambda@Edge on
the default behaviour's **origin request**, with `User-Agent` forwarded to it
(add it to the origin request policy):

```js
const BOTS = /bot|crawler|spider|facebookexternalhit|whatsapp|twitterbot|slackbot|linkedinbot|telegrambot|discordbot|embedly|pinterest|bingpreview|skypeuripreview/i;
const API_HOST = "api.zuristudios.com"; // the API origin

exports.handler = async (event) => {
  const req = event.Records[0].cf.request;
  const ua = (req.headers["user-agent"] || [{ value: "" }])[0].value;
  const last = req.uri.split("/").pop();
  const isPage = !last || !last.includes(".");
  if (isPage && BOTS.test(ua)) {
    const host = req.headers.host[0].value; // the studio's own host
    req.origin = {
      custom: { domainName: API_HOST, port: 443, protocol: "https", path: "", sslProtocols: ["TLSv1.2"], readTimeout: 10, keepaliveTimeout: 5 },
    };
    req.headers["host"] = [{ key: "Host", value: API_HOST }];
    req.querystring = "host=" + encodeURIComponent(host) + "&path=" + encodeURIComponent(req.uri);
    req.uri = "/api/seo/page";
  }
  return req;
};
```

The API finds the studio from `host` (a platform subdomain or a verified custom
domain); a suspended or unknown site gets the plain `index.html`.

## Nginx on the VPS (custom domains)

```nginx
map $http_user_agent $is_bot {
  default 0;
  ~*(bot|crawler|spider|facebookexternalhit|whatsapp|twitterbot|slackbot|linkedinbot|telegrambot|discordbot|pinterest) 1;
}
location / {
  if ($is_bot) { rewrite ^(.*)$ /api/seo/page?host=$host&path=$1 break; proxy_pass http://127.0.0.1:5060; }
  try_files $uri /index.html;
}
```

Check it with `curl -A "facebookexternalhit/1.1" https://<studio>/services` and
the Facebook Sharing Debugger.
