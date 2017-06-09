(function($, W) {
    'use strict';

    // 当前 actvie 的 LocMode
    var currentLoc = null;

    // 地址模型
    var locMode = function (data) {
        // 对象浅复制
        Object.assign(this, data || {});
        // 是否选中
        this.active = ko.observable(false);
        // 设置当前 locMode 为 active，只能存在一个active的模型
        this.onActive = function() {
            currentLoc && currentLoc.offActive();
            this.active(true);
            this.marker.onActive.call(this);
            currentLoc = this;
        };
        // 取消当前 locMode active
        this.offActive = function() {
            this.active(false);
            this.marker.offActive.call(this);
            currentLoc = null;
        };
        // 点击模型
        this.onClick = function () {
            this.active() ? this.offActive() : this.onActive();
        };
    };

    // 为字符串添加去除所有空格的方法
    String.prototype.trimAll= function() {
        return this.replace(/\s+/g, '');
    };

    // 搜索的ViewModel
    var serachViewModel = function() {
        // 检索词 节流 300ms
        this.keyword = ko.observable('').extend({ rateLimit: 300 });
        // 缓存所有的地址信息
        this.locations = ko.observableArray([]);
        // 是否有匹配的结果
        this.noMatch = ko.observable(false);

        // 批量添加地址模型 业务逻辑上，出现的绝大部分是一组地点，而且批量添加可以避免 getMatchLoc 重复触发
        this.addLocModes = function(data, bindEvent) {
            var modes = data.map(function(e) {
                var mode = new locMode(e);
                bindEvent && typeof bindEvent === 'function' && bindEvent(mode);
                return mode;
            });
            this.locations(this.locations().concat(modes));
        };

        // 筛选出匹配的结果 pureComputed 避免多次运算 
        this.getMatchLoc = ko.pureComputed(function() {
            // 取消激活的地址模型
            currentLoc && currentLoc.offActive();

            var keyword = this.keyword().toString().trimAll(),
                locModes = this.locations(),
                matchs = [];
            locModes.map(function(loc) {
                // 是否匹配关键词，如果关键词为空默认都匹配，都清除空格后再匹配
                var isMatch = ( 
                    keyword === '' || 
                    loc.name.trimAll().indexOf(keyword) > -1
                );
                loc.marker.setVisible(isMatch);
                isMatch && matchs.push(loc);
            });
            matchs.length ? this.noMatch(false) : this.noMatch(true);
            return matchs;
            // notifyWhenChangesStop 去抖用，500ms内不改变才触发
        }, this).extend({ rateLimit: { timeout: 300, method: "notifyWhenChangesStop" } });
    }

    // 实例化并抛出全局变量，方便地图调用
    W.searchVM = new serachViewModel();
    ko.applyBindings(W.searchVM);
})($, window);
