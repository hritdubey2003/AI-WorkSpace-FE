# AI Workspace — Frontend

React client for **AI Workspace**, a collaborative document editor with built-in AI assistance. It provides workspaces, a rich-text editor, real-time collaboration and AI tools for summarizing, improving and turning notes into tasks.

The backend lives in [`../AI-WorkSpace-BE`](../AI-WorkSpace-BE) and must be running for the app to work.

## Features

- **Authentication**: register and log in; the JWT is kept in `localStorage` and attached to every request
- **Dashboard**: create and switch between workspaces, manage members, browse and create documents, see documents shared with you
- **Rich-text editor** (Tiptap): headings, lists, task lists, underline, placeholders and a formatting toolbar
- **Real-time collaboration**: live updates, collaborator count and typing indicators over Socket.io
- **Auto-save**: changes are saved after a short pause in typing
- **Sharing**: share a whole workspace or a single document with other users
- **AI panel**: summarize a document, improve its writing, or generate action items

## Tech stack

| Concern     | Technology                         |
| ----------- | ---------------------------------- |
| Framework   | React 18 (Create React App)        |
| Routing     | React Router 6                     |
| Editor      | Tiptap 2                           |
| Styling     | Tailwind CSS (via `react-scripts`) |
| HTTP        | Axios                              |
| Real-time   | socket.io-client                   |

## Project structure

```
AI-WorkSpace-FE/
├── public/
│   └── index.html
├── tailwind.config.js         # Theme: primary colors, Inter font, shadows
└── src/
    ├── App.js                 # Providers and routes
    ├── index.js               # Entry point
    ├── index.css              # Tailwind directives and global styles
    ├── components/            # AIPanel, EditorToolbar, ShareModal, DocShareModal, Modal, Toast, ...
    ├── context/               # AuthContext, WorkspaceContext
    ├── hooks/                 # useAutoSave, useDocumentSocket
    ├── layouts/               # AppLayout (shell for signed-in pages)
    ├── pages/                 # Login, Register, Dashboard, DocumentEditor, NotFound
    ├── routes/                # ProtectedRoute, PublicRoute
    └── services/              # api.js (Axios client), socket.js (Socket.io client)
```

## Routes

| Path            | Page             | Access                              |
| --------------- | ---------------- | ----------------------------------- |
| `/`             | → `/dashboard`   | Redirect                            |
| `/login`        | Login            | Public only (signed-in users are redirected) |
| `/register`     | Register         | Public only                         |
| `/dashboard`    | Dashboard        | Signed in                           |
| `/document/:id` | Document editor  | Signed in                           |
| `*`             | Not found        | Anyone                              |

## Getting started

### Prerequisites

- Node.js 18+
- The backend running (default `http://localhost:5000`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
REACT_APP_BACKEND_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

| Variable                | Description                         | Default                     |
| ----------------------- | ----------------------------------- | --------------------------- |
| `REACT_APP_BACKEND_URL` | Base URL of the backend REST API    | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL`  | URL of the backend Socket.io server | `http://localhost:5000`     |

Create React App only exposes variables whose names start with `REACT_APP_`; any other name is silently ignored. Both values end up in the browser bundle, so never put secrets in them. Restart the dev server after changing `.env`. On Vercel, set them in the project's environment variables and redeploy, since they are fixed at build time.

Also make sure the backend's `CLIENT_URL` matches the frontend's origin (`http://localhost:3000` by default), or CORS will block requests.

### 3. Run the app

```bash
npm start
```

The app opens at `http://localhost:3000`.

## Scripts

| Script          | Description                                  |
| --------------- | -------------------------------------------- |
| `npm start`     | Start the development server                 |
| `npm run build` | Create a production build in `build/`        |

## How it talks to the backend

- **REST**: [`src/services/api.js`](src/services/api.js) exports `authAPI`, `workspaceAPI`, `documentAPI` and `aiAPI`. A request interceptor adds `Authorization: Bearer <token>`; a response interceptor returns `response.data` and, on a `401`, clears the token and redirects to `/login`.
- **Socket.io**: [`src/services/socket.js`](src/services/socket.js) creates a single shared socket authenticated with the JWT. [`useDocumentSocket`](src/hooks/useDocumentSocket.js) joins the document room, sends `document-change` and `user-typing`, and listens for `document-loaded`, `document-updated`, `collaborators-update` and `collaborator-typing`.

See the backend README for the full API and event reference.
