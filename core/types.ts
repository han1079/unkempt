interface GlobalState {
    stack_height: number;
    [key: string]: unknown;
}

interface DispatchedEvent {
    type: string;
    x?: number;
    y?: number;
    target?: EventTarget;
    [key: string]: unknown;
    time: number;
    muted: { position: boolean, action: boolean, keys: string[]}
}

interface RawEvent {
    type: string;
    x?: number;
    y?: number;
    target?: EventTarget;
    [key: string]: unknown;
    time: number;
}

interface Session {
    on_register(state: GlobalState): void;
    on_push(state: GlobalState): void;
    on_pop(state: GlobalState): void;
    on_event(event: DispatchedEvent,
             state: GlobalState,
             requests: SessionRequest[]): void;
    on_dt(dt: number, state: GlobalState, requests: SessionRequest[]): void;
}

interface RawInput {
    pointer: {
        x: number;
        y: number;
        down: boolean;
    };
    keys: Record<string, boolean>;
}

type SessionRequest = { push: Session } | { pop: Session };
type SessionRegisterEntry = Record<string, Session>;

type DebugEntry = Record<string, unknown>;
type DebugObj = Record<string, unknown | DebugEntry>;

interface Tile {
    mount(el: HTMLElement, state: GlobalState): void;
    unmount(): void;
    on_event?(event: DispatchedEvent, state: GlobalState, requests: SessionRequest[]): void;
    on_dt?(dt: number, state: GlobalState, requests: SessionRequest[]): void;
}

type TileRegisterEntry = Record<string, Tile>;

type CellNode = {
    kind: "cell";
    names: string[] | null;
    is_self: boolean;
}

type RowNode = {
    kind: "row";
    cells: CellNode[];
}

type TileNode = {
    kind: "tile";
    name: string | null;
    alignment: Record<string, number> | string | null;
    vertical_percentage: number | null;
    content: Record<string, string> | null;
    layout_ref: RowNode[] | null;
    subtile: boolean;
    raw: string;
}

type CSSRecord = Record<string, (string | number | null)> | null;

type StyleContent = {
    preset: string | null;
    raw: string | null;
    css: CSSRecord;
}

type StyleNode = {
    kind: "style";
    content: StyleContent;
    formatter: (arg: string) => string;
}

type TextNode = {
    kind: "text";
    raw: string; 
}

type GenericCodeNode = {
    kind: "code";
    raw: string;
}

type DocumentAST = {
    named_tiles: Record<string, TileNode>;
    nodes: (TileNode | StyleNode | TextNode)[];
}

