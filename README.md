# fly-eye

A tiny local viewer for the public node graph on [Flywheel](https://flywheel.paradigma.inc).
Browse public roots, drill into a graph, see what other people are doing.

This is a single-user, no-backend app. Your Flywheel API key is stored in
`localStorage` and sent directly from the browser to the Flywheel API (CORS is
configured for `http://localhost:5173`).

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. Paste an API key when prompted.

Get a key with the Flywheel CLI:

```sh
flywheel auth:login        # device-flow login (opens browser)
flywheel api-keys:create   # mint a key from the logged-in account
```

…or manage keys in the web app at https://flywheel.paradigma.inc/app?settings=user.
