# Backend

## Development

Install dependencies and start the API server:

```bash
cd Backend
npm install
npm start
```

The server listens on port `3000` by default. Set `PORT` to use another port.

## Tests

Run the backend REST and Socket.IO integration tests with:

```bash
cd Backend
npm test
```

The suite starts the real Express and Socket.IO server on an ephemeral port. It uses isolated simulated Socket.IO clients and in-memory groups, so it does not connect to production services. Execution request validation is tested without starting a compiler or interpreter.
