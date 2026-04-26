const ContextRegistry = {};
const _context_stack  = [];
let   _debug_context  = null;

const state = {
    stack_height: 0,
};

// ── Registration ──────────────────────────────────────────────
function register_context(name, ctx) {
    ContextRegistry[name] = ctx;
    if (ctx.on_register) ctx.on_register(state);
}

function register_debug_context(ctx) {
    _debug_context = ctx;
}

// ── Capability check ──────────────────────────────────────────
function _can_push(ctx) {
    if (!ctx.exclusive) return true;
    for (const cap of ctx.exclusive) {
        for (const active of _context_stack) {
            if (active.exclusive?.includes(cap)) return false;
        }
    }
    return true;
}

// ── Public stack API ──────────────────────────────────────────
function push_context(ctx) { _push(ctx); }
function pop_context(ctx)  { _pop(ctx);  }

// ── Stack operations ──────────────────────────────────────────
function _push(ctx) {
    if (!ctx || !_can_push(ctx)) return;
    _context_stack.push(ctx);
    state.stack_height += 1;
    if (ctx.on_push) ctx.on_push(state);
}

function _pop(ctx) {
    const i = _context_stack.indexOf(ctx);
    if (i === -1) return;
    _context_stack.splice(i, 1);
    state.stack_height -= 1;
    if (ctx.on_pop) ctx.on_pop(state);
}

// ── Dispatch ──────────────────────────────────────────────────
function dispatch(raw, context_stack_request) {
    const event = {
        ...raw,
        ingested: { position: false, button: false, keys: {} },
    };

    _debug_context?.on_event(event, state, context_stack_request);

    for (let i = _context_stack.length - 1; i >= 0; i--) {
        _context_stack[i].on_event?.(event, state, context_stack_request);
    }
}

function update_context_stack(context_stack_request) {
    context_stack_request.filter(r => r.pop).forEach(r => _pop(r.pop));
    context_stack_request.filter(r => r.push).forEach(r => _push(r.push));
}
