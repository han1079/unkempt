function _get_id(id) {
    return document.getElementById(id);
}

let _b1 = _get_id("b1");
let _b2 = _get_id("b2");


katex.render(String.raw`
    L \dot{i_L} = 
    \left(V_{in} - V_{C}\right) \frac{T_{on}}{T_{on} + T_{demag} + T_{idle}} 
    + 
    \left(0 - V_{C}\right) \cdot \frac{T_{demag}}{T_{on} + T_{demag} + T_{idle}}`
    , _b1);

katex.render(String.raw`
    C \dot{V_C} = 
    i_{L} \cdot \frac{T_{on} + T_{demag}}{T_{on} + T_{demag} + T_{idle}} -
    \frac{V_C}{R_{load}}`
    , _b2);