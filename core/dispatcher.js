const SESSION_REGISTRY = {};
const _SESSION_STACK   = [];
let   _DEBUG_SESSION   = null;

const GLOBAL_STATE = {
    stack_height: 0,
};

const _UPDATER_LIST = [];
const _DEBUG_OBJS   = [];

// ── Updater registration ──────────────────────────────────────
function register_updater(updater) {
    if (!updater.on_dt) throw new Error("Updater must implement on_dt");
    _UPDATER_LIST.push(updater);
    return function() {
        const i = _UPDATER_LIST.indexOf(updater);
        if (i !== -1) _UPDATER_LIST.splice(i, 1);
    };
}

// ── Debug object registration ─────────────────────────────────
function register_debug(obj) {
    _DEBUG_OBJS.push(obj);
    return function() {
        const i = _DEBUG_OBJS.indexOf(obj);
        if (i !== -1) _DEBUG_OBJS.splice(i, 1);
    };
}

// ── Registration ──────────────────────────────────────────────
function register_session(name, session) {
    SESSION_REGISTRY[name] = session;
    if (session.on_register) session.on_register(GLOBAL_STATE);
}

function register_debug_session(session) {
    _DEBUG_SESSION = session;
}

// ── Capability check ──────────────────────────────────────────
function _can_push(session) {
    if (!session.exclusive) return true;
    for (const cap of session.exclusive) {
        for (const active of _SESSION_STACK) {
            if (active.exclusive?.includes(cap)) return false;
        }
    }
    return true;
}

// ── Public stack API ──────────────────────────────────────────
function push_session(session) { _push(session); }
function pop_session(session)  { _pop(session);  }

// ── Stack operations ──────────────────────────────────────────
function _push(session) {
    if (!session || !_can_push(session)) return;
    _SESSION_STACK.push(session);
    GLOBAL_STATE.stack_height += 1;
    if (session.on_push) session.on_push(GLOBAL_STATE);
}

function _pop(session) {
    if (_SESSION_STACK.at(-1) !== session) return;
    _SESSION_STACK.pop();
    GLOBAL_STATE.stack_height -= 1;
    if (session.on_pop) session.on_pop(GLOBAL_STATE);
}

// ── Dispatch ──────────────────────────────────────────────────
function dispatch(raw, session_stack_request) {
    const event = {
        ...raw,
        muted: { position: false, action: false, keys: {} },
    };

    _DEBUG_SESSION?.on_event(event, GLOBAL_STATE, session_stack_request);

    for (let i = _SESSION_STACK.length - 1; i >= 0; i--) {
        _SESSION_STACK[i].on_event?.(event, GLOBAL_STATE, session_stack_request);
    }
}

// ── Tick ──────────────────────────────────────────────────────
function tick_sessions(dt, session_stack_request) {
    _DEBUG_SESSION?.on_dt?.(dt, GLOBAL_STATE, session_stack_request);
    for (let i = _SESSION_STACK.length - 1; i >= 0; i--) {
        _SESSION_STACK[i].on_dt?.(dt, GLOBAL_STATE, session_stack_request);
    }
}

// ── Session stack update ──────────────────────────────────────
function update_session_stack(session_stack_request) {
    session_stack_request.filter(r => r.pop).forEach(r => _pop(r.pop));
    const push = session_stack_request.find(r => r.push);
    if (push) _push(push.push);
}
