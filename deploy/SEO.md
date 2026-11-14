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
