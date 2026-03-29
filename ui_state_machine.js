
// UI States

const UIModes = {
    default: 'default',
    measuring: 'measuring',
    drawing: 'drawing',
    object_selected: 'object_selected',
    object_dragging: 'object_dragging',
    object_moving: 'object_moving',
    viewport_panning: 'viewport_panning',
}

const MouseXY = {x: 0, y: 0,mouseInside: false};
const nearest = {Nearest: "NONE"};
let currentUIMode = UIModes.default;
let DRAG_DELAY_MS = 20; // milliseconds
const XYDisplacement = {startdx: 0, startdy: 0, dx: 0, dy: 0};


// UI Mode State Machine

const InputStates = {
    idle: 'idle',
    pointer_down: 'pointer_down',
    pointer_down_and_dragging: 'pointer_down_and_dragging',
}

const currentInput = {state: InputStates.idle};
let dragTimer = null;

const brush_XY = {startx: null, starty: null, current_x: null, current_y: null};

function reset_drawing_data() {
    brush_XY.startx = null;
    brush_XY.starty = null;
    brush_XY.current_x = null;
    brush_XY.current_y = null;
}

function start_stroke(coords) {
    brush_XY.startx = coords.x;
    brush_XY.starty = coords.y;
    brush_XY.current_x = coords.x;
    brush_XY.current_y = coords.y;
}

function update_stroke(coords) {
    brush_XY.current_x = coords.x;
    brush_XY.current_y = coords.y;
}

function resetUIMode() {
    currentUIMode = UIModes.default;
    clearCursorMode();
}

function handleUIModeChangeForDragStart(ev) {
    // Logic to change UI mode on drag start
    //console.log("Handling UI Mode Change for Drag Start");
    if (ev.target === document.getElementsByClassName("drawable_area")[0]) {

        // Initialize starting XY coord for drawing
        currentUIMode = UIModes.drawing;
        start_stroke(getBoxRelativeCoords(ev.clientX, ev.clientY, ev.target.getBoundingClientRect()));
    }
}

function handleUIModeChangeForDragMove(ev) {
    // Logic to change UI mode on drag move
    //console.log("Handling UI Mode Change for Drag Move");
    if (ev.target === document.getElementsByClassName("drawable_area")[0]) {

        // Update latest XY coord. Updater will get latest position from here.
        currentUIMode = UIModes.drawing;
        update_stroke(getBoxRelativeCoords(ev.clientX, ev.clientY, ev.target.getBoundingClientRect()));
    } else if (ev.target !== document.getElementsByClassName("drawable_area")[0]) {
        currentUIMode = UIModes.default;

        // Reset drawing XY tracker since we've left. New drawing will start fresh.
        
    }
}

function handleUIModeChangeForDragEnd(ev) {
    // Reset input state. This is UI state agnostic.
    currentInput.state = InputStates.idle;
    // Logic to change UI mode on drag end
    //console.log("Handling UI Mode Change for Drag End");
    if (ev.target === document.getElementsByClassName("drawable_area")[0]) {

        // Stop drawing mode and reset XY tracker.
        currentUIMode = UIModes.default;
        reset_drawing_data();
    }
}

function onPointerDown(ev) {
    if (ev.button !== 0) return; // Only left mouse button

    currentInput.state = InputStates.pointer_down;
    XYDisplacement.startdx = ev.clientX;
    XYDisplacement.startdy = ev.clientY;
    XYDisplacement.dx = 0;
    XYDisplacement.dy = 0;

    // Mouse Down events are either precursors to dragging or clicks/double-clicks.
    // We handle ONLY the dragging case here. Clicks and double-clicks are handled
    // as built-in browser events so we don't have to manage timing ourselves.

    //console.log("Pointer Down at ", ev.clientX, ev.clientY);

    dragTimer = setTimeout(() => {
        if (currentInput.state !== InputStates.pointer_down) {
            return; // State has changed - click handler can do its thing.
        }
        //console.log("Pointer Dragging started at ", ev.clientX, ev.clientY);
        currentInput.state = InputStates.pointer_down_and_dragging;
        handleUIModeChangeForDragStart(ev);
    }, DRAG_DELAY_MS);
}

function onPointerMove(ev) {
    // Update Debug Dialog
    MouseXY.x = ev.clientX;
    MouseXY.y = ev.clientY;
    MouseXY.mouseInside = true;

    if (currentInput.state === InputStates.pointer_down_and_dragging) {
        handleUIModeChangeForDragMove(ev);
        XYDisplacement.dx = ev.clientX - XYDisplacement.startdx;
        XYDisplacement.dy = ev.clientY - XYDisplacement.startdy;
    }
}

function onPointerUp(ev) {
    if (ev.button !== 0) return; // Only left mouse button
    //console.log("Pointer Up at ", ev.clientX, ev.clientY);

    if (currentInput.state === InputStates.pointer_down_and_dragging) {
        //console.log("Pointer Dragging ended at ", ev.clientX, ev.clientY);
        handleUIModeChangeForDragEnd(ev);
        XYDisplacement.dx = ev.clientX - XYDisplacement.startdx;
        XYDisplacement.dy = ev.clientY - XYDisplacement.startdy;
    }

    clearTimeout(dragTimer);
    dragTimer = null;



}
                


// window.addEventListener("mouseout", (e) => {if (e.relatedTarget === null) {MouseXY.mouseInside = false;}});
window.addEventListener("click", (e) => {nearest["Nearest"] = e.target.classList;});
document.getElementById("Wireframe Toggle").addEventListener("click", () => {document.documentElement.classList.toggle("wireframe")});
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointerup", onPointerUp);
// window.addEventListener("pointercancel", onPointerUp);

// Mouse Cursor Mode State Machine
// const cursorModes = {
//     default: 'default',
//     measure: 'crosshair',
// };

// const currentCursorMode = {
//     mode: cursorModes.default,
// };
// function clearCursorMode() {
//     if (currentCursorMode.mode === cursorModes.default) return;
//     currentCursorMode.mode = cursorModes.default;
//     document.body.style.cursor = cursorModes.default;
//     turnoff_measure_mode();
// }

// function setCursorMode(mode) {
//     if (currentCursorMode.mode === mode) return;
    
//     if (currentCursorMode.mode === cursorModes.measure || mode !== cursorModes.default) {
//         //console.log("Measure mode dominates over other special modes.");
//         return;
//     }

//     currentCursorMode.mode = mode;
//     document.body.style.cursor = cursorModes[mode];
//     if (mode === cursorModes.measure) {
//         turnon_measure_mode();
//     } else {
//         throw new Error("Unknown cursor mode: " + mode);
//     }
// }

// const turnon_measure_mode = () => document.body.classList.toggle("measure-mode", currentCursorMode.mode === cursorModes.measure);
// const turnoff_measure_mode = () => document.body.classList.toggle("measure-mode", currentCursorMode.mode !== cursorModes.measure);