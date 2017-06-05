(function($, W) {
    'use strict';

    // 默认地图中心定位为北京
    var def = {
            dom: document.getElementById('map'),
            center: {
                lat: 39.9087191,
                lng: 116.3952003
            }
        },
        iconBase = 'https://mingyili.github.io/assets/img/map/';

    var Map = function (opt) {
        this.opt = $.extend({}, def, opt);
        this.init();
    };

    Map.prototype = {
        init: function() {
            var opt = this.opt;
            this.map = new google.maps.Map(opt.dom, {
              center: opt.center,
              zoom: 13
            });
            // 初始化默认的地址
            if (opt.locations) {
                opt.locations.map(this.addMarker.bind(this));
            }
        },
        // 获取标记图标
        getMarkerIcon: function(type) {
            this.markerIcons = this.markerIcons || {};
            this.markerIcons[type] = this.markerIcons[type] || new google.maps.MarkerImage(iconBase + type + '.png');
            return this.markerIcons[type];
        },
        // 添加一个标记
        addMarker: function(data) {
            
            var defIcon = this.getMarkerIcon(data.type),
                hoverIcon = this.getMarkerIcon(data.type + '_hover');

            data.marker = new google.maps.Marker({
                position: data.location,
                title: data.cname,
                icon: defIcon,
                map: this.map,
                animation: google.maps.Animation.DROP
            });
            
            // 标签数据和地址卡片双向绑定，
            var locCard = W.searchVM.addCard(data),
                mapSelf = this;
            
            // 点击 marker 时候展示响应信息
            locCard.marker.addListener('click', function() {
                mapSelf.showInfoWinodw(locCard);
                this.setAnimation(google.maps.Animation.BOUNCE);
                locCard.active(true);
            });
            // 鼠标 hover 时改变图标颜色
            locCard.marker.addListener('mouseover', function() {
                this.setIcon(hoverIcon);
            });
            // 鼠标移出时复原
            locCard.marker.addListener('mouseout', function() {
                this.setIcon(defIcon);
            });
        },
        closeAllInfoWindow: function() {

        },
        // 展示从维基获取的地址介绍信息
        showInfoWinodw: function(card) {
            if (card.wiki)
                return card.infowindow.open(map, card.marker);

            // 初始化信息框，用于marker点击时显示
            this.wikiSearch(card.name, function(data) {
                var _data = {};
                var _res = [];
                for (var e in data.query.pages) {
                    var _page = data.query.pages[e];
                    // 筛选出有效且的地址信息
                    if (!/refer to:$/.test(_page.extract) && /shanghai/i.test(_page.extract)) {
                        _res.push(_page);
                    }
                };

                if(!_res.length){
                    alert('未查到相关地址信息！')
                }else{
                    // 按相关性做排序
                    _res.sort(function(a,b){
                        return a.index > b.index;
                    });
                    // 取条一条数据做展示 
                    _data.text = _res[0].extract;
                    _data.img = _res[0].thumbnail? '<img src="'+ _res[0].thumbnail.source.replace(/33px|50px/,'100px') +'" class="thumbnail" />':'';
                };

                // 创建 infowindow 实例 初始化，并创建关闭事件监听 
                card.infowindow = new google.maps.InfoWindow({
                    content: _data.img +
                    '<div class="infotext">'+_data.text +'--from[<a href="https://en.wikipedia.org/wiki/'+ card.name +'">wikipedia</a>]</div>'
                });
                // flag: wiki 是否已加载过
                card.wiki = _data;
                card.infowindow.open(map, card.marker);
                card.infowindow.addListener('closeclick', function(){
                    card.infowindow.close();
                    card.active(false);
                    card.marker.setAnimation(null);
                });
            }, function(error) {
                console.log('获取wiki词条失败');
                // 获取wiki失败，则默认使用 中文名字做 infowindow的内容展示
                card.infowindow = new google.maps.InfoWindow({
                    content: card.cname
                });
                card.infowindow.open(map, card.marker);
            });
        },
        wikiSearch: function(name, onSuccess, onError) {
            // wiki api
            var wikiApi = 'https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=10&prop=pageimages|extracts&pilimit=max&exintro&explaintext&exsentences=1&exlimit=max&origin=*&gsrsearch=';
            // 添加成功和失败状态下的回调处理
            $.ajax({
                url: wikiApi + name,
                dataType: 'json',
                success: function(data) {
                    typeof onSuccess === 'function' && onSuccess(data);
                },
                error: function(error) {
                    typeof onError === 'function' && onError(error);
                }
            });
        },
    };
    
    // 加载js
    var script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCzaIkBQ6lg2lNcpzXCe554Eusmdq9ujEE";
    script.onload = function() {
        W.googleMap = new Map({
            center: {
                lat: 31.23071096,
                lng: 121.46484375
            }, 
            locations: locationDatas
        });
    };
    script.onerror = function() {
        console.log('Google Map 加载失败');
    };
    document.body.appendChild(script);
})($, window);