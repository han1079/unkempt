const svg_overlay = document.getElementById("overlay_svg");
const draw_area = document.getElementById("drawing_svg");
const XMLATTR = "http://www.w3.org/2000/svg";
svg_overlay.setAttribute("xmlns", XMLATTR);
const drawing = document.createElementNS(XMLATTR, "path");
drawing.setAttribute("id", "ink_drawing");
drawing.setAttribute("stroke", "black");
drawing.setAttribute("z-index", 2000);
drawing.setAttribute("stroke-width", 2);
drawing.setAttribute("fill", "none");
draw_area.appendChild(drawing);

let draw_data = "";
let current_stroke = null;
let strokes = [];
function renderInk(){
    if (currentUIMode === UIModes.drawing) {
        if (brush_XY.startx === null || brush_XY.starty === null) {
            log("Starting outside drawing area")
            return;
        }
        if (current_stroke === null) {
            // First frame of drawing
            current_stroke = `M ${brush_XY.startx} ${brush_XY.starty} `;
        } else {
            // Subsequent frames of drawing
            current_stroke += `L ${brush_XY.current_x} ${brush_XY.current_y} `;
            draw_data = strokes.join(" ") + " " + current_stroke;
            drawing.setAttribute("d", draw_data);
        }
    } else {
        // Exiting drawing mode. Terminate the existing stroke.
        if (current_stroke !== null) {
            strokes.push(current_stroke);
            draw_data = strokes.join(" ");
            drawing.setAttribute("d", draw_data);
        }
        current_stroke = null;
    }
}

on_dt_list.push(renderInk);