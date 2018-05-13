function Watcher(vm, expOrFn, cb) { // vm实例对象， 指令值（普通指令是值）， 回调函数
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};

    if (typeof expOrFn === 'function') { // 指令值为函数
        this.getter = expOrFn;
    } else { // 指令值不是函数
        this.getter = this.parseGetter(expOrFn); // parseGetter返回一个闭包函数
    }
    this.value = this.get(); // 此时this.get的返回值是expOrFnd的value值
}

Watcher.prototype = {
    update: function() {
        this.run();
    },
    run: function() {
        var value = this.get(); // 返回值是expOrFnd的value值
        var oldVal = this.value;
        if (value !== oldVal) { // 值不同时调用传入的回调函数
            this.value = value;
            this.cb.call(this.vm, value, oldVal); 
        }
    },
    addDep: function(dep) {
        // 1. 每次调用run()的时候会触发相应属性的getter
        // getter里面会触发dep.depend()，继而触发这里的addDep
        // 2. 假如相应属性的dep.id已经在当前watcher的depIds里，说明不是一个新的属性，仅仅是改变了其值而已
        // 则不需要将当前watcher添加到该属性的dep里
        // 3. 假如相应属性是新的属性，则将当前watcher添加到新属性的dep里
        // 如通过 vm.child = {name: 'a'} 改变了 child.name 的值，child.name 就是个新属性
        // 则需要将当前watcher(child.name)加入到新的 child.name 的dep里
        // 因为此时 child.name 是个新值，之前的 setter、dep 都已经失效，如果不把 watcher 加入到新的 child.name 的dep中
        // 通过 child.name = xxx 赋值的时候，对应的 watcher 就收不到通知，等于失效了
        // 4. 每个子属性的watcher在添加到子属性的dep的同时，也会添加到父属性的dep
        // 监听子属性的同时监听父属性的变更，这样，父属性改变时，子属性的watcher也能收到通知进行update
        // 这一步是在 this.get() --> this.getVMVal() 里面完成，forEach时会从父级开始取值，间接调用了它的getter
        // 触发了addDep(), 在整个forEach过程，当前wacher都会加入到每个父级过程属性的dep
        // 例如：当前watcher的是'child.child.name', 那么child, child.child, child.child.name这三个属性的dep都会加入当前watcher
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            // 往当前watcher实例对象添加数据的每个订阅器
            this.depIds[dep.id] = dep;
        }
    },
    get: function() {// 必须是数据绑定的指令，并且指令值不是函数才会到此函数
        // 设置Dep对象的target指向当前watcher实例
        Dep.target = this;
        // 调用getter函数：可能是传入的函数也可能是vm实例data的属性名
        // 如果是vm实例data的的属性名会有按下述执行
        // 事实上是调用this.parseGetter的闭包函数,闭包函数会访问this.vm.指令值
        // 因此访问了访问器属性，此时会调用访问器属性的get方法
        // get方法会根据此时的Dep的targer，添加监听
        var value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    },

    parseGetter: function(exp) {
        if (/[^\w.$]/.test(exp)) return; // ^非 \w 数字字母下划线

        var exps = exp.split('.');

        return function(obj) {
            for (var i = 0, len = exps.length; i < len; i++) {
                if (!obj) return;
                obj = obj[exps[i]];
            }
            return obj;
        }
    }
};