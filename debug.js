const minicon = document.getElementById("minicon");
const debug_rows = document.getElementById("debug_rows");

const MouseXY = {x: 0, y: 0, mouseInside: false};
const nearest = {Nearest: "NONE"};
const debug_objs = [];
debug_objs.push(MouseXY);
debug_objs.push(nearest);

function renderDebug() {
    debug_rows.textContent = "";
    for (let i = 0; i< debug_objs.length; i++) {
        let obj = debug_objs[i];
        for (const [k,v] of Object.entries(obj)) {
            const tablerow = document.createElement("tr");
            const tbldataKey = document.createElement("td");
            const tbldataVal = document.createElement("td");
            tbldataKey.textContent = String(k);
            if (typeof v === "number") {
                tbldataVal.textContent = String(v.toFixed(2));
            } else {
                tbldataVal.textContent = String(v);
            }
            tablerow.append(tbldataKey);
            tablerow.append(tbldataVal);
            debug_rows.append(tablerow);
        }
    }
}

function log(fmt, ...args) {
   minicon.textContent = format(fmt, ...args);
}