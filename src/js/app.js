(function($, W) {
    'use strict';

    // 当前 actvie 的 card
    var currentCard = ko.observable('');

    // 地址卡片
    var locCard = function(data) {
        // 对象浅复制
        Object.assign(this, data || {});
        // 是否可见
        this.visible = ko.observable(true);
        // 是否选中
        this.active = ko.observable(false);
        // 设置当前card 为 active，只能存在一个active的卡片
        this.onActive = function() {
            if (currentCard()) currentCard().offActive();
            this.active(true);
            currentCard(this);
            this.marker.onActive.call(this);
        };
        // 取消当前card active
        this.offActive = function() {
            this.active(false);
            currentCard('');
            this.marker.offActive.call(this);
        };
        // 点击卡片
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

        // 批量添加地址卡片 业务逻辑上，出现的绝大部分是一组地点，而且批量添加可以避免 getMatchLoc 重复触发
        // bindEvent 回掉要执行的事件
        this.addCards = function(data, bindEvent) {
            var cards = data.map(function(e) {
                var card = new locCard(e);
                bindEvent && typeof bindEvent === 'function' && bindEvent(card);
                return card;
            });
            this.locations(this.locations().concat(cards));
        };

        // 筛选出匹配的结果 pureComputed 避免多次运算
        // 加去抖处理
        this.getMatchLoc = ko.pureComputed(function() {
            console.log('getMatchLoc');
            var keyword = $.trim(this.keyword()),
                locCards = this.locations();

            this.locations( locCards.map(function(loc) {
                // 是否匹配关键词 关键词为空，默认都匹配
                var isMatch = keyword === '' ? true : loc.cname.indexOf(keyword) > -1;
                loc.visible(isMatch);
                loc.marker.setVisible(isMatch);
                return loc;
            }) );

            return this.locations();
        }, this);
    }

    W.searchVM = new serachViewModel();
    ko.applyBindings(W.searchVM);
})($, window);
