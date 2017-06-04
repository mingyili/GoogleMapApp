(function($, w) {
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
            console.log('card click', this.active());
            this.active( !this.active() );
            this.active() ? google.maps.event.trigger(this.marker, 'click') :
                google.maps.event.trigger(this.infowindow, 'closeclick');
        };
    };


    // 搜索的ViewModel
    var serachViewModel = function(defData) {        
        // 绑定
        this.locations = ko.observableArray();
        
        // 添加地址卡片
        this.addCard = function(data) {
            this.locations.unshift(new locCard(data));
            return this.locations()[0];
        };

        /*if (defData) {
            defData.map(this.addCard.bind(this));
        }*/
        
        // 检索词
        this.input = ko.observable('');
        
        // 输入即搜索，做去抖处理，停止输入300ms后才触发搜索
        this.searchTimer = null;
        this.onSearch = function() {
            if (this.searchTimer) {
                clearTimeout(this.searchTimer);
                this.searchTimer = null;
            }
            this.searchTimer = setTimeout(this.search.bind(this), 300);
        };

        // 设置地址卡片和地图标记是否展示
        var toggleLocCard = function(loc, isMatch) {
            loc.visible(isMatch);
            loc.marker.setVisible(isMatch);
            return loc;
        };
        
        // 筛选出匹配的结果
        this.search = function() {
            var input = $.trim( this.input() ),
                locCards = this.locations();

            if (!locCards.length) return;

            this.locations( locCards.map(function(loc) {
                return toggleLocCard(loc, input === '' ? true : loc.name.indexOf(input) > -1);
            }) );
        }; 

        // this.search.extend({ rateLimit: 300 });
    }

    w.searchVM = new serachViewModel(locationDatas);
    ko.applyBindings(w.searchVM);
})($, window);