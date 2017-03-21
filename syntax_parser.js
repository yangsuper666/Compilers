const fs = require('fs');
const color = require('colors');
const express = require('express');
const Syntax = require('./syntax.js');
const data = fs.readFileSync('./syn_example.txt', 'utf-8').split('\r\n');
const test = new Syntax();
// 读取语法文法
for (let i in data) {
    if (data[i].length > 0){
        test.readSyn(data[i], i);
    }
}
// 获得终结符和非终结符
test.getVn_Vt();
// 求出每个非终结符的first集
for(let vn of test.vn.values()){
    test.firstSet[vn] = test.getFirstSet(vn, new Set());
}
test.getSyntaxDFA();
// console.log(test.exp);
// console.log(test.firstSet);
let app = new express();
app.get('/', (req, res) => res.send(test.projectSet));
app.listen(3000, (req, res) => console.log('syntax is running...'));