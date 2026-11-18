import { useCallback, useEffect, useMemo, useState,useRef } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Image as ImageIcon,
} from "lucide-react";
import {
  Lock,
  RefreshCw
} from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  ChevronDown,
  Code2,
  Eye,
  Globe2,
  LayoutDashboard,
  MessageCircle,
  Moon,
  Plus,
  Play,
  Radio,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Maximize2,
  Users,
  Wifi,
  X,
  Zap,
  Search,
Paperclip,
Smile,
} from "lucide-react";
import { API_URL, socket } from "./lib/socket";

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("cc-theme") || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cc-theme", theme);
  }, [theme]);
  return [theme, () => setTheme(v => v === "dark" ? "light" : "dark")];
}

function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      const r = await fetch(`${API_URL}/api/groups`);
      setGroups(await r.json());
    } catch { setGroups([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    reload();
    if (!socket.connected) socket.connect();
    const onUpdated = data => setGroups(data);
    socket.on("groups:updated", onUpdated);
    return () => socket.off("groups:updated", onUpdated);
  }, []);

  const createGroup = async payload => {
    const r = await fetch(`${API_URL}/api/groups`, {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Could not create workspace");
    await reload();
    return data;
  };
  return { groups, loading, createGroup, reload };
}

function App() {
  const [theme, toggleTheme] = useTheme();
  const groupsApi = useGroups();
  return <Routes>
    <Route path="/" element={<LandingPage {...groupsApi} theme={theme} toggleTheme={toggleTheme} />} />
    <Route path="/dashboard" element={<LandingPage {...groupsApi} theme={theme} toggleTheme={toggleTheme} />} />
    <Route path="/workspace/:groupId/enter" element={<EnterPage groups={groupsApi.groups} />} />
    <Route path="/workspace/:groupId/*" element={<WorkspaceRouter {...groupsApi} theme={theme} toggleTheme={toggleTheme} />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}



function LandingPage({groups, loading, createGroup, theme, toggleTheme}) {
  const nav = useNavigate();
  const [modal, setModal] = useState(null);
  const [cursor, setCursor] = useState({x:-100,y:-100});

  return <div className="landing" onMouseMove={e => setCursor({x:e.clientX,y:e.clientY})}>
    <div className="cursor-orb" style={{transform:`translate3d(${cursor.x}px,${cursor.y}px,0)`}} />
    <div className="ambient a1"/><div className="ambient a2"/>

    <header className="landing-header">
      <div className="header-brand-area">
        <button className="brand" onClick={() => nav("/")}>
          <span className="brand-mark">
            <Code2 size={20} />
          </span>

          <span className="brand-text">
            <strong>CollabCode</strong>
            <small>Realtime Development Space</small>
          </span>
        </button>
      </div>

      <div className="header-actions">
        <div className="header-status">
          <span className="status-dot" />
          <span className="realtime">Realtime</span>
        </div>

        <button className="icon-button" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          className="header-cta"
          onClick={() => setModal("access")}
        >
          Open workspace
          <ArrowRight size={15} />
        </button>
      </div>
    </header>

    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">
          <Sparkles size={13}/> COLLABORATIVE DEVELOPMENT
        </span>

        <h1>
          Write code.<br/>
          <span>Build together.</span>
        </h1>

        <p>
          One realtime workspace for shared coding, live preview,
          team communication and workspace activity.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={()=>setModal("access")}>
            Enter a workspace <ArrowRight size={16}/>
          </button>

          <button className="secondary-button" onClick={()=>setModal("create")}>
            <Plus size={16}/> Create group
          </button>
        </div>
      </div>

      <div className="hero-stage">
        <div className="orbit oa"/>
        <div className="orbit ob"/>

        <div className="platform">
          <div className="platform-bar">
            <span className="dots">● ● ●</span>
            <span>frontend-team / workspace</span>
            <b>● LIVE</b>
          </div>

          <div className="platform-body">
            <div className="platform-side">
              <Code2/>
              <Code2/>
              <Eye/>
              <MessageCircle/>
              <BarChart3/>
            </div>

            <div className="fake-code">
              <div className="fake-tabs">
                <span className="active">C++</span>
                <span>Java</span>
                <span>Python</span>
              </div>

              <pre>{`#include <iostream>
using namespace std;

int main() {
    cout << "Build together.";
    return 0;
}`}</pre>

              <div className="fake-presence">
                <i>Y</i>
                <i>A</i>
                <i>R</i>
                <span>3 collaborators editing</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D floating feature cards */}
        <div className="feature-3d-card feature-editor">
          <div className="feature-card-icon">
            <Code2 size={21}/>
          </div>
          <div>
            <strong>Text Editor</strong>
            <span>Realtime coding</span>
          </div>
          <div className="feature-card-glow"/>
        </div>

        <div className="feature-3d-card feature-preview">
          <div className="feature-card-icon">
            <Eye size={21}/>
          </div>
          <div>
            <strong>Live Preview</strong>
            <span>See changes instantly</span>
          </div>
        </div>

        <div className="feature-3d-card feature-chat">
          <div className="feature-card-icon">
            <MessageCircle size={21}/>
          </div>
          <div>
            <strong>Group Chat</strong>
            <span>3 members</span>
          </div>

          <div className="mini-users">
            <i>Y</i>
            <i>A</i>
            <i>R</i>
          </div>
        </div>

        <div className="feature-3d-card feature-dashboard">
          <div className="feature-card-icon">
            <BarChart3 size={21}/>
          </div>
          <div>
            <strong>Dashboard</strong>
            <span>Workspace</span>
          </div>

          <div className="mini-chart">
            <span/>
            <span/>
            <span/>
            <span/>
            <span/>
          </div>
        </div>

        {/* Floating 3D decorative elements */}
        <div className="floating-cube cube-one">
          <Code2 size={18}/>
        </div>

        <div className="floating-cube cube-two">
          <Users size={17}/>
        </div>

        <div className="floating-dot dot-one"/>
        <div className="floating-dot dot-two"/>
        <div className="floating-dot dot-three"/>
      </div>
    </section>

    {/* Enhanced floating feature showcase */}
    <section className="feature-strip" id="features">

      <div className="feature-showcase-card editor-showcase">
        <div className="showcase-top">
          <div className="showcase-icon">
            <Code2 size={22}/>
          </div>

          <span className="showcase-number">01</span>
        </div>

        <div className="showcase-content">
          <h3>Text Editor</h3>
          <p>Write and edit code together in realtime.</p>
        </div>

        <div className="showcase-visual editor-visual">
          <span>const</span>
          <span>team</span>
          <span>=</span>
          <span>"CollabCode"</span>
          <i/>
          <i/>
          
        </div>
      </div>

      <div className="feature-showcase-card preview-showcase">
        <div className="showcase-top">
          <div className="showcase-icon">
            <Eye size={22}/>
          </div>

          <span className="showcase-number">02</span>
        </div>

        <div className="showcase-content">
          <h3>Live Preview</h3>
          <p>See your latest changes appear instantly.</p>
        </div>

        <div className="showcase-visual preview-visual">
          <div className="preview-window">
            <div className="preview-window-bar">
              <i/>
              <i/>
              <i/>
            </div>

            <div className="preview-window-body">
              <span/>
              <span/>
              <span/>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-showcase-card chat-showcase">
        <div className="showcase-top">
          <div className="showcase-icon">
            <MessageCircle size={22}/>
          </div>

          <span className="showcase-number">03</span>
        </div>

        <div className="showcase-content">
          <h3>Group Chat</h3>
          <p>Discuss ideas while your team builds together.</p>
        </div>

        <div className="showcase-visual chat-visual">
          <div className="chat-bubble left">Let's ship it!</div>
          <div className="chat-bubble right">Looks good 🚀</div>
        </div>
      </div>

      <div className="feature-showcase-card dashboard-showcase">
        <div className="showcase-top">
          <div className="showcase-icon">
            <LayoutDashboard size={22}/>
          </div>

          <span className="showcase-number">04</span>
        </div>

        <div className="showcase-content">
          <h3>Dashboard</h3>
          <p>Keep track of members, tasks and activity.</p>
        </div>

        <div className="showcase-visual dashboard-visual">
          <div className="dashboard-bars">
            <span/>
            <span/>
            <span/>
            <span/>
            <span/>
          </div>

          <div className="dashboard-line"/>
        </div>
      </div>

    </section>

    <section className="workspace-section" id="workspaces">
      <div className="section-heading">
        <span className="eyebrow">
          <Radio size={13}/> CHOOSE YOUR SPACE
        </span>

        <h2>Start with a workspace.</h2>

        <p>
          Pick a team to enter. Once inside, the selected group is carried
          through the editor, preview, chat and dashboard.
        </p>
      </div>

      <div className="workspace-grid">
        {loading ? (
          <div className="empty-workspaces">
            Loading workspaces...
          </div>
        ) : groups.length ? (
          groups.map(g => (
            <button
              className="workspace-card"
              key={g.id}
              onClick={()=>nav(`/workspace/${g.id}/enter`)}
            >
              <div className="workspace-card-icon">
                <Users size={20}/>
              </div>

              <div className="workspace-card-copy">
                <div className="workspace-card-top">
                  <span><i/> Available</span>
                  <ChevronRight size={17}/>
                </div>

                <h3>{g.name}</h3>

                <p>
                  {g.description || "Collaborative development workspace"}
                </p>

                <small>
                  <Users size={12}/>
                  {g.memberCount||0} members
                  &nbsp;
                  <Check size={12}/>
                  {g.taskCount||0} tasks
                </small>
              </div>
            </button>
          ))
        ) : (
          <div className="empty-workspaces">
            <div className="empty-icon">
              <Globe2/>
            </div>

            <h3>No workspaces yet</h3>
            <p>Create your first group.</p>
          </div>
        )}

        <button
          className="create-card"
          onClick={()=>setModal("create")}
        >
          <Plus/>

          <div>
            <b>Create a new workspace</b>
            <small>Start a fresh collaborative room</small>
          </div>

          <ArrowRight size={16}/>
        </button>
      </div>
    </section>

    <section className="closing" id="how">
      <div className="closing-glow glow-one" />
      <div className="closing-glow glow-two" />

      <div className="closing-grid" />

      <div className="closing-floating closing-code">
        <Code2 size={18} />
        <span>Code</span>
      </div>

      <div className="closing-floating closing-chat">
        <MessageCircle size={17} />
        <span>Communicate</span>
      </div>

      <div className="closing-floating closing-preview">
        <Eye size={17} />
        <span>Preview</span>
      </div>

      <div className="closing-content">
        <div className="closing-icon">
          <Zap size={22} />
        </div>

        <span className="closing-eyebrow">
          <span className="closing-dot" />
          BUILT FOR COLLABORATION
        </span>

        <h2>
          One workspace.
          <br />
          <span>One shared context.</span>
        </h2>

        <p>
          Code, preview and communicate with your team
          <br />
          without switching between tools.
        </p>

        <button
          className="closing-button"
          onClick={() => setModal("access")}
        >
          <span>Get started</span>
          <ArrowRight size={17} />
        </button>

        <div className="closing-meta">
          <span><Code2 size={13} /> Shared coding</span>
          <span><Eye size={13} /> Live preview</span>
          <span><Users size={13} /> Team collaboration</span>
        </div>
      </div>
    </section>

    <footer>
      <span>© 2026 CollabCode</span>
      <a
        className="footer-github"
        href="https://github.com/YashVerma24299/CollabCode"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View CollabCode on GitHub (opens in a new tab)"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
        GitHub
      </a>
      <span>Realtime collaboration</span>
    </footer>

    {modal==="access" && (
      <AccessModal
        groups={groups}
        close={()=>setModal(null)}
        create={()=>setModal("create")}
      />
    )}

    {modal==="create" && (
      <CreateModal
        createGroup={createGroup}
        close={()=>setModal(null)}
      />
    )}
  </div>;
}

function GitBranchIcon(){return <span style={{fontSize:12}}>⌘</span>}
function Floating({icon,title,text,cls}){return <div className={`floating ${cls}`}>{icon}<div><b>{title}</b><small>{text}</small></div><i/></div>}
function Feature({icon,title,text}){return <div className="feature"><span>{icon}</span><b>{title}</b><p>{text}</p></div>}

function AccessModal({groups,close,create}) {
  const nav=useNavigate();
  return <Modal close={close}><div className="modal-head"><span className="modal-icon"><Users/></span><div><small>WORKSPACE ACCESS</small><h2>Choose your workspace</h2></div><button onClick={close}><X/></button></div>
    <p className="modal-desc">Enter a group to access its editor, live preview, chat and dashboard.</p>
    <div className="modal-list">{groups.map(g=><button key={g.id} onClick={()=>nav(`/workspace/${g.id}/enter`)}><span><Users/></span><div><b>{g.name}</b><small>{g.memberCount||0} members · {g.taskCount||0} tasks</small></div><ChevronRight/></button>)}</div>
    <button className="modal-create" onClick={create}><Plus size={14}/> Create a new WorkSpace</button>
  </Modal>
}

function CreateModal({createGroup,close}) {
  const nav = useNavigate();

  const [name,setName] = useState("");
  const [description,setDescription] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();

    if(!name.trim()){
      setError("Workspace name is required.");
      return;
    }

    setBusy(true);

    try {
      const g = await createGroup({
        name: name.trim(),
        description: description.trim()
      });

      close();

      /*
       * Display name is intentionally NOT collected here.
       * The user will enter it once on the workspace entry screen.
       */
      nav(`/workspace/${g.id}/enter`);

    } catch(err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal close={close} dataCreate>

      <div className="modal-head">

        <span className="modal-icon">
          <Plus/>
        </span>

        <div>
          <small>NEW WORKSPACE</small>
          <h2>Create your workspace</h2>
        </div>

        <button onClick={close}>
          <X/>
        </button>

      </div>

      <p className="modal-desc">
        Set up a shared space for your team. You can choose your display name
        when you enter the workspace.
      </p>

      <form className="form" onSubmit={submit}>

        <label>
          Workspace name

          <input
            value={name}
            onChange={e => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Frontend Engineering"
            autoFocus
          />
        </label>

        <label>
          Description

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will your team build?"
            rows="4"
          />
        </label>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button
          className="primary-button full"
          disabled={busy}
        >
          {busy ? "Creating workspace..." : "Create workspace"}
          <ArrowRight size={16}/>
        </button>

      </form>

    </Modal>
  );
}
function Modal({children,close}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><div className="modal">{children}</div></div>}


function EnterPage({groups}) {
  const {groupId} = useParams();
  const nav = useNavigate();

  const group = groups.find(g => g.id === groupId);

  /*
   * IMPORTANT:
   * Do NOT initialize this from localStorage.
   * Every time the user opens this page, the field starts empty.
   */
  const [name,setName] = useState("");
  const [error,setError] = useState("");

  if(!group){
    return <Navigate to="/" replace/>;
  }

  const submit = e => {
    e.preventDefault();

    const username = name.trim();

    if(!username){
      setError("Please enter your display name.");
      return;
    }

    /*
     * Save the name only after the user explicitly submits it.
     * Other workspace pages can still use this value.
     */
    localStorage.setItem("cc-username", username);
    localStorage.setItem(`cc-user-${group.id}`, username);

    nav(`/workspace/${group.id}/dashboard`);
  };

  return (
    <div className="entry-page">

      <div className="entry-background-glow entry-glow-one"/>
      <div className="entry-background-glow entry-glow-two"/>

      <button
        className="entry-back"
        onClick={() => nav("/")}
      >
        <ArrowLeft size={16}/>
        <span>Back to workspaces</span>
      </button>


      <div className="entry-card">

        {/* Top identity */}
        <div className="entry-top">

          <div className="entry-logo">
            <Users size={24}/>
          </div>

          <div className="entry-status">
            <span className="entry-status-dot"/>
            Workspace available
          </div>

        </div>


        {/* Workspace information */}
        <div className="entry-content">

          <span className="entry-eyebrow">
            JOIN WORKSPACE
          </span>

          <h1>{group.name}</h1>

          <p className="entry-description">
            {group.description ||
              "A collaborative development space for your team."}
          </p>

        </div>


        {/* Divider */}
        <div className="entry-divider"/>


        {/* Identity section */}
        <form
          className="entry-form"
          onSubmit={submit}
        >

          <div className="entry-form-heading">

            <div>
              <h3>How should your team see you?</h3>

              <p>
                Choose the name that will appear in the workspace,
                chat and activity feed.
              </p>
            </div>

          </div>


          <label className="entry-input-group">

            <span>Display name</span>

            <div className="entry-input-wrapper">

              <Users size={17}/>

              <input
                autoFocus
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Enter your name"
                maxLength={40}
              />

            </div>

          </label>


          {error && (
            <div className="entry-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="primary-button full entry-submit"
          >
            <span>Enter workspace</span>
            <ArrowRight size={17}/>
          </button>


          <div className="entry-note">
            <span className="entry-note-dot"/>
            Your name will be visible to workspace members.
          </div>

        </form>

      </div>

    </div>
  );
}
function WorkspaceRouter({
  groups,
  loading,
  theme,
  toggleTheme
}) {
  const { groupId } = useParams();

  const group = groups.find(
    g => g.id === groupId
  );

  const user = localStorage.getItem(
    `cc-user-${groupId}`
  );

  // IMPORTANT:
  // Wait for groups API before deciding
  // that the workspace does not exist.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--bg)",
          color: "var(--text)"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "var(--muted)"
          }}
        >
          <span className="status-dot" />
          Loading workspace...
        </div>
      </div>
    );
  }

  // Only redirect after the API has finished loading.
  if (!group) {
    return <Navigate to="/" replace />;
  }

  // User has not entered this workspace yet.
  if (!user) {
    return (
      <Navigate
        to={`/workspace/${groupId}/enter`}
        replace
      />
    );
  }

  return (
    <WorkspaceShell
      group={group}
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      <Routes>
        <Route
          path="dashboard"
          element={<Dashboard group={group} />}
        />

        <Route
          path="editor"
          element={
            <EditorPage
              group={group}
              user={user}
            />
          }
        />

        <Route
          path="preview"
          element={
            <PreviewPage
              group={group}
              user={user}
            />
          }
        />

        <Route
          path="chat"
          element={
            <ChatPage
              group={group}
              user={user}
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />
      </Routes>
    </WorkspaceShell>
  );
}

// function WorkspaceShell({group,user,theme,toggleTheme,children}) {
//   const nav=useNavigate(); const loc=useLocation();
//   const items=[["editor","Text Editor",Code2],["preview","Live Preview",Eye],["chat","Group Chat",MessageCircle],["dashboard","Dashboard",LayoutDashboard]];
//   const leave=()=>{localStorage.removeItem(`cc-user-${group.id}`);nav("/")};
//   return <div className="app-shell"><header className="workspace-header"><button className="brand" onClick={()=>nav("/")}><span className="brand-mark"><Code2 size={18}/></span><span><strong>CollabCode</strong><small>realtime workspace</small></span></button><div className="breadcrumb">Workspace <ChevronRight/> <b>{group.name}</b><span className="live-label"><i/> Live</span></div><div className="header-actions"><span className="connection-pill"><i/> Connected</span><button className="icon-button" onClick={toggleTheme}>{theme==="dark"?<Sun/>:<Moon/>}</button><span className="user-chip"><span className="avatar">{user[0].toUpperCase()}</span>{user}</span></div></header>
//     <aside className="sidebar"><div className="side-workspace"><span className="workspace-avatar"><Code2/></span><div><small>ACTIVE WORKSPACE</small><b>{group.name}</b></div></div><small className="side-label">WORKSPACE</small><nav>{items.map(([path,label,Icon])=>{const active=loc.pathname.endsWith("/"+path);return <button className={active?"active":""} key={path} onClick={()=>nav(`/workspace/${group.id}/${path}`)}><Icon/><span>{label}</span>{active&&<i/>}</button>})}</nav><div className="side-divider"/><small className="side-label">TEAM</small><div className="team-user"><span className="avatar">{user[0].toUpperCase()}</span><div><b>{user}</b><small>Online</small></div><i/></div><div className="side-bottom"><button><Settings2/><span>Workspace settings</span></button><button className="leave" onClick={leave}><ArrowLeft/><span>Leave workspace</span></button></div></aside>
//     <main className="workspace-main">{children}</main>
//   </div>
// }
function WorkspaceShell({group,user,theme,toggleTheme,children}) {
  const nav = useNavigate();
  const loc = useLocation();

  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
  if (!socket.connected) {
    socket.connect();
  }

  const updateMembers = data => {
    if (data.groupId !== group.id) return;

    setOnlineUsers(data.members || []);
  };

  socket.on("group:state", updateMembers);
  socket.on("presence:update", updateMembers);

  socket.emit("group:join", {
    groupId: group.id,
    username: user
  });

  return () => {
    socket.off("group:state", updateMembers);
    socket.off("presence:update", updateMembers);

    socket.emit("group:leave", {
      groupId: group.id,
      username: user
    });
  };
}, [group.id, user]);

  const items = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["editor", "Text Editor", Code2],
    ["preview", "Live Preview", Eye],
    ["chat", "Group Chat", MessageCircle]
  ];

  const leave = () => {
    localStorage.removeItem(`cc-user-${group.id}`);
    nav("/");
  };

  const currentOnlineCount =
    onlineUsers.length || group.memberCount || 1;

  return (
    <div className="app-shell">

      <header className="workspace-header">

        <button
          className="brand"
          onClick={() => nav("/")}
        >
          <span className="brand-mark">
            <Code2 size={18}/>
          </span>

          <span>
            <strong>CollabCode</strong>
            <small>realtime workspace</small>
          </span>
        </button>

        <div className="header-actions">

          <span className="connection-pill">
            <i/>
            Connected
          </span>

          <button
            className="icon-button"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun/> : <Moon/>}
          </button>

          <span className="user-chip">
            <span className="avatar">
              {user[0].toUpperCase()}
            </span>

            {user}
          </span>

        </div>

      </header>


      <aside className="sidebar">

        {/* Workspace */}

        <div className="side-workspace">

          <span className="workspace-avatar">
            <Code2/>
          </span>

          <div>
            <small>ACTIVE WORKSPACE</small>
            <b>{group.name}</b>
          </div>

        </div>


        {/* Navigation */}

        <small className="side-label">
          WORKSPACE
        </small>

        <nav>

          {items.map(([path,label,Icon]) => {

            const active =
              loc.pathname.endsWith("/" + path);

            return (
              <button
                className={active ? "active" : ""}
                key={path}
                onClick={() =>
                  nav(`/workspace/${group.id}/${path}`)
                }
              >
                <Icon/>

                <span>
                  {label}
                </span>

                {active && <i/>}
              </button>
            );

          })}

        </nav>

        {/* Bottom */}

        <div className="side-bottom">

          <button
            className="leave"
            onClick={leave}
          >
            <ArrowLeft/>

            <span>
              Leave workspace
            </span>
          </button>

        </div>

      </aside>


      <main className="workspace-main">
        {children}
      </main>

    </div>
  );
}
function PageHeader({eyebrow,title,description}){return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><span className="page-live"><i/> realtime</span></div>}

// function Dashboard({group}) {
//   return <div className="workspace-page"><PageHeader eyebrow="WORKSPACE OVERVIEW" title={group.name} description="Your shared development space at a glance."/><div className="stats"><Stat icon={<Users/>} label="Members online" value={group.memberCount||0} text="Realtime presence"/><Stat icon={<Check/>} label="Open tasks" value={group.taskCount||0} text="Shared team work"/><Stat icon={<MessageCircle/>} label="Team chat" value="LIVE" text="Socket room"/><Stat icon={<Radio/>} label="Editor sync" value="LIVE" text="Shared content"/></div><div className="dash-grid"><div className="dash-card"><div className="card-head"><div><small>ACTIVITY</small><h3>Workspace activity</h3></div></div><Activity title="Workspace connected" text="Realtime collaboration is ready."/><Activity title="Editor available" text="Open Text Editor to start coding."/><Activity title="Live preview ready" text="Preview follows the shared files."/></div><div className="dash-card"><div className="card-head"><div><small>QUICK START</small><h3>Open a tool</h3></div></div><Quick to={`/workspace/${group.id}/editor`} icon={<Code2/>} title="Text Editor" text="Collaborative coding"/><Quick to={`/workspace/${group.id}/preview`} icon={<Eye/>} title="Live Preview" text="Run the shared page"/><Quick to={`/workspace/${group.id}/chat`} icon={<MessageCircle/>} title="Group Chat" text="Talk to the team"/></div></div></div>
// }
function Dashboard({group}) {

  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentUser =
    localStorage.getItem(`cc-user-${group.id}`) ||
    localStorage.getItem("cc-username") ||
    "Guest";


  useEffect(() => {
  if (!socket.connected) {
    socket.connect();
  }

  const updateMembers = data => {
    if (data.groupId !== group.id) return;

    setOnlineUsers(data.members || []);
  };

  socket.on("group:state", updateMembers);
  socket.on("presence:update", updateMembers);

  socket.emit("group:join", {
    groupId: group.id,
    username: currentUser
  });

  return () => {
    socket.off("group:state", updateMembers);
    socket.off("presence:update", updateMembers);

    socket.emit("group:leave", {
      groupId: group.id,
      username: currentUser
    });
  };
}, [group.id, currentUser]);


  const onlineCount =
    onlineUsers.length || group.memberCount || 1;


  return (

    <div className="workspace-page">


      {/* Dashboard heading */}

      <div className="dashboard-welcome">

        <div>

          <span className="dashboard-welcome-label">
            WORKSPACE OVERVIEW
          </span>

          <h2>
            {group.name}
          </h2>

          <p>
            Your shared development space at a glance.
          </p>

        </div>


        <div className="dashboard-welcome-user">

          <span className="avatar">
            {currentUser[0].toUpperCase()}
          </span>

          <div>

            <strong>
              {currentUser}
            </strong>

            <span>
              ● Online
            </span>

          </div>

        </div>

      </div>


      {/* Statistics */}

      <div className="stats">

        <Stat
          icon={<Users/>}
          label="Members online"
          value={onlineCount}
          text="Realtime presence"
        />

        <Stat
          icon={<Check/>}
          label="Open tasks"
          value={group.taskCount || 0}
          text="Shared team work"
        />

        <Stat
          icon={<MessageCircle/>}
          label="Team chat"
          value="LIVE"
          text="Realtime communication"
        />

        <Stat
          icon={<Radio/>}
          label="Editor sync"
          value="LIVE"
          text="Shared content"
        />

      </div>


      {/* Main dashboard */}

      <div className="dash-grid">


        {/* Activity */}

        <div className="dash-card">

          <div className="card-head">

            <div>

              <small>
                ACTIVITY
              </small>

              <h3>
                Workspace activity
              </h3>

            </div>

          </div>


          <Activity
            title="Workspace connected"
            text="Realtime collaboration is ready."
          />

          <Activity
            title="Editor available"
            text="Open Text Editor to start coding."
          />

          <Activity
            title="Live preview ready"
            text="Preview follows the shared files."
          />

        </div>


        {/* Quick Start */}

        <div className="dash-card">

          <div className="card-head">

            <div>

              <small>
                QUICK START
              </small>

              <h3>
                Open a tool
              </h3>

            </div>

          </div>


          <Quick
            to={`/workspace/${group.id}/editor`}
            icon={<Code2/>}
            title="Text Editor"
            text="Collaborative coding"
          />

          <Quick
            to={`/workspace/${group.id}/preview`}
            icon={<Eye/>}
            title="Live Preview"
            text="See shared output"
          />

          <Quick
            to={`/workspace/${group.id}/chat`}
            icon={<MessageCircle/>}
            title="Group Chat"
            text="Talk to the team"
          />

        </div>

      </div>


      {/* Online members */}

      <div className="presence-card">

        <div className="presence-card-head">

          <h3>
            Team members
          </h3>

          <span>
            {onlineCount} online
          </span>

        </div>


        <div className="presence-users">

          {onlineUsers.length > 0 ? (

            onlineUsers.map((member, index) => {

              const name =
                typeof member === "string"
                  ? member
                  : member.username || member.name || "Guest";

              return (
                <div
                  className="presence-user"
                  key={`${name}-${index}`}
                >

                  <span className="avatar">
                    {name[0]?.toUpperCase() || "?"}
                  </span>

                  <span className="presence-user-name">
                    {name}
                  </span>

                  <span className="presence-user-dot"/>

                </div>
              );

            })

          ) : (

            <div className="presence-user">

              <span className="avatar">
                {currentUser[0].toUpperCase()}
              </span>

              <span className="presence-user-name">
                {currentUser}
              </span>

              <span className="presence-user-dot"/>

            </div>

          )}

        </div>

      </div>


    </div>

  );
}
function Stat({icon,label,value,text}){return <div className="stat"><span>{icon}</span><div><small>{label}</small><b>{value}</b><p>{text}</p></div></div>}
function Activity({title,text}){return <div className="activity"><i/><div><b>{title}</b><p>{text}</p></div><small>now</small></div>}
function Quick({to,icon,title,text}){const nav=useNavigate();return <button className="quick" onClick={()=>nav(to)}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><ArrowRight/></button>}

const DEFAULT_FILES = {
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
};


function useEditorFiles(groupId, username) {
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [language, setLanguage] = useState("cpp");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const handleConnect = () => {
      setConnected(true);

      // Join the workspace
      socket.emit("group:join", {
        groupId,
        username
      });

      // Join the editor
      socket.emit("editor:join", {
        groupId
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    // =========================================================
    // IMPORTANT:
    // Receive the complete editor state from backend
    // =========================================================
    const handleEditorState = ({
      files: serverFiles,
      language: serverLanguage
    }) => {
      if (serverFiles) {
        setFiles({
          cpp: serverFiles.cpp ?? "",
          java: serverFiles.java ?? "",
          python: serverFiles.python ?? ""
        });
      }

      if (
        serverLanguage &&
        ["cpp", "java", "python"].includes(serverLanguage)
      ) {
        setLanguage(serverLanguage);
      }
    };


    // =========================================================
    // Receive code changes from another user
    // =========================================================
    const handleEditorUpdate = ({
  files: serverFiles
}) => {
  if (!serverFiles) return;

  setFiles({
    cpp: serverFiles.cpp ?? "",
    java: serverFiles.java ?? "",
    python: serverFiles.python ?? ""
  });
};


    // =========================================================
    // Receive language change from another user
    // =========================================================
    // const handleLanguageChange = ({
    //   language: serverLanguage
    // }) => {
    //   if (
    //     !serverLanguage ||
    //     !["cpp", "java", "python"].includes(serverLanguage)
    //   ) {
    //     return;
    //   }

    //   setLanguage(serverLanguage);
    // };


    // Register listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on(
      "editor:state",
      handleEditorState
    );

    socket.on(
      "editor:update",
      handleEditorUpdate
    );

    // socket.on(
    //   "editor:language",
    //   handleLanguageChange
    // );


    // If socket is already connected
    if (socket.connected) {
      handleConnect();
    }


    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "editor:state",
        handleEditorState
      );

      socket.off(
        "editor:update",
        handleEditorUpdate
      );

      // socket.off(
      //   "editor:language",
      //   handleLanguageChange
      // );

      socket.emit("group:leave", {
        groupId
      });
    };
  }, [groupId, username]);


  // ===========================================================
  // LOCAL CODE CHANGE
  // ===========================================================

  const updateFile = useCallback(
    (value) => {
      const nextFiles = {
        ...files,
        [language]: value
      };

      // Update local Monaco immediately
      setFiles(nextFiles);

      // Send complete file state to backend
      socket.emit("editor:update", {
        groupId,
        username,
        files: nextFiles,
        
      });
    },
    [
      groupId,
      username,
      language,
      files
    ]
  );


  // ===========================================================
  // LOCAL LANGUAGE CHANGE
  // ===========================================================

  const changeLanguage = useCallback(
  (nextLanguage) => {
    if (
      !["cpp", "java", "python"].includes(
        nextLanguage
      )
    ) {
      return;
    }

    setLanguage(nextLanguage);
  },
  []
);


  return {
    files,
    language,
    connected,
    updateFile,
    changeLanguage
  };
}

function EditorPage({ group, user }) {
  const {
  files,
  updateFile,
  language,
  changeLanguage,
  connected
} = useEditorFiles(group.id, user);

  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState([
    {
      type: "system",
      text: "CollabCode terminal ready."
    },
    {
      type: "info",
      text: "Select a language and press Run."
    }
  ]);

  const [running, setRunning] = useState(false);

  const languageConfig = {
    cpp: {
      label: "C++",
      monaco: "cpp",
      file: "main.cpp"
    },

    java: {
      label: "Java",
      monaco: "java",
      file: "Main.java"
    },

    python: {
      label: "Python",
      monaco: "python",
      file: "main.py"
    }
  };

  const current = languageConfig[language];

  const runCode = async () => {
    if (running) return;

    setRunning(true);

    setTerminalOpen(true);

    setTerminalOutput([
      {
        type: "system",
        text: `Running ${current.label}...`
      }
    ]);

    try {
      const response = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          language,
          code: files[language] || "",
          groupId: group.id,
          username: user
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Execution failed."
        );
      }

      const output = [];

      if (result.stdout) {
        output.push({
          type: "output",
          text: result.stdout
        });
      }

      if (result.stderr) {
        output.push({
          type: "error",
          text: result.stderr
        });
      }

      if (!result.stdout && !result.stderr) {
        output.push({
          type: "output",
          text: "Program finished successfully with no output."
        });
      }

      output.push({
        type: "success",
        text: `Process finished with exit code ${result.exitCode ?? 0}.`
      });

      setTerminalOutput(output);

    } catch (error) {
      setTerminalOutput([
        {
          type: "error",
          text: error.message || "Could not execute code."
        }
      ]);
    } finally {
      setRunning(false);
    }
  };

  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  return (
    <div className="workspace-page marginn editor-page">

      <PageHeader
        eyebrow="COLLABORATIVE EDITOR"
        title="Text Editor"
        description={`Shared coding environment for ${group.name}.`}
      />

      <div className="modern-editor">

        {/* EDITOR HEADER */}

        <div className="modern-editor-header">

          <div className="language-tabs">

            {Object.entries(languageConfig).map(
              ([key, config]) => (
                <button
                  key={key}
                  className={
                    language === key
                      ? "language-tab active"
                      : "language-tab"
                  }
                  onClick={() =>
                    changeLanguage(key)
                  }
                >
                  <Code2 size={15} />
                  <span>{config.label}</span>
                </button>
              )
            )}

          </div>

          <div className="editor-actions">

            <span
              className={
                connected
                  ? "editor-sync connected"
                  : "editor-sync"
              }
            >
              <i />
              {connected ? "Synced" : "Connecting..."}
            </span>

            <button
              className="terminal-toggle"
              onClick={() =>
                setTerminalOpen(v => !v)
              }
            >
              <Terminal size={15} />
              Terminal
            </button>

            <button
              className="run-button"
              onClick={runCode}
              disabled={running}
            >
              {running ? (
                <>
                  <RotateCcw
                    size={15}
                    className="spin"
                  />
                  Running
                </>
              ) : (
                <>
                  <Play size={15} />
                  Run
                </>
              )}
            </button>

          </div>

        </div>


        {/* EDITOR META */}

        <div className="editor-meta">

          <div className="editor-file">

            <span className="file-dot" />

            <span>
              {current.file}
            </span>

            <span className="file-language">
              {current.label}
            </span>

          </div>

          <div className="editor-meta-right">

            <span>
              UTF-8
            </span>

            <span>
              Spaces: 4
            </span>

            <span>
              LF
            </span>

          </div>

        </div>


        {/* MONACO */}

        <div
          className={
            terminalOpen
              ? "monaco-container with-terminal"
              : "monaco-container"
          }
        >

          <Editor
  height={
    terminalOpen
      ? "calc(100vh - 520px)"
      : "calc(100vh - 250px)"
  }
  theme="vs-dark"
  language={current.monaco}
  value={files[language] || ""}
  onChange={value =>
    updateFile(value || "")
  }
  options={{
    fontSize: 15,
    lineHeight: 24,
    minimap: {
      enabled: true
    },
    automaticLayout: true,
    wordWrap: "on",
    padding: {
      top: 18,
      bottom: 18
    },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    renderWhitespace: "selection",
    bracketPairColorization: {
      enabled: true
    },
    suggestOnTriggerCharacters: true,
    tabSize: 4
  }}
/>

        </div>


        {/* TERMINAL */}

        {terminalOpen && (
          <div className="editor-terminal">

            <div className="terminal-header">

              <div className="terminal-title">

                <Terminal size={15} />

                <strong>
                  Terminal
                </strong>

                <span>
                  {current.label}
                </span>

              </div>

              <div className="terminal-actions">

                <button
                  title="Clear terminal"
                  onClick={clearTerminal}
                >
                  <Trash2 size={14} />
                </button>

                <button
                  title="Close terminal"
                  onClick={() =>
                    setTerminalOpen(false)
                  }
                >
                  <X size={15} />
                </button>

              </div>

            </div>


            <div className="terminal-body">

              {terminalOutput.length === 0 ? (
                <div className="terminal-empty">
                  Terminal cleared.
                </div>
              ) : (
                terminalOutput.map(
                  (item, index) => (
                    <div
                      key={index}
                      className={`terminal-line ${item.type}`}
                    >
                      {item.type === "output" && (
                        <span className="terminal-prefix">
                          $
                        </span>
                      )}

                      {item.type === "error" && (
                        <span className="terminal-prefix error-prefix">
                          !
                        </span>
                      )}

                      <pre>
                        {item.text}
                      </pre>

                    </div>
                  )
                )
              )}

            </div>

            <div className="terminal-footer">

              <span>
                <i />
                Ready
              </span>

              <span>
                {current.file}
              </span>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

function PreviewPage({ group, user }) {
  const {
    files,
    updateWebFile,
    connected
  } = useWebFiles(group.id, user);

  const [activeFile, setActiveFile] =
    useState("html");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [previewReady, setPreviewReady] =
    useState(true);


  const fileConfig = {
    html: {
      label: "HTML",
      filename: "index.html",
      language: "html"
    },

    css: {
      label: "CSS",
      filename: "style.css",
      language: "css"
    },

    javascript: {
      label: "JavaScript",
      filename: "script.js",
      language: "javascript"
    }
  };


  const currentFile =
    fileConfig[activeFile];


  const srcDoc = useMemo(() => {
    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<style>

${files.css || ""}

</style>

</head>


<body>

${files.html || ""}


<script>

${files.javascript || ""}

<\/script>

</body>

</html>
`;
  }, [
    files.html,
    files.css,
    files.javascript,
    refreshKey
  ]);


  const handleRefresh = () => {
    setPreviewReady(false);

    setTimeout(() => {
      setRefreshKey(value => value + 1);
      setPreviewReady(true);
    }, 80);
  };


  return (
    <div className="workspace-page marginn preview-page ">

      <PageHeader
        eyebrow="WEB PLAYGROUND"
        title="Live Preview"
        description={`Build and preview ${group.name}'s web interface in real time.`}
      />


      <div className="web-playground">

        {/* ============================
            PLAYGROUND HEADER
        ============================ */}

        <div className="playground-header">

          <div className="playground-title">

            <div className="playground-icon">
              <Globe2 size={18} />
            </div>

            <div>
              <strong>Web Playground</strong>

              <span>
                HTML · CSS · JavaScript
              </span>
            </div>

          </div>


          <div className="playground-actions">

            <span
              className={
                connected
                  ? "preview-status live"
                  : "preview-status"
              }
            >
              <i />

              {connected
                ? "Live"
                : "Connecting..."}
            </span>


            <button
              className="preview-refresh"
              onClick={handleRefresh}
              title="Refresh preview"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

          </div>

        </div>


        {/* ============================
            MAIN PLAYGROUND
        ============================ */}

        <div className="playground-body">


          {/* ============================
              CODE PANEL
          ============================ */}

          <section className="web-code-panel">

            <div className="web-code-header">

              <div className="web-file-tabs">

                {Object.entries(fileConfig).map(
                  ([key, config]) => (

                    <button
                      key={key}
                      className={
                        activeFile === key
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveFile(key)
                      }
                    >

                      <Code2 size={13} />

                      {config.label}

                    </button>

                  )
                )}

              </div>

            </div>


            <div className="web-file-meta">

              <div>

                <span className="file-dot" />

                <strong>
                  {currentFile.filename}
                </strong>

              </div>

              <span>
                {currentFile.language}
              </span>

            </div>


            <div className="web-editor">

              <Editor
                height="100%"
                theme="vs-dark"
                language={currentFile.language}
                value={files[activeFile]}
                onChange={value =>
                  updateWebFile(
                    activeFile,
                    value || ""
                  )
                }
                options={{
                  fontSize: 14,

                  minimap: {
                    enabled: false
                  },

                  automaticLayout: true,

                  wordWrap: "on",

                  smoothScrolling: true,

                  padding: {
                    top: 18,
                    bottom: 18
                  },

                  scrollBeyondLastLine: false,

                  lineNumbers: "on",

                  renderLineHighlight:
                    "line",

                  cursorBlinking:
                    "smooth",

                  bracketPairColorization: {
                    enabled: true
                  },

                  folding: true,

                  suggest: {
                    showMethods: true,
                    showFunctions: true
                  }
                }}
              />

            </div>


            <div className="web-code-footer">

              <span>
                <i />
                Synced with workspace
              </span>

              <span>
                UTF-8 · Spaces: 2
              </span>

            </div>

          </section>


          {/* ============================
              PREVIEW PANEL
          ============================ */}

          <section className="web-preview-panel">

            <div className="preview-toolbar">

              <div className="browser-dots">

                <i />
                <i />
                <i />

              </div>


              <div className="preview-url">

                <Lock size={11} />

                <span>
                  collabcode.local
                </span>

                <small>
                  /{group.id}/preview
                </small>

              </div>


              <div className="preview-live">

                <i />

                Live

              </div>

            </div>


            <div className="preview-content">

              {previewReady ? (

                <iframe
                  key={refreshKey}
                  title="CollabCode Live Preview"
                  sandbox="allow-scripts"
                  srcDoc={srcDoc}
                />

              ) : (

                <div className="preview-loading">

                  <RefreshCw
                    size={20}
                    className="spin"
                  />

                  <span>
                    Updating preview...
                  </span>

                </div>

              )}

            </div>


            <div className="preview-footer">

              <span>
                <i />
                Preview synchronized
              </span>

              <span>
                HTML + CSS + JavaScript
              </span>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}
function extractBody(html){const m=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);return m?m[1]:html.replace(/<script[\s\S]*?<\/script>/gi,"")}

function ChatPage({ group, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [online, setOnline] = useState(group.memberCount || 1);
  const [members, setMembers] = useState([]);
  const [sendingImage, setSendingImage] = useState(false);

  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onState = s => {
      if (s.groupId !== group.id) return;

      setMessages(s.messages || []);

      const currentMembers = s.members || [];

      setMembers(currentMembers);
      setOnline(
        currentMembers.length ||
        group.memberCount ||
        1
      );
    };

    const onPresence = s => {
      if (s.groupId !== group.id) return;

      const currentMembers = s.members || [];

      setMembers(currentMembers);
      setOnline(currentMembers.length);
    };

    const onMsg = m => {
      if (m.groupId === group.id) {
        setMessages(v => [...v, m]);
      }
    };

    socket.on("group:state", onState);
    socket.on("presence:update", onPresence);
    socket.on("chat:message", onMsg);

    socket.emit("group:join", {
      groupId: group.id,
      username: user
    });

    return () => {
      socket.off("group:state", onState);
      socket.off("presence:update", onPresence);
      socket.off("chat:message", onMsg);

      socket.emit("group:leave", {
        groupId: group.id,
        username: user
      });
    };
  }, [group.id, user]);


  /*
   * AUTO SCROLL TO LATEST MESSAGE
   */
  useEffect(() => {
    if (!messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages]);


  const send = () => {
    if (!text.trim()) return;

    socket.emit("chat:send", {
      groupId: group.id,
      username: user,
      message: text.trim()
    });

    setText("");
  };


  const sendImage = event => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("Please select an image smaller than 3 MB.");
      event.target.value = "";
      return;
    }

    setSendingImage(true);

    const reader = new FileReader();

    reader.onload = () => {
      const payload = JSON.stringify({
        type: "image",
        data: reader.result,
        name: file.name
      });

      socket.emit("chat:send", {
        groupId: group.id,
        username: user,
        message: payload
      });

      setSendingImage(false);
      event.target.value = "";
    };

    reader.onerror = () => {
      setSendingImage(false);
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };


  const renderMessage = message => {
    try {
      const parsed = JSON.parse(message);

      if (
        parsed?.type === "image" &&
        parsed?.data
      ) {
        return (
          <div className="chat-image-message">

            <img
              src={parsed.data}
              alt={parsed.name || "Shared image"}
            />

            {parsed.name && (
              <span>{parsed.name}</span>
            )}

          </div>
        );
      }
    } catch {
      // Normal text message
    }

    return message;
  };


  return (
    <div className="workspace-page marginn chat-page">

      <PageHeader
        eyebrow="TEAM COMMUNICATION"
        title="Group Chat"
        description={`Technical conversation for ${group.name}.`}
      />

      <div className="chat-workspace">

        {/* SIDEBAR */}

        <aside className="chat-sidebar">

          <div className="chat-sidebar-top">

            <div className="room-icon">
              <MessageCircle size={18} />
            </div>

            <div>
              <span>ACTIVE ROOM</span>
              <strong>{group.name}</strong>
            </div>

          </div>


          <div className="room-info-section">

            <span className="room-label">
              ROOM STATUS
            </span>

            <div className="room-live-card">

              <span className="room-live-dot" />

              <div>
                <strong>Live collaboration</strong>

                <small>
                  Realtime connection active
                </small>
              </div>

            </div>

          </div>


          {/* ONLINE MEMBERS */}

          <div className="room-info-section members-section">

            <div className="room-label-row">

              <span className="room-label">
                ONLINE MEMBERS
              </span>

              <b>{online}</b>

            </div>


            {members.length === 0 ? (

              <div className="members-loading">
                Connecting...
              </div>

            ) : (

              members.map(member => {

                const memberName =
                  member.name ||
                  member.username ||
                  "Anonymous";

                const initial =
                  memberName
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "?";

                const isCurrentUser =
                  memberName === user;

                return (
                  <div
                    className="chat-member"
                    key={member.id || memberName}
                  >

                    <span className="member-avatar">
                      {initial}
                      <i />
                    </span>

                    <div>

                      <strong>
                        {memberName}

                        {isCurrentUser && (
                          <em>YOU</em>
                        )}
                      </strong>

                      <small>
                        {isCurrentUser
                          ? "Active now"
                          : "Online"}
                      </small>

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </aside>


        {/* MAIN CHAT */}

        <section className="chat-main">

          <header className="modern-chat-head">

            <div className="modern-chat-title">

              <div className="hash-icon">
                <MessageCircle size={17} />
              </div>

              <div>

                <div className="chat-title-row">

                  <h3>{group.name}</h3>

                  <span className="live-badge">
                    <i />
                    LIVE
                  </span>

                </div>

                <p>
                  Realtime team conversation
                </p>

              </div>

            </div>


            <div className="online-count">

              <span>
                <i />
                {online}
              </span>

              <small>
                online
              </small>

            </div>

          </header>


          {/* MESSAGE AREA */}

          <div className="modern-messages">

            {messages.length === 0 && (
  <div className="chat-empty-modern">

    <div className="empty-chat-orbit">

      <div className="orbit-ring ring-one" />
      <div className="orbit-ring ring-two" />

      <div className="empty-chat-icon">
        <MessageCircle size={28} />
      </div>

    </div>

    <span className="empty-chat-label">
      REALTIME WORKSPACE
    </span>

    <h3>
      Your team space is ready.
    </h3>

    <p>
      Start a conversation, share an idea,
      or drop an image for your teammates.
    </p>

    <div className="chat-empty-actions">

      <button
        type="button"
        onClick={() => {
          document
            .querySelector(".composer-inner input:not([type='file'])")
            ?.focus();
        }}
      >
        <MessageCircle size={16} />
        Start chatting
      </button>

      <button
        type="button"
        onClick={() =>
          imageInputRef.current?.click()
        }
      >
        <ImageIcon size={16} />
        Share image
      </button>

    </div>

    <div className="chat-empty-hints">

      <div>
        <span className="hint-icon">
          <Users size={14} />
        </span>

        <div>
          <strong>
            {online} {online === 1 ? "member" : "members"} online
          </strong>
          <small>
            Ready to collaborate
          </small>
        </div>
      </div>

      <div>
        <span className="hint-icon">
          <Send size={14} />
        </span>

        <div>
          <strong>
            Press Enter to send
          </strong>
          <small>
            Messages appear instantly
          </small>
        </div>
      </div>

    </div>

  </div>
)}


            {messages.map((m, i) => {

              const mine =
                m.username === user;

              return (
                <div
                  key={m.id || i}
                  className={`modern-message ${
                    mine ? "mine" : ""
                  }`}
                >

                  <span className="modern-avatar">
                    {(m.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>


                  <div className="message-content">

                    <header>

                      <strong>
                        {m.username}
                      </strong>

                      {mine && (
                        <span className="you-label">
                          YOU
                        </span>
                      )}

                      <time>
                        {formatTime(m.createdAt)}
                      </time>

                    </header>


                    <div className="message-bubble">
                      {renderMessage(m.message)}
                    </div>

                  </div>

                </div>
              );
            })}


            {/* AUTO SCROLL TARGET */}

            <div
              ref={messagesEndRef}
              className="messages-end"
            />

          </div>


          {/* COMPOSER */}

          <div className="modern-composer">

            <div className="composer-inner">

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={sendImage}
                style={{ display: "none" }}
              />


              <button
                className="composer-action"
                type="button"
                title="Send image"
                onClick={() =>
                  imageInputRef.current?.click()
                }
                disabled={sendingImage}
              >
                <ImageIcon size={17} />
              </button>


              <input
                type="text"
                value={text}
                onChange={e =>
                  setText(e.target.value)
                }
                onKeyDown={e => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Message your team..."
                className="text_color"
              />


              <button
                className="composer-send"
                type="button"
                onClick={send}
                disabled={!text.trim()}
              >
                <Send size={16} />
              </button>

            </div>


            <div className="composer-hint">

              <span>
                <kbd>Enter</kbd> to send
              </span>

              <span>
                <ImageIcon size={11} />
                Images up to 3 MB
              </span>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}
function formatTime(t){return t?new Date(t).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"now"}

const DEFAULT_WEB_FILES = {
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
}
  *{
  margin: 0 auto;
}`,

  javascript: `console.log("CollabCode Live Preview");`
};

function useWebFiles(groupId, username) {
  const [files, setFiles] = useState(DEFAULT_WEB_FILES);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const handleConnect = () => {
      setConnected(true);

      socket.emit("web:join", {
        groupId,
        username
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleState = ({ groupId: incomingGroupId, files }) => {
      if (
        incomingGroupId !== groupId ||
        !files
      ) {
        return;
      }

      setFiles({
        html: files.html ?? DEFAULT_WEB_FILES.html,
        css: files.css ?? DEFAULT_WEB_FILES.css,
        javascript:
          files.javascript ??
          DEFAULT_WEB_FILES.javascript
      });
    };

    const handleUpdate = ({
      groupId: incomingGroupId,
      file,
      content
    }) => {
      if (
        incomingGroupId !== groupId ||
        !["html", "css", "javascript"].includes(file)
      ) {
        return;
      }

      setFiles(prev => ({
        ...prev,
        [file]: content
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on(
      "web:state",
      handleState
    );

    socket.on(
      "web:update",
      handleUpdate
    );

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      socket.off(
        "web:state",
        handleState
      );

      socket.off(
        "web:update",
        handleUpdate
      );
    };
  }, [groupId, username]);

  const updateWebFile = useCallback(
    (file, content) => {
      if (
        !["html", "css", "javascript"].includes(file)
      ) {
        return;
      }

      setFiles(prev => ({
        ...prev,
        [file]: content
      }));

      socket.emit("web:update", {
        groupId,
        username,
        file,
        content
      });
    },
    [groupId, username]
  );

  return {
    files,
    updateWebFile,
    connected
  };
}

export default App;
