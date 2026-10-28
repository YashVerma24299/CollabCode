const request = require("supertest");
const { io: connect } = require("socket.io-client");
const { app, io, server } = require("./server");

jest.setTimeout(15000);

function waitForEvent(socket, event, predicate = () => true) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, 5000);

    function onEvent(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(payload);
    }

    socket.on(event, onEvent);
  });
}

function connectClient() {
  return new Promise((resolve, reject) => {
    const socket = connect(`http://localhost:${server.address().port}`, {
      forceNew: true,
      transports: ["websocket"]
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

beforeAll(() => new Promise(resolve => server.listen(0, resolve)));

afterAll(() => new Promise(resolve => {
  io.close();
  server.close(resolve);
}));

describe("backend REST API", () => {

  test("reports health and lists default groups", async () => {
    const health = await request(app).get("/api/health");
    const groups = await request(app).get("/api/groups");

    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true });
    expect(groups.status).toBe(200);
    expect(groups.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "team-A", memberCount: 0 })
      ])
    );
  });

  test("creates a group and returns its public state", async () => {
    const response = await request(app)
      .post("/api/groups")
      .send({
        name: "Testing Space",
        description: "A workspace for automated tests",
        username: "Test Owner"
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: "testing-space",
        name: "Testing Space",
        description: "A workspace for automated tests",
        createdBy: "Test Owner",
        memberCount: 0,
        taskCount: 0
      })
    );

    const groups = await request(app).get("/api/groups");
    expect(groups.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "testing-space" })
      ])
    );
  });

  test.each([
    [{}, "Group name is required"],
    [{ name: "   " }, "Group name is required"]
  ])("rejects an invalid group payload", async (payload, message) => {
    const response = await request(app).post("/api/groups").send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message });
  });

  test("validates execution requests before starting a process", async () => {
    const missingCode = await request(app)
      .post("/api/execute")
      .send({ language: "python" });
    const unsupportedLanguage = await request(app)
      .post("/api/execute")
      .send({ language: "ruby", code: "puts 1" });

    expect(missingCode.status).toBe(400);
    expect(missingCode.body).toEqual({
      message: "Language and code are required."
    });
    expect(unsupportedLanguage.status).toBe(400);
    expect(unsupportedLanguage.body).toEqual({
      message: "Unsupported language."
    });
  });
});

describe("Socket.IO collaboration workflows", () => {
  let firstClient;
  let secondClient;

  afterEach(() => {
    firstClient?.disconnect();
    secondClient?.disconnect();
    firstClient = undefined;
    secondClient = undefined;
  });

  test("joins, synchronizes, chats, creates tasks, and leaves a room", async () => {
    firstClient = await connectClient();
    secondClient = await connectClient();

    const firstState = waitForEvent(firstClient, "group:state");
    const firstPresence = waitForEvent(
      firstClient,
      "presence:update",
      state => state.groupId === "team-A" && state.members.length === 1
    );
    firstClient.emit("group:join", {
      groupId: "team-A",
      username: "Alice"
    });

    await expect(firstState).resolves.toEqual(
      expect.objectContaining({
        groupId: "team-A",
        messages: [],
        tasks: [],
        members: [expect.objectContaining({ name: "Alice" })]
      })
    );
    await expect(firstPresence).resolves.toEqual(
      expect.objectContaining({
        members: [expect.objectContaining({ name: "Alice" })]
      })
    );

    const secondState = waitForEvent(secondClient, "group:state");
    const secondPresence = waitForEvent(
      firstClient,
      "presence:update",
      state => state.members.length === 2
    );
    secondClient.emit("group:join", {
      groupId: "team-A",
      username: "Bob"
    });

    await expect(secondState).resolves.toEqual(
      expect.objectContaining({
        members: expect.arrayContaining([
          expect.objectContaining({ name: "Alice" }),
          expect.objectContaining({ name: "Bob" })
        ])
      })
    );
    await expect(secondPresence).resolves.toEqual(
      expect.objectContaining({ members: expect.any(Array) })
    );

    const editorState = waitForEvent(secondClient, "editor:state");
    secondClient.emit("editor:join", { groupId: "team-A" });
    await expect(editorState).resolves.toEqual(
      expect.objectContaining({
        groupId: "team-A",
        files: expect.objectContaining({ cpp: expect.any(String) }),
        language: "cpp"
      })
    );

    const editorUpdate = waitForEvent(
      secondClient,
      "editor:update",
      update => update.files.python === "print('synced')"
    );
    firstClient.emit("editor:update", {
      groupId: "team-A",
      username: "Alice",
      files: { cpp: "", java: "", python: "print('synced')" },
      language: "python"
    });
    await expect(editorUpdate).resolves.toEqual(
      expect.objectContaining({
        groupId: "team-A",
        language: "python"
      })
    );

    const chatMessage = waitForEvent(
      secondClient,
      "chat:message",
      message => message.message === "Hello team"
    );
    firstClient.emit("chat:send", {
      groupId: "team-A",
      username: "Alice",
      message: "  Hello team  "
    });
    await expect(chatMessage).resolves.toEqual(
      expect.objectContaining({
        groupId: "team-A",
        username: "Alice",
        message: "Hello team"
      })
    );

    const tasksUpdated = waitForEvent(
      secondClient,
      "tasks:updated",
      tasks => tasks.some(task => task.title === "Review editor")
    );
    firstClient.emit("task:create", {
      groupId: "team-A",
      username: "Alice",
      title: " Review editor "
    });
    await expect(tasksUpdated).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Review editor",
          createdBy: "Alice",
          status: "todo"
        })
      ])
    );

    const leftPresence = waitForEvent(
      firstClient,
      "presence:update",
      state => state.members.length === 1
    );
    secondClient.emit("group:leave", { groupId: "team-A" });
    await expect(leftPresence).resolves.toEqual(
      expect.objectContaining({
        members: [expect.objectContaining({ name: "Alice" })]
      })
    );
  });
});
