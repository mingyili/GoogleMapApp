var locationDatas = [
    {
        name:'天安门',
        type: 'location',
        location: {lat: 39.909191, lng: 116.3969811},
    },
    {
        name:'故宫博物院',
        type: 'location',
        location: {lat: 39.9165884, lng: 116.3972386},
    },
    {
        name:'中国国家图书馆',
        type: 'location',
        location: {lat: 39.945871, lng: 116.322362},
    },
    {
        name:'中国国家体育场',
        type: 'location',
        location: {lat: 39.9929472, lng: 116.3943225},
    },
    {
        name:'798艺术区',
        type: 'location',
        location: {lat: 39.9829545, lng: 116.4929476},
    },
    {
        name:'簋街',
        type: 'location',
        location: {lat: 39.9410605, lng: 116.4246827},
    },
    {
        name:'南锣鼓巷',
        type: 'location',
        location: {lat: 39.9370864, lng: 116.4029372},
    },
    {
        name:'三里屯',
        type: 'location',
        location: {lat: 39.9324732, lng: 116.4545548},
    },
    {
        name:'世贸天阶',
        type: 'location',
        location: {lat: 39.9167636, lng: 116.4515275},
    },
    {
        name:'西单',
        type: 'location',
        location: {lat: 39.9095643, lng: 116.3739301},
    },
    {
        name:'北京欢乐谷',
        type: 'location',
        location: {lat: 39.866418, lng: 116.488627},
    },
    {
        name:'圆明园',
        type: 'location',
        location: {lat: 40.0081023, lng: 116.2960261},
    },
    {
        name:'颐和园',
        type: 'location',
        location: {lat: 39.9999864, lng: 116.2732719},
    },
    {
        name:'八达岭长城',
        type: 'location',
        location: {lat: 40.3597637, lng: 116.0178317},
    },
];;(function($, window) {
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
            this.marker && this.marker.onActive();
            currentLoc = this;
        };
        // 取消当前 locMode active
        this.offActive = function() {
            this.active(false);
            this.marker && this.marker.offActive();
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
    var serachViewModel = function(defLocs) {
        // 检索词 节流 300ms
        this.keyword = ko.observable('').extend({ rateLimit: 300 });
        // 缓存所有的地址信息
        this.locations = ko.observableArray([]);
        // 是否有匹配的结果
        this.noMatch = ko.observable(false);

        // 批量添加地址模型 业务逻辑上，出现的绝大部分是一组地点，而且批量添加可以避免 getMatchLoc 重复触发
        this.addLocModes = function(data) {
            var modes = data.map(function(e) {
                var mode = new locMode(e);
                if (window.googleMap) mode = window.googleMap.newMarker(mode);
                return mode;
            });
            this.locations(this.locations().concat(modes));
        };

        if (defLocs) this.addLocModes(defLocs);

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
                loc.marker && loc.marker.setVisible(isMatch);
                isMatch && matchs.push(loc);
            });
            matchs.length ? this.noMatch(false) : this.noMatch(true);
            return matchs;
            // notifyWhenChangesStop 去抖用，500ms内不改变才触发
        }, this).extend({ rateLimit: { timeout: 300, method: "notifyWhenChangesStop" } });
    }

    // 实例化 serachViewModel，可通过调用 searchVM.addLocModes([]) 添加新的地址数据
    window.searchVM = new serachViewModel(locationDatas);
    ko.applyBindings(window.searchVM);
    // 地图加载完成后 根据已有的地址数据实例化标记
    window.afterMapLoad = function(map) {
        map.addMarkers(window.searchVM.locations());
    };
})($, window)
;(function($, window) {
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
