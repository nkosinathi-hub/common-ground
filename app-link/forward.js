// Carries an invite's hash (and any query) from the app-link page to the website's root.
location.replace(
  location.pathname.replace(/app-link\/(index\.html)?$/, "") + location.search + location.hash,
)
