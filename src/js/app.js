(function($, W) {
    'use strict';

    // 地址卡片
    var locCard = function(data) {
        // 对象浅复制
        Object.assign(this, data || {});
        // 是否可见
        this.visible = ko.observable(true);
        // 是否选中
        this.active = ko.observable(false);

        // 卡片点击事件
        this.onClick = function () {
            this.active( !this.active() );
            this.active() ? W.googleMap.closeAllInfoWindow(), google.maps.event.trigger(this.marker, 'click') :
                google.maps.event.trigger(this.infowindow, 'closeclick');
        };
    };


    // 搜索的ViewModel
    var serachViewModel = function() {        
        // 检索词 去抖 300ms
        this.keyword = ko.observable('').extend({ rateLimit: 300 });

        // 用于绑定地址信息
        this.locations = ko.observableArray();
        
        // 动态添加地址卡片，堆栈式填入
        this.addCard = function(data) {
            this.locations.unshift(new locCard(data));
            return this.locations()[0];
        };

        // 筛选出匹配的结果 pureComputed 避免多次运算
        this.getMatchLoc = ko.pureComputed(function() {
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