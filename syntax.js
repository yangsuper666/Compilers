const colors = require('colors');
function Syntax(){
    this.vn = new Set();   // 记录非终结符
    this.vt = new Set();   // 记录终结符
    this.v = new Set();  
    this.firstSet = {};    // first集合
    this.exp = [];
    this.exp_dic = {}; // 文法产生式
    this.projectSet = [];  // 项目集族
    let src = {index : 0, pos : 0, fro : new Set(['#']), length : 1}; // 初始项
    // 读取文法
    this.readSyn = function(grammer, index){
        let noterminate = grammer.split(':')[0];
        this.vn.add(noterminate);
        let production = grammer.split(':')[1].split(' ');
        for (let i in production) {
            this.v.add(production[i]);
        }
        this.v.add(noterminate);
        if (!this.exp_dic.hasOwnProperty(noterminate)) {
            this.exp_dic[noterminate] = [];
        }
        this.exp_dic[noterminate].push([production, index]);
        this.exp.push([noterminate, production]);
    }

    // 获取终结符和非终结符
    this.getVn_Vt = function(){
        // 求差集
        this.vt = new Set([... this.v].filter(v => !this.vn.has(v)));
        this.vt.forEach(vt => this.firstSet[vt] = new Set([vt]));
    }

    // 求出First集
    this.getFirstSet = function(v, all){
        if (this.firstSet.hasOwnProperty(v)) {
            return this.firstSet[v];
        }
        all.add(v);
        let first = new Set();
        for (let i = 0; i < this.exp_dic[v].length; i++) {
            for (let j = 0; j < this.exp_dic[v][i][0].length; j++) {
                let element = this.exp_dic[v][i][0][j];
                if (all.has(element)) {
                    continue;
                }
                let tempSet = new Set();
                if (this.firstSet.hasOwnProperty(element)) {
                    tempSet = this.firstSet[element];
                }
                else {
                    tempSet = this.getFirstSet(element, all);
                }
                first = new Set([... first, ... tempSet]);
                if (!tempSet.has('$')) {
                    break;
                }
            }
        }
        return first;
    }
    
    //判断两个项目集是否相同
    isEqual = function(){

    }

    // 判断项目集有无相同项目
    isInPro = function(){

    }

    // 判断项目集族中有无相同项目集
    isInProSet = function(){
        
    }

    // 求出first(βa)
    getExtend = function(exp, first, node){
        if ((node.pos + 1) === node.length) {
            return node.fro;
        }
        let front = new Set();
        for (let i = node.pos + 1; i < exp[1].length; i++){
            let tempSet = first[exp[1][i]];
            front = new Set([... front, ... tempSet]);
            if (!tempSet.has('$')) {
                front.delete('$');
                return front;
            }
        }
        front = new Set([... front, ... node.fro]);
        return front;
    }

    // 求出项目集闭包
    getClosure = function(item, par){
        let closure = [];
        closure.push(item);
        let i = 0;
        while (i < closure.length) {
            let exp_id = closure[i].index;
            let exp_pos = closure[i].pos;
            let target = par.exp[exp_id][1][exp_pos];
            if (par.vt.has(target)) {
                i++;
                continue;
            }
            let front = getExtend(par.exp[exp_id], par.firstSet, closure[i]);
            for (let j in par.exp_dic[target]) {
                let node_id = parseInt(par.exp_dic[target][j][1]);
                let length = par.exp_dic[target][j][0].length;
                closure.push({
                    index :node_id,
                    pos : 0,
                    fro : front,
                    length : length
                });
            }
            i++;
        }
        // console.log(closure);
        return closure;
    }

    // 构造action和goto表
    this.getSyntaxDFA = function(){
        let tempSet = [];
        tempSet.push({
            set: getClosure(src, this),
            // add others info
        });
        let i = 0, count = 0;
        while (i < tempSet.length) {
            let item = tempSet[i]['set'];
            for (let j in item) {
                if (item[j].pos >= item[j].length) {
                    continue;
                }
                let nextpos = item[j].pos + 1;
                let tempItem = {
                    index: item[j].index,
                    pos: nextpos, 
                    fro: item[j].fro, 
                    length: item[j].length
                };
                tempSet.push({
                   set: getClosure(tempItem, this)
                });
                count++;
                if (!tempSet[i].hasOwnProperty('next')) {
                    tempSet[i]['next'] = {};
                }
                edge = this.exp[tempItem.index][1][nextpos - 1];
                tempSet[i]['next'][edge] = count;
            }
            i++;
        }  
        this.projectSet = tempSet;
    }
}
module.exports = Syntax;