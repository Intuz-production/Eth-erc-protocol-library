const chalk = require('chalk');

module.exports.consoleSeparate = (str, color) => {
    let output = "\n" + str + "\n";
    let print = (color) ? chalk[color](output) : output;
    console.log(print);
}

module.exports.consoleBox = (str, color) => {
    let col = process.stdout.columns;
    let colwriteable = col - 6;
    str = str.toString();
    let finalstr = "";
    let len = str.length;
    let len2 = ((len+6)<=col) ? len : col-6;
    let _1line = " ----";
    let _2line = "\n|    ";
    let _3line = "\n|    ";
    let _4line = " ----";
    if(colwriteable>=(len-6)) {
        finalstr = "|  " + str + "  |";
    } else {
        for(let i=1;i<=Math.ceil(len/colwriteable);i++) {
            if(i>1) finalstr += "\n";
            let substr = str.substr(((i-1)*colwriteable), colwriteable)
            if(substr.length!=colwriteable) {
                let till = colwriteable-substr.length
                for(let j=0;j<till;j++) substr += " ";
            }
            finalstr += "|  " + substr + "  |";
        }
    }
    
    for (var i = 0; i < len2; i++) {
        _1line += "-";
        _2line += " ";
        _3line += " ";
        _4line += "-"
    }
    _2line += "|\n";
    _3line += "|\n";
    let output = _1line + _2line + finalstr + _3line + _4line;
    let print = (color) ? chalk[color](output) : output;
    console.log(print);
}