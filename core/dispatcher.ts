const SESSION_REGISTRY: SessionRegisterEntry = {};
const _SESSION_STACK: Session[]  = [];

// Forward declaration of _DEBUG_SESSION.
let   _DEBUG_SESSION: Session | null = null;

const GLOBAL_STATE: GlobalState = {
    stack_height: 0,
};

const _DEBUG_OBJS: DebugObj[] = [];

// ── Debug object registration ─────────────────────────────────
function register_debug(obj: DebugObj) {
    _DEBUG_OBJS.push(obj);
    return function() {
        const i = _DEBUG_OBJS.indexOf(obj);
        if (i !== -1) _DEBUG_OBJS.splice(i, 1);
    };
}

// ── Registration ──────────────────────────────────────────────
function register_session(name: string, session: Session) {
    SESSION_REGISTRY[name] = session;
    if (session.on_register) session.on_register(GLOBAL_STATE);
}

function register_debug_session(session: Session) {
    _DEBUG_SESSION = session;
}

function _can_push(session: Session): boolean {
    return !_SESSION_STACK.includes(session);
}

// ── Public stack API ──────────────────────────────────────────
function push_session(session: Session) { _push(session); }
function pop_session(session: Session)  { _pop(session);  }

// ── Stack operations ──────────────────────────────────────────
function _push(session: Session) {
    if (!session || !_can_push(session)) return;
    _SESSION_STACK.push(session);
    GLOBAL_STATE.stack_height += 1;
    if (session.on_push) session.on_push(GLOBAL_STATE);
}

function _pop(session: Session) {
    if (_SESSION_STACK.at(-1) !== session) return;
    _SESSION_STACK.pop();
    GLOBAL_STATE.stack_height -= 1;
    if (session.on_pop) session.on_pop(GLOBAL_STATE);
}

// ── Dispatch ──────────────────────────────────────────────────
function dispatch(raw: RawEvent, session_stack_request: SessionRequest[]) {
    const event: DispatchedEvent = {
        ...raw,
        muted: { position: false, action: false, keys: [] },
    };

    _DEBUG_SESSION?.on_event(event, GLOBAL_STATE, session_stack_request);

    for (let i = _SESSION_STACK.length - 1; i >= 0; i--) {
        _SESSION_STACK[i].on_event?.(event, GLOBAL_STATE, session_stack_request);
    }
}

// ── Tick ──────────────────────────────────────────────────────
function tick_sessions(dt: number, session_stack_request: SessionRequest[]) {
    _DEBUG_SESSION?.on_dt?.(dt, GLOBAL_STATE, session_stack_request);
    for (let i = _SESSION_STACK.length - 1; i >= 0; i--) {
        _SESSION_STACK[i].on_dt?.(dt, GLOBAL_STATE, session_stack_request);
    }
}

// ── Session stack update ──────────────────────────────────────
function update_session_stack(session_stack_request: SessionRequest[]) {

    // Pop happens first.
    for (const request of session_stack_request) {
        if (('pop' in request) && !('push' in request)) {
            _pop(request.pop);
        }
    }
    for (const request of session_stack_request) {
        if (('push' in request) && !('pop' in request)) {
            _push(request.push);
            break; // Only a single push allowed per session stack update
        } 
    }
}
