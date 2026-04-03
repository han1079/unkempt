    
const minicon = document.getElementById("minicon");
const debug_rows = document.getElementById("debug_rows");


const debug_objs = [];
debug_objs.push(MouseXY);
debug_objs.push(nearest);
debug_objs.push(XYDisplacement);
debug_objs.push(currentInput);

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

on_dt_list.push(renderDebug);

function log(fmt, ...args) {
   minicon.textContent = format(fmt, ...args);
}