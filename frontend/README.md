# Cyber Memory Network frontend

React + Vite frontend for the Cyber Memory Network.

## Run locally

From this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Vite prints the local development URL after startup.

## Backend API

The shared Axios client is in `src/services/api.js`. It uses
`http://127.0.0.1:8007` by default. Override the URL by setting
`VITE_API_BASE_URL` in a frontend `.env` file when the backend runs at a
different address.

The frontend includes login and registration, dashboard, incident, alert, IOC,
security log, MITRE ATT&CK, response action, and Cyber Memory pages. The
backend must be running for API-backed data and actions to work.
