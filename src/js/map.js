(function($, window) {
    'use strict';

    // 默认配置信息，地图中心为北京
    var def = {
            dom: document.getElementById('map'),
            local: '北京',
            center: {
                lat: 39.9087191,
                lng: 116.3952003
            },
            iconBase : 'https://mingyili.github.io/assets/img/map/',
            wikiApiUrl : 'https://zh.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrnamespace=0&gsrlimit=10&prop=pageimages|extracts&pilimit=max&exintro&explaintext&exsentences=1&exlimit=max&origin=*&gsrsearch='
        };

    /**
     * Map 统一管理地图操作方法
     * @param {JSON} opt 自定义相关配置
     */
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
        },
        /**
         * getMarkerIcon 获取不同类型的标记图标，获取过的会缓存
         * @param  {String} type 地图标记类型，可以是餐饮，商场，景点等，现在只有 location
         * @return {Obj} 返回 实例化过的 MarkerImage 对象
         */
        getMarkerIcon: function(type) {
            this.markerIcons = this.markerIcons || {};
            this.markerIcons[type] = this.markerIcons[type] || new google.maps.MarkerImage(this.opt.iconBase + type + '.png');
            return this.markerIcons[type];
        },
        /**
         * addMarkers 批量实例化一组地图标记；
         * 利用地图标记数据批量生成地址模型数据，
         * @param {Array} locs 地址数据
         */
        addMarkers: function(locs) {
            if (!locs || !locs.length) return this;
            return locs.map(this.newMarker.bind(this));
        },
        /**
         * newMarker 实例化一个地图标记
         * @param  {JSON} loc 地址模型信息
         * @return {JSON} loc 含有实例化过的 marker 信息的 loc
         */
        newMarker: function(loc) {
            var defIcon = this.getMarkerIcon(loc.type),
                hoverIcon = this.getMarkerIcon(loc.type + '_hover'),
                mapSelf = this,
                marker = new google.maps.Marker({
                    position: loc.location,
                    title: loc.name,
                    icon: defIcon,
                    map: this.map,
                    animation: google.maps.Animation.DROP
                });
            // 鼠标 hover 时改变图标
            marker.addListener('mouseover', marker.setIcon.bind(marker, hoverIcon));
            marker.addListener('mouseout', marker.setIcon.bind(marker, defIcon));

            // 地址标记 active 时添加动画并展示信息窗口
            marker.onActive = function() {
                this.setAnimation(google.maps.Animation.BOUNCE);
                mapSelf.showInfoWinodw(loc);
            };
            marker.offActive = function() {
                this.setAnimation(null);
                loc.infowindow && loc.infowindow.close();
            };
            // 标记点击
            marker.addListener('click', loc.onActive.bind(loc));

            loc.marker = marker;
            return loc;
        },
        /**
         * initInfowindow 初始化信息框
         * @param {JSON} loc  地址模型对象
         * @param {JSON} info 信息框数据，没有，默认卡条数据做内容
         */
        initInfowindow: function(loc, info) {
            info = info || {
                isDef: true,
                text: loc.name
            };
            loc.infowindow = new google.maps.InfoWindow({
                content: ['<div class="info-cont">',
                    (info.img ? '<img src="' + info.img + '" class="info-img"/>' : ''),
                    '<div class="info-text">',
                        (info.isDef ? '<p>维基介绍：</p>' : ''),
                        info.text + '<a target="_blank" href="https://en.wikipedia.org/wiki/' + loc.name + '">--更多</a>',
                    '</div>',
                '</div>'].join('')
            });
            // 绑定窗口关闭事件
            loc.infowindow.addListener('closeclick', loc.offActive.bind(loc));
            loc.active() && loc.infowindow.open(this.map, loc.marker);
        },
        /**
         * showInfoWinodw 展示介绍信息
         * 调用 wiki api 获取当前地址的介绍信息；
         * 获取失败的时候默认使用模型数据填充，获取成功后会缓存，第二次调用不再请求；
         * @param {JSON} loc 地址模型数据
         */
        showInfoWinodw: function(loc) {
            if (loc.infowindow) return loc.infowindow.open(this.map, loc.marker);
            var mapSelf = this,
                isLocal = new RegExp(this.opt.local, "i");

            // 当前地址信息的 ajax 正在请求的时候加锁，避免复请求
            if (loc.infoLoading) return false;
            loc.infoLoading = true;
            $.ajax({
                url: this.opt.wikiApiUrl + loc.name,
                dataType: 'json',
                success: function(data) {
                    loc.infoLoading = false;
                    if (!data || !data.query) return mapSelf.initInfowindow(loc);
                    var infos = [];
                    $.each(data.query.pages, function(key, val) {
                        // 筛选有效的信息
                        if (!/refer to:$/.test(val.extract) && isLocal.test(val.extract)) infos.push(val);
                    });
                    if (!infos.length) return mapSelf.initInfowindow(loc);

                    // 排序 找相关度最大(index 最小)的信息
                    infos.sort(function(a, b) {
                        return a.index - b.index;
                    });
                    mapSelf.initInfowindow(loc, {
                        text: infos[0].extract,
                        img: infos[0].thumbnail ? infos[0].thumbnail.source.replace(/33px|50px/,'100px') : ''
                    });
                },
                error: function(error) {
                    loc.infoLoading = false;
                    console.log('wiki 数据加载失败');
                    mapSelf.initInfowindow(loc);
                }
            });
        }
    };

    // 检测加载失败
    window.mapError = function() {
        console.log('Google Map 加载失败');
    };
    window.initMap = function() {
        window.afterMapLoad(window.googleMap = new Map());
    };
})($, window)
