//const { editor } = require("monaco-editor")

let WIDTH = 16
let HEIGHT = 16
let DEFAULTCELLTYPE = 0

let WORLDWRAP = true

let selected = 0

let map = []
let oldmap = []
function generateEmptyMaps(){
    for(let i = 0; i < HEIGHT; i++){
        map.push([])
        oldmap.push([])
        for(let j = 0; j < WIDTH; j++){
            map[i].push(DEFAULTCELLTYPE)
            oldmap[i].push(DEFAULTCELLTYPE)
        }
    }
}
generateEmptyMaps()

function resizeMaps(){
    while(map.length < HEIGHT){
        map.push([])
        oldmap.push([])
    }
    map.length = HEIGHT
    oldmap.length = HEIGHT

    for(let i = 0; i < map.length; i++){
        while(map[i].length < WIDTH){
            map[i].push(DEFAULTCELLTYPE)
            oldmap[i].push(DEFAULTCELLTYPE)
        }
        map[i].length = WIDTH
        oldmap[i].length = WIDTH
    }
}

function getNeighborCells(x, y, rollaround = false){
    let neighborsmap = []
    for(let i = -1; i < 2; i++){
        for(let j = -1; j < 2; j++){
            if(i == 0 & j == 0) continue

            if(rollaround == false && x+i < 0) {neighborsmap.push(DEFAULTCELLTYPE); continue}
            if(rollaround == false && x+i >= WIDTH) {neighborsmap.push(DEFAULTCELLTYPE); continue}
            if(rollaround == false && y+j < 0) {neighborsmap.push(DEFAULTCELLTYPE); continue}
            if(rollaround == false && y+j >= HEIGHT) {neighborsmap.push(DEFAULTCELLTYPE); continue}

            neighborsmap.push(oldmap[(x + i + HEIGHT)%HEIGHT][(y + j + WIDTH)%WIDTH])
        }
    }

    return neighborsmap
}

class RuleSimple {
    constructor(requestedType, amountMin, amountMax, output, neighborsMap = 0b11111111, isReversed = false){
        this.type = requestedType
        this.min = amountMin
        this.max = amountMax
        this.output = output
        this.checkMap = neighborsMap
        this.reverse = isReversed
    }

    check(neighborsMap){
        let count = 0
        for(let i = 0; i < 8; i++){
            if(2**i & this.checkMap == 0) continue

            if(neighborsMap[i] == this.type) count ++
        }

        let condition = count >= this.min & count <= this.max
        if (this.reverse) condition = !condition

        if(condition){
            if(Array.isArray(this.output)){
                for(let i of this.output){
                    let result = i.check(neighborsMap)
                    if (result != -1) return result
                }
                return -1
            }else{return this.output}
        }else{
            return -1
        }
    }
}
class RuleAction{
    constructor(output){
        this.output = output
    }

    check(neighborsMap){
        return this.output
    }
}

class Element{
    constructor(color, name, rules=[]){
        this.color = color
        this.name = name
        this.rules = rules
    }

    check(neighborsMap){
        for(let i of this.rules){
            let result = i.check(neighborsMap)
            if (result != -1) return result
        }
        return -1
    }
}
/*
const LIVE = new Element("#AEAEBB", "LIVE", [new RuleSimple(1, 2, 3, 0, undefined , isReversed = true)])
const DEAD = new Element("#161616", "DEAD", [new RuleSimple(1, 3, 3, 1)])
const WIRE = new Element("#565656", "WIRE", [new RuleSimple(3, 1, 2, 3)])
const WIREACRIVE = new Element("#EA5656", "WIREACTIVE", [new RuleAction(4)])
const WIRETRACE = new Element("#5656AE", "WIRETRACE", [new RuleAction(2)])
*/
let TYPES = []

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function prepare(){
    for(let i = 0; i < HEIGHT; i++){
        for(let j = 0; j < WIDTH; j++){
            if(TYPES.length <= DEFAULTCELLTYPE) break

            ctx.fillStyle = TYPES[DEFAULTCELLTYPE].color;
            ctx.fillRect(i, j, 1, 1)
        }
    }
}

function STEP(){
    for(let i = 0; i < HEIGHT; i++){
        for(let j = 0; j < WIDTH; j++){
            //let nMap = getNeighborCells(i, j, WORLDWRAP)
            let nMap = []
            for(let is = -1; is < 2; is++){
                for(let js = -1; js < 2; js++){
                    if(is == 0 & js == 0) continue

                    if(WORLDWRAP == false && is+i < 0) {nMap.push(DEFAULTCELLTYPE); continue}
                    if(WORLDWRAP == false && is+i >= WIDTH) {nMap.push(DEFAULTCELLTYPE); continue}
                    if(WORLDWRAP == false && js+j < 0) {nMap.push(DEFAULTCELLTYPE); continue}
                    if(WORLDWRAP == false && js+j >= HEIGHT) {nMap.push(DEFAULTCELLTYPE); continue}

                    nMap.push(oldmap[(is + i + HEIGHT)%HEIGHT][(js + j + WIDTH)%WIDTH])
                }
            }
            if(oldmap[i][j] >= TYPES.length) continue
            let newtype = TYPES[oldmap[i][j]].check(nMap, [i, j])
            if (newtype == -1) newtype = oldmap[i][j]

            if(newtype != oldmap[i][j]){
                ctx.fillStyle = TYPES[newtype].color
                ctx.fillRect(j, i, 1, 1)
            }

            map[i][j] = newtype
        }
    }

    [map, oldmap] = [oldmap, map]
}



document.getElementById('canvas').onclick = function(e) {
    // e = Mouse click event.

    var rect = e.target.getBoundingClientRect();
    var x = Math.floor((e.clientX - rect.left) / (rect.width / WIDTH)); //x position within the element.
    var y = Math.floor((e.clientY - rect.top) / (rect.height / HEIGHT));  //y position within the element.

    oldmap[y][x] = selected

    const canvas = e.target;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = TYPES[selected].color;
    ctx.fillRect(x, y, 1, 1)
}

function update(){
    applyParsing(editor.getValue());
    let sel = document.getElementById('selection');
    let seld = document.getElementById('selectdefault');
    sel.innerHTML = ''
    seld.innerHTML = ''
    sel.onchange = (event) => {
        selected = Number(event.target.value);
    }
    seld.onchange = (event) => {
        DEFAULTCELLTYPE = Number(event.target.value);
    }
    for(let i = 0; i < TYPES.length; i++){
        sel.innerHTML += `<option value=${i}>${TYPES[i].name}</option>`
        seld.innerHTML += `<option value=${i}>${TYPES[i].name}</option>`
    }
}

let selectedexample = 0
function setupExampleLoader(){
    let esel = document.getElementById('examples')
    esel.onchange = (event) => {
        selectedexample = Number(event.target.value);
    }
}

function loadExample(){
    switch(Number(selectedexample)){
        case 0:
            editor.setValue(`element Live {
    color #aeaebb;

    rules {
        ifnot [2..3] Live at DIR.ANY => Dead;
    }
}

element Dead {
    color #161616;

    rules {
        if 3 Live at DIR.ANY => Live;
    }
}`)
            update();
            for(let i = 0; i < TYPES.length; i++){
                if(TYPES[i].name == "Live") {
                    selected = i
                }
                if(TYPES[i].name == "Dead") {
                    DEFAULTCELLTYPE = i
                }
            }
            break;

        case 1:
            editor.setValue(`element _Empty {
    color #000000;
}


element Wire {
    color #aeaeae;
    
    rules {
        if [1..2] Charge at DIR.ANY => Charge;
    }
}

element Charge {
    color #aeae56;
    
    rules {
        => ChargeTrace;
    }
}

element ChargeTrace {
    color #ae56ae;
    
    rules {
        => Wire;
    }
}`)
            update();
            for(let i = 0; i < TYPES.length; i++){
                if(TYPES[i].name == "Wire") selected = i
                if(TYPES[i].name == "_Empty") DEFAULTCELLTYPE = i
            }
            break;
    }

    
    document.getElementById('selection').value = selected
    document.getElementById('selectdefault').value = DEFAULTCELLTYPE
    
    var rect = document.getElementById('canvas').getBoundingClientRect();
    for(let i = 0; i < HEIGHT; i++){
        for(let j = 0; j < WIDTH; j++){
            oldmap[i][j] = DEFAULTCELLTYPE
            ctx.fillStyle = TYPES[DEFAULTCELLTYPE].color;
            ctx.fillRect(i, j, 1, 1)
        }
    }
}
