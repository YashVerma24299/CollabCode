const { validateEnv } = require('./config/env');
validateEnv();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const app = express();

const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use(express.json());

const groups = new Map();


// ============================================================
// HELPERS
// ============================================================

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}


// ============================================================
// GROUP
// ============================================================

function newGroup({
  id,
  name,
  description,
  createdBy = "system"
}) {
  return {
    id,
    name,
    description,
    createdBy,
    createdAt: Date.now(),

    members: new Map(),

    messages: [],

    tasks: [],

    // New collaborative editor files
    files: {
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from CollabCode!" << endl;
    return 0;
}`,

      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from CollabCode!");
    }
}`,

      python: `def main():
    print("Hello from CollabCode!")

if __name__ == "__main__":
    main()
`
    },
    webFiles: {
  html: `<main class="hero">
  <h1>Build together.</h1>
  <p>Welcome to CollabCode.</p>
</main>`,

  css: `.hero {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
  background: #080b12;
  color: white;
  font-family: Arial, sans-serif;
}`,

  javascript: `console.log("CollabCode Live Preview");`
},

    // Default selected language
    language: "cpp"
  };
}


// ============================================================
// DEFAULT GROUPS
// ============================================================

groups.set(
  "team-A",
  newGroup({
    id: "team-A",
    name: "Team A",
    description: "Team A collaborative workspace"
  })
);

groups.set(
  "team-B",
  newGroup({
    id: "team-B",
    name: "Team-B",
    description: "Team B collaborative workspace"
  })
);


// ============================================================
// PUBLIC GROUPS
// ============================================================

function publicGroups() {
  return [...groups.values()].map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    createdBy: g.createdBy,
    createdAt: g.createdAt,
    memberCount: g.members.size,
    taskCount: g.tasks.length
  }));
}

function emitGroups() {
  io.emit("groups:updated", publicGroups());
}


// ============================================================
// BASIC API
// ============================================================

app.get(
  "/api/health",
  (_, res) => {
    res.json({
      ok: true
    });
  }
);

app.get(
  "/api/groups",
  (_, res) => {
    res.json(publicGroups());
  }
);


// ============================================================
// CREATE GROUP
// ============================================================

app.post(
  "/api/groups",
  (req, res) => {
    const {
      name,
      description = "",
      username = "Anonymous"
    } = req.body || {};

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Group name is required"
      });
    }

    let id = slugify(name);

    if (!id) {
      id = `group-${Date.now()}`;
    }

    while (groups.has(id)) {
      id = `${slugify(name)}-${Math.floor(
        Math.random() * 9999
      )}`;
    }

    const group = newGroup({
      id,
      name: name.trim(),
      description: description.trim(),
      createdBy: username.trim()
    });

    groups.set(id, group);

    emitGroups();

    res.status(201).json({
      id,
      name: group.name,
      description: group.description,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      memberCount: 0,
      taskCount: 0
    });
  }
);


// ============================================================
// SOCKET.IO
// ============================================================

io.on(
  "connection",
  socket => {

    // ========================================================
    // GROUP JOIN
    // ========================================================

    socket.on(
      "group:join",
      ({ groupId, username }) => {

        const g = groups.get(groupId);

        if (!g) return;

        for (const room of socket.rooms) {
          if (room.startsWith("group:")) {
            socket.leave(room);
          }
        }

        socket.join(`group:${groupId}`);

        g.members.set(
          socket.id,
          username || "Anonymous"
        );

        socket.data.groupId = groupId;

        socket.data.username =
          username || "Anonymous";

        socket.emit(
          "group:state",
          {
            groupId,
            messages: g.messages,
            tasks: g.tasks,

            members: [
              ...g.members.entries()
            ].map(
              ([id, name]) => ({
                id,
                name
              })
            )
          }
        );

        io.to(`group:${groupId}`).emit(
          "presence:update",
          {
            groupId,

            members: [
              ...g.members.entries()
            ].map(
              ([id, name]) => ({
                id,
                name
              })
            )
          }
        );

        emitGroups();
      }
    );


    // ========================================================
    // GROUP LEAVE
    // ========================================================

    socket.on(
      "group:leave",
      ({ groupId }) => {

        const g = groups.get(groupId);

        if (!g) return;

        g.members.delete(socket.id);

        socket.leave(
          `group:${groupId}`
        );

        io.to(
          `group:${groupId}`
        ).emit(
          "presence:update",
          {
            groupId,

            members: [
              ...g.members.entries()
            ].map(
              ([id, name]) => ({
                id,
                name
              })
            )
          }
        );

        emitGroups();
      }
    );


    // ========================================================
    // EDITOR JOIN
    // ========================================================

    socket.on(
      "editor:join",
      ({ groupId }) => {

        const g = groups.get(groupId);

        if (!g) return;

        socket.join(
          `group:${groupId}`
        );

        socket.emit(
          "editor:state",
          {
            groupId,
            files: g.files,
            language: g.language
          }
        );
      }
    );


    // ========================================================
    // EDITOR UPDATE
    // ========================================================

    socket.on(
      "editor:update",
      ({
        groupId,
        username,
        files,
        language
      }) => {

        const g = groups.get(groupId);

        if (!g || !files) return;


        // Store all three language files
        g.files = {
          cpp: String(
            files.cpp ?? ""
          ),

          java: String(
            files.java ?? ""
          ),

          python: String(
            files.python ?? ""
          )
        };


        // Store currently selected language
        if (
          language &&
          [
            "cpp",
            "java",
            "python"
          ].includes(language)
        ) {
          g.language = language;
        }


        // Send update to everyone else
        socket
          .to(`group:${groupId}`)
          .emit(
            "editor:update",
            {
              groupId,
              username,
              files: g.files,
              language: g.language
            }
          );
      }
    );


    // ========================================================
    // LANGUAGE CHANGE
    // ========================================================

    socket.on(
      "editor:language",
      ({
        groupId,
        username,
        language
      }) => {

        const g = groups.get(groupId);

        if (!g) return;


        if (
          ![
            "cpp",
            "java",
            "python"
          ].includes(language)
        ) {
          return;
        }


        // Save selected language
        g.language = language;


        // Synchronize language with other users
        socket
          .to(`group:${groupId}`)
          .emit(
            "editor:language",
            {
              groupId,
              username,
              language
            }
          );
      }
    );


    // ========================================================
    // CHAT
    // ========================================================

    socket.on(
      "chat:send",
      ({
        groupId,
        username,
        message
      }) => {

        const g = groups.get(groupId);

        if (
          !g ||
          !message?.trim()
        ) {
          return;
        }

        const item = {
          id: `m-${Date.now()}-${Math.random()}`,

          groupId,

          username:
            username ||
            "Anonymous",

          message:
            message.trim(),

          createdAt: Date.now()
        };

        g.messages.push(item);

        if (
          g.messages.length > 200
        ) {
          g.messages.shift();
        }

        io.to(
          `group:${groupId}`
        ).emit(
          "chat:message",
          item
        );
      }
    );


    // ========================================================
    // TASK CREATE
    // ========================================================

    socket.on(
      "task:create",
      ({
        groupId,
        title,
        username
      }) => {

        const g = groups.get(groupId);

        if (
          !g ||
          !title?.trim()
        ) {
          return;
        }

        const task = {
          id: `t-${Date.now()}`,

          title:
            title.trim(),

          status: "todo",

          createdBy:
            username ||
            "Anonymous",

          createdAt:
            Date.now()
        };

        g.tasks.push(task);

        io.to(
          `group:${groupId}`
        ).emit(
          "tasks:updated",
          g.tasks
        );

        emitGroups();
      }
    );


    // ========================================================
    // DISCONNECT
    // ========================================================

    socket.on(
      "disconnect",
      () => {

        const groupId =
          socket.data.groupId;

        const g =
          groups.get(groupId);

        if (!g) return;

        g.members.delete(
          socket.id
        );

        io.to(
          `group:${groupId}`
        ).emit(
          "presence:update",
          {
            groupId,

            members: [
              ...g.members.entries()
            ].map(
              ([id, name]) => ({
                id,
                name
              })
            )
          }
        );

        emitGroups();
      }
    );

    socket.on("web:join", ({ groupId }) => {
  const g = groups.get(groupId);

  if (!g) return;

  socket.join(`group:${groupId}`);

  socket.emit("web:state", {
    groupId,
    files: {
      html: String(
        g.webFiles?.html ?? ""
      ),

      css: String(
        g.webFiles?.css ?? ""
      ),

      javascript: String(
        g.webFiles?.javascript ?? ""
      )
    }
  });
});


socket.on(
  "web:update",
  ({
    groupId,
    username,
    file,
    content
  }) => {

    const g = groups.get(groupId);

    if (!g) return;

    if (
      ![
        "html",
        "css",
        "javascript"
      ].includes(file)
    ) {
      return;
    }

    if (typeof content !== "string") {
      return;
    }


    if (!g.webFiles) {
      g.webFiles = {
        html: "",
        css: "",
        javascript: ""
      };
    }


    g.webFiles[file] = content;


    socket
      .to(`group:${groupId}`)
      .emit("web:update", {
        groupId,
        username,
        file,
        content
      });
  }
);

  }
);


// ============================================================
// CODE EXECUTION
// ============================================================

app.post(
  "/api/execute",
  async (req, res) => {

    const {
      language,
      code
    } = req.body;


    if (
      !language ||
      typeof code !== "string"
    ) {
      return res.status(400).json({
        message:
          "Language and code are required."
      });
    }


    const supported = [
      "cpp",
      "java",
      "python"
    ];


    if (
      !supported.includes(language)
    ) {
      return res.status(400).json({
        message:
          "Unsupported language."
      });
    }


    const id =
      crypto
        .randomBytes(8)
        .toString("hex");


    const tempDir =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          `collabcode-${id}-`
        )
      );


    let sourceFile;
    let command;
    let args;


    try {

      // ======================================================
      // C++
      // ======================================================

      if (
        language === "cpp"
      ) {

        sourceFile =
          path.join(
            tempDir,
            "main.cpp"
          );


        fs.writeFileSync(
          sourceFile,
          code,
          "utf8"
        );


        const outputFile =
          path.join(
            tempDir,
            "main.exe"
          );


        command = "g++";


        args = [
          sourceFile,
          "-std=c++17",
          "-O2",
          "-o",
          outputFile
        ];


        execFile(
          command,
          args,
          {
            timeout: 10000
          },

          (
            compileError,
            stdout,
            stderr
          ) => {

            if (compileError) {

              cleanup();

              return res.json({
                stdout:
                  stdout || "",

                stderr:
                  stderr ||
                  compileError.message,

                exitCode:
                  compileError.code ??
                  1
              });
            }


            execFile(
              outputFile,
              [],
              {
                timeout: 5000
              },

              (
                runError,
                runStdout,
                runStderr
              ) => {

                cleanup();

                res.json({
                  stdout:
                    runStdout || "",

                  stderr:
                    runStderr || "",

                  exitCode:
                    runError?.code ??
                    0
                });
              }
            );

          }
        );

        return;
      }


      // ======================================================
      // JAVA
      // ======================================================

      if (
        language === "java"
      ) {

        sourceFile =
          path.join(
            tempDir,
            "Main.java"
          );


        fs.writeFileSync(
          sourceFile,
          code,
          "utf8"
        );


        execFile(
          "javac",
          [sourceFile],
          {
            timeout: 10000
          },

          (
            compileError,
            stdout,
            stderr
          ) => {

            if (compileError) {

              cleanup();

              return res.json({
                stdout:
                  stdout || "",

                stderr:
                  stderr ||
                  compileError.message,

                exitCode:
                  compileError.code ??
                  1
              });
            }


            execFile(
              "java",
              [
                "-cp",
                tempDir,
                "Main"
              ],
              {
                timeout: 5000
              },

              (
                runError,
                runStdout,
                runStderr
              ) => {

                cleanup();

                res.json({
                  stdout:
                    runStdout || "",

                  stderr:
                    runStderr || "",

                  exitCode:
                    runError?.code ??
                    0
                });
              }
            );

          }
        );

        return;
      }


      // ======================================================
      // PYTHON
      // ======================================================

      if (
        language === "python"
      ) {

        sourceFile =
          path.join(
            tempDir,
            "main.py"
          );


        fs.writeFileSync(
          sourceFile,
          code,
          "utf8"
        );


        execFile(
          process.platform === "win32"
            ? "python"
            : "python3",

          [sourceFile],

          {
            timeout: 5000
          },

          (
            runError,
            stdout,
            stderr
          ) => {

            cleanup();

            res.json({
              stdout:
                stdout || "",

              stderr:
                stderr ||
                (
                  runError
                    ? runError.message
                    : ""
                ),

              exitCode:
                runError?.code ??
                0
            });
          }
        );

        return;
      }


    } catch (error) {

      cleanup();

      return res.status(500).json({
        message:
          error.message ||
          "Execution failed."
      });
    }


    // ========================================================
    // CLEANUP
    // ========================================================

    function cleanup() {

      try {

        fs.rmSync(
          tempDir,
          {
            recursive: true,
            force: true
          }
        );

      } catch {}
    }

  }
);


// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 3000;

server.listen(
  PORT,
  "0.0.0.0",
  () =>
    console.log(
      `CollabCode backend running on port ${PORT}`
    )
);

