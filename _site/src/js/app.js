(function() {
    'use strict';

    function initCats(cats) {
        var html = cats.map(function(e) {
            return '<div class="cat-item j_cat" data-num="0">' +
                '<p class="click-num">点击cat' + e + '次数： <b class="j_num">0</b></p>' +
                '<img class="cat" src="img/cat' + e + '.jpg">' +
            '</div>';
        }).join("");

        $('.j_cont').html(html);
    }
    initCats([1, 2]);
    $(document).on("click", ".j_cat", function() {
        var $this = $(this),
            num = $this.data("num") || 0;
        num++;
        $this.data("num", num).find(".j_num").text(num);
    });
})();