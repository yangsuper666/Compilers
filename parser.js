const Lex = require('./lex');
const fs = require('fs');
const colors = require('colors');
//const data = fs.readFileSync('./lex_grammer.txt', 'utf-8').split('\r\n');
const data = fs.readFileSync('./test_grammer.txt', 'utf-8').split('\r\n');
const express = require('express');
let test = new Lex();
let grammer = [];
let endname = '';
for(let index in data) {
    if (data[index].length > 0) {
        if (data[index] === '@keyword') {
            break;
        }
        if (data[index][0] === '@') {
            endname = data[index].slice(1);
           // console.log('endname :'.grey, endname);
        }
        else {
            grammer.push(data[index]);
        }
    }
    else {
        test.transNFA(grammer, endname);
        grammer = [];
        endname = '';
    }
}
//console.log(test.vt);
//test.log();
test.transDFA();
console.log(test.dfa);
let app = new express();

app.get('/', function(req, res){
    let nfa = test['nfa'];
    res.send(nfa);
});

app.listen(3000, function(req, res){
    console.log('app is running at port 3000'.blue);
});
