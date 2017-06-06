(function($, W) {
    'use strict';

    // 当前 actvie 的 LocMode
    var currentLoc = null;

    // 地址模型
    var locMode = function(data) {
        // 对象浅复制
        Object.assign(this, data || {});
        // 是否可见
        this.visible = ko.observable(true);
        // 是否选中
        this.active = ko.observable(false);
        // 设置当前 locMode 为 active，只能存在一个active的模型
        this.onActive = function() {
            currentLoc && currentLoc.offActive();
            this.active(true);
            currentLoc = this;
            this.marker.onActive.call(this);
        };
        // 取消当前 locMode active
        this.offActive = function() {
            this.active(false);
            currentLoc = null;
            this.marker.offActive.call(this);
        };
        // 点击模型
        this.onClick = function () {
            this.active() ? this.offActive() : this.onActive();
        };
    };

    // 搜索的ViewModel
    var serachViewModel = function() {
        // 检索词 节流 300ms
        this.keyword = ko.observable('').extend({ rateLimit: 300 });
        // 用于绑定地址信息
        this.locations = ko.observableArray([]);

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
            currentLoc && currentLoc.offActive();

            var keyword = $.trim(this.keyword()),
                locModes = this.locations();
            this.locations( locModes.map(function(loc) {
                // 是否匹配关键词，如果关键词为空默认都匹配
                var isMatch = keyword === '' ? true : loc.cname.indexOf(keyword) > -1;
                loc.visible(isMatch);
                loc.marker.setVisible(isMatch);
                return loc;
            }) );

            return this.locations();
        }, this);


        /*function debounce(context, fn) {
            fn.timeout && clearTimeout(fn.timeout);
            fn.timeout = setTimeout(fn.bind(context), 1000);
        }*/ 
    }
    // 实例化并抛出全局变量
    W.searchVM = new serachViewModel();
    ko.applyBindings(W.searchVM);
})($, window);
