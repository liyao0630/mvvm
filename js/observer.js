function Observer(data) {
    this.data = data;
    this.walk(data);  //
}

Observer.prototype = {
    walk: function(data) {
        var me = this;
        Object.keys(data).forEach(function(key) {
            me.convert(key, data[key]); //传入key，和key的值
        });
    },
    convert: function(key, val) {
        this.defineReactive(this.data, key, val); //vm实例的data，key，key的值
    },

    defineReactive: function(data, key, val) { //vm实例的data，key，key的值
        // get的dep是订阅器
        // watcher是监听者
        // set是发布者通知监听发生了改变
        var dep = new Dep();  
        // 只有数据初始化时，才会创建Dep的实例对象,每次调用全局的uid会++保证id值不会重复
        // 在每个访问器属性里使用dep形成闭包对dep进行保留
        var childObj = observe(val); // observe判断val是不是对象，如果是对象再次调用Observer构造函数添加拦截

        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function() {
                // 在compile的普通指令中会创建watcher并传入回调
                // 回调的方法是compile中的updata.[dir + 'Updater']方法
                // 此时全局的Dep.target是创建的watcher实例对象
                if (Dep.target) {
                    //dep.depend会调用Dep.target(watcher实例对象)的addDep方法并且传入dep的this(Dep实例对象)
                    dep.depend();  
                }
                return val;
            },
            set: function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    if (!value || typeof value !== 'object') {
        return;
    }

    return new Observer(value);
};


var uid = 0;

function Dep() {
    this.id = uid++;
    // 在compile的普通指令中会创建watcher并传入回调
    // 回调的方法是compile中的updata.[dir + 'Updater']方法
    // subs是当前数据的watcher实例对象集合
    this.subs = [];
}

Dep.prototype = {
    addSub: function(sub) {
        // watcher的addDep调用传入Dep实例对象的addSub,传入sub
        // sub是watcher实例对象
        this.subs.push(sub);
    },

    depend: function() {
        // 调用Dep.target(watcher实例对象)的addDep方法并且传入dep(Dep实例对象)
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {
        this.subs.forEach(function(sub) {
            //sub是watcher实例对象
            sub.update();
        });
    }
};

Dep.target = null;