# AgenticDocs - Technical Roadmap

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌────────────────┐  ┌─────────────────────────────────┐   │
│  │  File System   │  │       IPC Bridge                  │   │
│  │  (Documents)   │  │  (Main ↔ Renderer Communication) │   │
│  └────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ IPC
┌─────────────────────────────────────────────────────────────┐
│                   Electron Renderer Process                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Document Editor UI (React)              │   │
│  │           (contenteditable or ProseMirror)           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Agent Layer                         │   │
│  │  ┌─────────┐    ┌──────────┐    ┌────────────────┐   │   │
│  │  │ Planner │───▶│ Executor │───▶│ Critic (Loop)  │───│   │
│  │  └─────────┘    └──────────┘    └───────┬────────┘   │   │
│  │                                          │            │   │
│  │         ┌────────────────────────────────┘            │   │
│  │         ↓                                               │   │
│  │  ┌────────────────┐  ┌───────────────────────────┐      │   │
│  │  │    Memory      │  │    Conversation History   │      │   │
│  │  │  (Long-term)   │  │     (Short-term)         │      │   │
│  │  └────────────────┘  └───────────────────────────┘      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Agent Loop Flow

```
User Goal → Planner → Executor → Editor
                            ↓
                      Critic (Review)
                            ↓
                    ┌───────┴───────┐
                    ↓               ↓
                 Success      Failed → Replan
```

## Implementation Phases

### Phase 1: Electron Setup (Foundation)
- [ ] Initialize Electron project with Vite + React
- [ ] Set up IPC communication layer
- [ ] Create basic document editor component
- [ ] Integrate existing agent code

### Phase 2: Memory System
- [ ] Define memory interface (short-term + long-term)
- [ ] Implement conversation history buffer
- [ ] Add document context storage
- [ ] Wire memory to planner

### Phase 3: Critic Loop
- [ ] Create critic module (OpenAI-powered)
- [ ] Define review criteria (quality, correctness)
- [ ] Implement retry mechanism with backoff
- [ ] Add loop detection (max iterations)

### Phase 4: Polish & Persistence
- [ ] Document save/load via main process
- [ ] Agent state persistence
- [ ] Error handling & recovery
- [ ] Logging system

## Next Steps

**Immediate priorities:**
1. Set up Electron + React + Vite project
2. Create IPC bridge for renderer ↔ main
3. Build document editor component
4. Integrate agent layer into renderer
5. Implement memory system
6. Add critic loop

## File Structure (Updated)

```
/agent
├── types.ts
├── tools.ts
├── planner.ts
├── executor.ts
├── agent.ts
├── mockEditor.ts
├── test.ts
├── memory.ts           (NEW)
├── critic.ts           (NEW)
└── index.ts

/electron
├── main/
│   ├── main.ts        (NEW)
│   ├── ipc.ts         (NEW)
│   └── fileSystem.ts   (NEW)
├── renderer/
│   ├── index.html     (NEW)
│   ├── App.tsx        (NEW)
│   ├── Editor.tsx     (NEW)
│   ├── AgentPanel.tsx (NEW)
│   └── main.tsx       (NEW)
└── preload.ts         (NEW)

package.json          (UPDATE)
tsconfig.json         (UPDATE)
```
