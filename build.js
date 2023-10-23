let interval = null

const TOKENTYPE = {
    KEYWORD: 1,
    IDENTIFIER: 2,
    NUMBER: 3,
    RANGE: 4,
    LEFTBRACE: 5,
    RIGHTBRACE: 6,
    DIRECTION: 7,
    COLOR: 8,
    SEMICOLON: 9,
}
const keywords = ["element", "=>", "if", "color", "rules", "DIR", "ifnot", "at"]
const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'UPRIGHT', 'RIGHTUP', 'UPLEFT', 'LEFTUP', 'DOWNRIGHT', 'RIGHTDOWN', 'DOWNLEFT',
                    'LEFTDOWN', 'ALL', 'ANY', 'VERTICAL', 'HORISONTAL', 'CROSS', 'PLUS', 'X']
const directionints = [0b01000000, 0b00000010, 0b00001000, 0b00010000, 
                        0b00100000, 0b00100000, 0b10000000, 0b10000000, 
                        0b00000001, 0b00000001, 0b00000100, 0b00000100, 
                        0b11111111, 0b11111111, 0b01000010, 0b00011000, 
                        0b10100101, 0b01011010, 0b10100101, ]

function Tokenize(source){
    let buffer = ""

    let tokens = []

    for(let i = 0; i < source.length; i++){
        if(/[A-Za-z_]/.test(source[i])){
            while(/[A-Za-z0-9_]/.test(source[i])){
                if(source[i] == undefined) break
                buffer += source[i]
                i++
            }
            i--
            if(keywords.includes(buffer)){
                if(buffer == "DIR"){
                    let val = ""
                    i += 2
                    while(/[A-Za-z0-9_]/.test(source[i])){
                        if(source[i] == undefined) break
                        val += source[i]
                        i++
                    }
                    i--
                    if(directions.includes(val)){
                        let value = directionints[directions.indexOf(val)]
                        tokens.push({type: TOKENTYPE.DIRECTION, value: value})
                    }else{throw `Expected a valid direction, got '${val}'`}
                }
                else tokens.push({type: TOKENTYPE.KEYWORD, value: buffer})
            }else(
                tokens.push({type: TOKENTYPE.IDENTIFIER, value: buffer})
            )
            buffer = ""
        }
        else if(/[0-9]/.test(source[i])){
            while(/[A-Za-z0-9_]/.test(source[i])){
                if(source[i] == undefined) break
                buffer += source[i]
                i++
            }
            i--
            tokens.push({type: TOKENTYPE.NUMBER, value: Number(buffer)})
            buffer = ""
        }
        else if(source[i] == "["){
            while(source[i] != "]"){
                if(source[i] == undefined){
                    throw "Expected ] after opening a range"
                }
                buffer += source[i]
                i++
            }
            buffer += source[i]

            if(/\[[0-9]+\.\.[0-9]\]/.test(buffer)){
                let val = buffer.slice(1, -1).replace("..", ".").split(".")
                tokens.push({type: TOKENTYPE.RANGE, value: Number(val[0]), othervalue: Number(val[1])})
            }else throw `Incorrect definition of range ${buffer}, expected [A..B]`
            buffer = ""
        }
        else if(source[i] == "{"){
            tokens.push({type: TOKENTYPE.LEFTBRACE})
        }
        else if(source[i] == "}"){
            tokens.push({type: TOKENTYPE.RIGHTBRACE})
        }else if(source[i] == "#"){
            while(/[A-Za-z0-9#]/.test(source[i])){
                if(source[i] == undefined) break
                buffer += source[i]
                i++
            }
            i--
            tokens.push({type: TOKENTYPE.COLOR, value: buffer})
            buffer = ""
        }else if(source[i] == "="){
            if(source[i+1] == ">"){
                tokens.push({type: TOKENTYPE.KEYWORD, value: "become"})
            }else{
                throw `Unexpected '=', did you mean '=>'?`
            }
        }else if(source[i] == ";"){
            tokens.push({type: TOKENTYPE.SEMICOLON})
        }
    }

    return tokens
}

function preParse(tokens){
    let elements = []
    for(let i = 0; i < tokens.length; i++){
        if(tokens[i].type == TOKENTYPE.KEYWORD){
            if(tokens[i+1] == undefined | tokens[i+1].value == undefined) continue
            if(tokens[i].value == "element"){
                if(tokens[i+1].type == TOKENTYPE.IDENTIFIER){
                    if(elements.includes(tokens[i+1].value)){
                        throw `Cannot redefine element ${tokens[i+1].value} token #${i+1}`
                    }
                    elements.push(tokens[i+1].value)

                }else if(tokens[i+1].type == TOKENTYPE.KEYWORD){
                    throw `Cannot use keyword '${tokens[i+1].value}' as element name`
                }
            }
        }
    }

    return elements.sort()
}

/*
parser => [...elements]
element parser => element
rules parser => [...rules]
rule parser => rule
*/

function parseElements(tokens, names){
    let elements = []

    let i = 0
    for(i = 0; i < tokens.length; i++){
        if(tokens[i].type == TOKENTYPE.KEYWORD & tokens[i].value == "element"){
            if(tokens[i+1].type == TOKENTYPE.IDENTIFIER){
                if(tokens[i+2].type == TOKENTYPE.LEFTBRACE){
                    let brace = 1
                    let p = i+3
                    while (brace > 0){
                        if(tokens[p].type == TOKENTYPE.LEFTBRACE){
                            brace++
                        }if(tokens[p].type == TOKENTYPE.RIGHTBRACE){
                            brace--
                        }
                        p++
                    }
                    p--
                    elements.push(parseElement(tokens.slice(i, p), names))
                }
            }
        }
    }

    return elements
}
function parseElement(tokens, names){
    let name = tokens[1].value
    let color = "#000000"
    let rules = []
    for(let i = 2; i < tokens.length; i++){
        if(tokens[i].type == TOKENTYPE.KEYWORD & tokens[i].value == "color"){
            if(tokens[i+1].type == TOKENTYPE.COLOR){
                color = tokens[i+1].value
            }
            if(!tokens[i+2].type == TOKENTYPE.SEMICOLON){
                throw `Expected a semicolon after declaring a statement, token ${i + 1}`
            }
            i += 2
        }

        if(tokens[i].type == TOKENTYPE.KEYWORD & tokens[i].value == "rules"){
            if(tokens[i+1].type == TOKENTYPE.LEFTBRACE){
                let brace = 1
                let p = i+3
                while (brace > 0){
                    if(tokens[p].type == TOKENTYPE.LEFTBRACE){
                        brace++
                    }if(tokens[p].type == TOKENTYPE.RIGHTBRACE){
                        brace--
                    }
                    p++
                }
                rules.push(...parseRules(tokens.slice(i, p), names))
            }
        }
    }

    return new Element(color, name, rules)
}

function parseRules(tokens, names){
    let rules = []
    for(let i = 0; i < tokens.length; i++){
        if(tokens[i].type == TOKENTYPE.KEYWORD & (tokens[i].value == "if" | tokens[i].value == "ifnot")){
            let s = i
            while(true){
                if(tokens[i] == undefined) break
                if(tokens[i].type == TOKENTYPE.LEFTBRACE){
                    let brace = 1
                    let p = s+1
                    while (brace > 0){
                        if(tokens[p] == undefined){break}
                        if(tokens[p].type == TOKENTYPE.LEFTBRACE){
                            brace++
                        }if(tokens[p].type == TOKENTYPE.RIGHTBRACE){
                            brace--
                        }
                        p++
                    }
                    p--
                    rules.push(parseRuleSimple(tokens.slice(i, p), names))
                    i+=p
                    break
                }else if(tokens[i].type == TOKENTYPE.SEMICOLON){
                    rules.push(parseRuleSimple(tokens.slice(s, i), names))
                    break
                }
                i++
            }
        }
        else if(tokens[i].type == TOKENTYPE.KEYWORD & tokens[i].value == "become"){
            if(tokens[i+1].type == TOKENTYPE.IDENTIFIER & names.includes(tokens[i+1].value)){
                rules.push(new RuleAction(names.indexOf(tokens[i+1].value)))
            }
        }
    }
    return rules
}

function parseRuleSimple(tokens, names){
    let reverse = false
    if(tokens[0].value == "ifnot"){
        reverse = true
    }
    let min = -1
    let max = -1

    let type = -1

    let checkmap = 255

    let s = 0

    if(tokens[1].type == TOKENTYPE.NUMBER){
        min = tokens[1].value
        max = tokens[1].value
    }else if(tokens[1].type == TOKENTYPE.RANGE){
        min = tokens[1].value
        max = tokens[1].othervalue
    }else if(tokens[1].type == TOKENTYPE.IDENTIFIER){
        min = -1
        max = 9
        type = names.indexOf(tokens[1].value)
        s = 1
    }else{throw `Expected a valid condition`}

    if(s == 0){
        if(tokens[2-s].type == TOKENTYPE.IDENTIFIER & names.includes(tokens[2-s].value)){
            type = names.indexOf(tokens[2-s].value)
        }else{throw `Expected a valid condition`}
    }

    if(!(tokens[3-s].type == TOKENTYPE.KEYWORD & tokens[3-s].value == "at")){throw `Expected a valid condition, got '${tokens[3-s].value}' #${3-s}`}

    if(tokens[4-s].type == TOKENTYPE.NUMBER){
        checkmap = tokens[4-s].value
    }else if(tokens[4-s].type == TOKENTYPE.DIRECTION){
        checkmap = tokens[4-s].value
    }

    let result = null

    if(tokens[5-s].type == TOKENTYPE.KEYWORD & tokens[5-s].value == "become"){
        if(tokens[6-s].type == TOKENTYPE.IDENTIFIER){
            result = new RuleSimple(type, min, max, names.indexOf(tokens[6-s].value), checkmap, reverse)
        }
    }else if(tokens[5-s].type == TOKENTYPE.LEFTBRACE){

        if(tokens[6-s].type == TOKENTYPE.KEYWORD & tokens[6-s].value == "become"){
            if(tokens[7-s].type == TOKENTYPE.IDENTIFIER){
                result = new RuleSimple(type, min, max, names.indexOf(tokens[7-s].value), checkmap, reverse)
            }
        }else{
            let brace = 1
            let p = 5-s
            while (brace > 0){
                if(tokens[p] == undefined) break
                if(tokens[p].type == TOKENTYPE.LEFTBRACE){
                    brace++
                }if(tokens[p].type == TOKENTYPE.RIGHTBRACE){
                    brace--
                }
                p++
            }
            result = new RuleSimple(type, min, max, parseRules(tokens.slice(6-s, p), names), checkmap, reverse)
        }
    }
    return result
}

function Parse(raw){
    let tokens = Tokenize(raw)
    let names = preParse(tokens)
    let elements = parseElements(tokens, names.sort((a, b) => a.localeCompare(b)))

    elements.sort((a, b) => a.name.localeCompare(b.name))

    return elements
}

function applyParsing(raw){
    TYPES = Parse(raw)

    prepare()
}