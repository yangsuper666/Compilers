const colors = require('colors');
function Syntax(){
    this.vn = new Set();   // 记录非终结符
    this.vt = new Set();   // 记录终结符
    this.v = new Set();  
    this.firstSet = {};    // first集合
    this.exp = [];      
    this.exp_dic = {};     // 文法产生式
    this.projectSet = [];  // 项目集族
    let src = {index : 0, pos : 0, fro : new Set(['#']), length : 1};  // 初始项
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
    
    //hash项目
    hashSet = function(item){
        let hash = '';
        hash = item.index + '&' + item.pos + '&(';
        Array.from(item.fro).sort().forEach(value => hash = hash + '[' + value + ']');
        hash = hash + ')&' + item.length;
        return hash;
    }

    // 判断项目集有无相同项目
    isInPro = function(closure, item){
        for (let i in closure) {
            if (closure[i].hash === item.hash) {
                return true;
            }
        }
        return false;
    }

    // 判断项目集族中有无相同项目集
    isInProSet = function(proSet, temp){
        for (let i in proSet) {
            let flag = 0;
            if (temp.length === proSet[i]['set'].length) {
                for (let j in temp) {
                    if (proSet[i]['set'][j].hash !== temp[j].hash){
                        flag = 1;
                        break;
                    }
                }
                if (flag === 0) {
                    return i;
                }
            }
            else continue;
        }
        return -1;
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
            // console.log(front);
            for (let j in par.exp_dic[target]) {
                let node_id = parseInt(par.exp_dic[target][j][1]);
                let length = par.exp_dic[target][j][0].length;
                let tempItem = {index :node_id, pos : 0, fro : front, length : length};
                let hash = hashSet(tempItem);
                tempItem['hash'] = hash;
                if (!isInPro(closure, tempItem)){
                    closure.push(tempItem);
                }
            }
            i++;
        }
        // console.log(closure);
        return closure;
    }
    
    // 构造action和goto表
    this.getSyntaxDFA = function(){
        let tempSet = [];
        let hash = hashSet(src);
        src['hash'] = hash;
        tempSet.push({id : 0, set: getClosure(src, this)});
        let i = 0, countId = 0;
        while (i < tempSet.length) {
            // console.log(tempSet[i]);
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
                let hash = hashSet(tempItem);
                tempItem['hash'] = hash;
                let set_clo = getClosure(tempItem, this);
                if (!tempSet[i].hasOwnProperty('next')) {
                    tempSet[i]['next'] = {};
                }
                let edge = this.exp[tempItem.index][1][nextpos - 1];
                if (!tempSet[i]['next'].hasOwnProperty(edge)) {
                    tempSet[i]['next'][edge] = [];
                }                
                // 判断是否生成重复项目集族
                // console.log('tem',tempSet);
                // console.log('set_clo',set_clo);
                let sameSetId = isInProSet(tempSet, set_clo);
                if (sameSetId < 0) {
                    countId++;
                    let temp = {id: countId, set: set_clo};
                    tempSet.push(temp);
                    tempSet[i]['next'][edge].push(parseInt(countId));
                }
                else {
                    tempSet[i]['next'][edge].push(parseInt(sameSetId));
                }
            }
            i++;
        }  
        tempSet.forEach(value => {
            if (!value.hasOwnProperty('next')) {
                value['isacc'] = true;
            }
            else {
                value['isacc'] = false;
            }
        });
        this.projectSet = tempSet;
    }
}
module.exports = Syntax;