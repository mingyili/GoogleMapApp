(function($) {
    'use strict';

    var map;
    
    // 初始化Map
    function initMap() {
        
        // 中心定位为北京
        var center = {
            lat: 39.908, 
            lng: 116.395
        };

        map = new google.maps.Map(document.getElementById('map'), {
          center: center,
          zoom: 13
        });

        initMark({
            location: { lat: 39.9087191, lng: 116.3952003},
            title: '天安门'
        });
    }

    // 初始化一个标记
    function initMark(data) {
        var marker = new google.maps.Marker({
          position: data.location,
          map: map,
          title: data.title
        });
        /*marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
        });*/
    }

    // 加载js
    var script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCzaIkBQ6lg2lNcpzXCe554Eusmdq9ujEE";
    script.onload = function() {
        console.log('loaded');        
        initMap()
    }
    script.onerror = function() {
        console.log('Google Map 加载失败');
    }
    document.body.appendChild(script);
})($);