const Lex = require('./lex');
const fs = require('fs');
const colors = require('colors');
const data = fs.readFileSync('./lex_grammer.txt', 'utf-8').split('\r\n');
//let data = fs.readFileSync('./test_grammer.txt', 'utf-8').split('\r\n');
const input = fs.readFileSync('./input.pas', 'utf-8').split('\r\n');
const express = require('express');
let test = new Lex();
let grammer = [];
let keyword = new Set();
let type = new Set();
let endname = '';
let flag = 0;
for (let index in data) {
    if (flag === 0) {
        if (data[index].length > 0) {
            if (data[index] === '@keyword') {
                flag = 1;
                continue;
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
    if (flag === 1) {
        if (data[index] === '@type') {
            flag = 2;
            continue;
        }
        if (data[index].length > 0) {
            keyword.add(data[index]);
        }
        else {
            test.setKeyword(keyword);
        }
    }   

    if (flag === 2) {
        if (data[index].length > 0) {
            type.add(data[index]);
        }
        else {
            test.setType(type);
        }       
    }
}
test.transDFA();
for (let row = 0; row < input.length; row++) {
    if (input[row].length < 1) {
        continue;
    }
    else {
        let r = row + 1
        test.getToken(input[row], r);
    }
}
for (let e in test.tokens) {
    console.log(test.tokens[e].value);
}
let app = new express();

app.get('/', function(req, res){
    res.send(test.tokens);
});

app.listen(3000, function(req, res){
    console.log('app is running at port 3000'.blue);
});
