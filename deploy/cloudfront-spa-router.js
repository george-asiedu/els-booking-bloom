// CloudFront Function (viewer request) for the production site.
// The app is a single-page app: any path that isn't a real file (no "." in
// the last segment) is served index.html, so /admin/users or a studio's
// /book load the app instead of S3's 404. Studio subdomains
// (els.zuristudios.com) hit the same bucket; the app reads the host itself.
function handler(event) {
  var request = event.request;
  var last = request.uri.split("/").pop();
  if (!last || last.indexOf(".") === -1) {
    request.uri = "/index.html";
  }
  return request;
}
