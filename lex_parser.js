const fs = require('fs');
const colors = require('colors');
const express = require('express');
const Lex = require('./lex');
const data = fs.readFileSync('./lex_grammar.txt', 'utf-8').split('\r\n');
const input = fs.readFileSync('./input.cc', 'utf-8').split('\r\n');
// const input = fs.readFileSync('./input1.cc', 'utf-8').split('\r\n');
const space = " ";
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
flag = 0;
test.transDFA();
for (let row = 0; row < input.length; row++) {
    if (input[row].length < 1) {
        continue;
    }
    else {
        let r = row + 1;
        try{
            test.getToken(input[row], r);
        }
        catch (err) {
            flag = 1;
            console.log('row:%s col:%s error:%s'.red, err.row, err.col, err.err);
            break;
        }
    }
}

if (flag === 0) {
    if (fs.existsSync('./lex_out.txt')) {
        fs.unlinkSync('./lex_out.txt');
    }
    if (fs.existsSync('./out.txt')) {
        fs.unlinkSync('./out.txt');
    }
    let option = {encoding: 'utf-8'};
    for (let i in test.tokens) {
        let element = test.tokens[i];
        let token = element.row + ':' + element.col + space + element.property + space + element.value  + '\r\n';
        fs.appendFileSync('./lex_out.txt', token, option);
        fs.appendFileSync('./out.txt', element.property + '\r\n', option);
        if (element.property === ';') fs.appendFileSync('./out.txt', '#' + '\r\n', option);
    }
    fs.appendFileSync('./out.txt', '#', option);
}
let app = new express();
app.get('/nfa', (req, res) => res.send(test.nfa));
app.get('/', (req, res) => res.send(test.dfa));
app.listen(3000, (req, res) => console.log('lex_parse is finish!'));
