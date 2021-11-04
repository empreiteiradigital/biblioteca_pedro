(function($){
    "use strict";
    let helpers = window.WPD.ajaxsearchpro.helpers;
    let functions = {
        liveLoad: function(selector, url, updateLocation, forceAjax) {
            if ( selector == 'body' || selector == 'html' ) {
                console.log('Ajax Search Pro: Do not use html or body as the live loader selector.');
                return false;
            }

            // Store the current page HTML for the live loaders
            // It needs to be requested here as the dom does store the processed HTML, and it is no good.
            if ( ASP.pageHTML == "" ) {
                if ( typeof ASP._ajax_page_html === 'undefined' ) {
                    ASP._ajax_page_html = true;
                    $.fn.ajax({
                        url: location.href,
                        method: 'GET',
                        success: function(data){
                            ASP.pageHTML = data;
                        },
                        dataType: 'html'
                    });
                }
            }

            function process(data) {
                let parser = new DOMParser;
                let dataNode = parser.parseFromString(data, "text/html");
                let $dataNode = $(dataNode);

                // noinspection JSUnresolvedVariable
                if ( $this.o.statistics ) {
                    $this.stat_addKeyword($this.o.id, $this.n.text.val());
                }
                if ( data != '' && $dataNode.length > 0 && $dataNode.find(selector).length > 0 ) {
                    data = data.replace(/&asp_force_reset_pagination=1/gmi, '');
                    data = data.replace(/%26asp_force_reset_pagination%3D1/gmi, '');
                    data = data.replace(/&#038;asp_force_reset_pagination=1/gmi, '');
                    data = helpers.Hooks.applyFilters('asp_live_load_html', data, $this.o.id, $this.o.iid);
                    data = helpers.wp_hooks_apply_filters('asp_live_load_html', data, $this.o.id, $this.o.iid);
                    $dataNode = $(parser.parseFromString(data, "text/html"));

                    //$el.replaceWith($dataNode.find(selector).first());
                    $el.get(0).parentNode.replaceChild($dataNode.find(selector).get(0), $el.get(0));

                    // get the element again, as it no longer exists
                    $el = $(selector).first();
                    if ( updateLocation ) {
                        document.title = dataNode.title;
                        history.pushState({}, null, url);
                    }
                    if (
                        selector.indexOf('asp_es_') !== false &&
                        typeof elementorFrontend != 'undefined' &&
                        typeof elementorFrontend.init != 'undefined'
                    ) {
                        let widgetType = $el.parent().data('widget_type');
                        if ( widgetType != '' && typeof jQuery != 'undefined' ) {
                            elementorFrontend.hooks.doAction('frontend/element_ready/' + widgetType, jQuery($el.parent().get(0)) );
                        }
                        // Fix Elementor Pagination
                        $this.fixElementorPostPagination(url);
                        // Elementor results action
                        $this.n.s.trigger("asp_elementor_results", [$this.o.id, $this.o.iid, $el], true, true);
                    }

                    // WooCommerce ordering fix
                    $(selector).first().find(".woocommerce-ordering").on("change","select.orderby", function(){
                        $(this).closest("form").trigger('submit');
                    });

                    // Single highlight on live results
                    // noinspection JSUnresolvedVariable
                    if ( $this.o.singleHighlight == 1 ) {
                        $(selector).find('a').on('click', function(){
                            localStorage.removeItem('asp_phrase_highlight');
                            if ( helpers.unqoutePhrase( $this.n.text.val() ) != '' )
                                localStorage.setItem('asp_phrase_highlight', JSON.stringify({
                                    'phrase': helpers.unqoutePhrase( $this.n.text.val() ),
                                    'id': $this.o.id
                                }));
                        });
                    }

                    // noinspection JSUnresolvedVariable
                    ASP.initialize();
                    $this.lastSuccesfulSearch = $('form', $this.n.searchsettings).serialize() + $this.n.text.val().trim();
                    $this.lastSearchData = data;
                } else {
                    // In case of an elementor widget, replace with the no results text on no match
                    if (
                        $dataNode.find(selector).length == 0 &&
                        selector.indexOf('asp_es_') !== false
                    ) {
                        $el.html('');
                        $this.lastSuccesfulSearch = $('form', $this.n.searchsettings).serialize() + $this.n.text.val().trim();
                        $this.lastSearchData = data;

                        // Elementor results action
                        $this.n.s.trigger("asp_elementor_results", [$this.o.id, $this.o.iid, $el], true, true);
                    }
                }
                $this.n.s.trigger("asp_search_end", [$this.o.id, $this.o.iid, $this.n.text.val(), data], true, true);
                $this.gaEvent('search_end', {'results_count': 'unknown'});
                $this.gaPageview($this.n.text.val());
                $this.hideLoader();
                $el.css('opacity', 1);
                $this.searching = false;
                if ( $this.n.text.val() != '' ) {
                    $this.n.proclose.css({
                        display: "block"
                    });
                }
            }

            updateLocation = typeof updateLocation == 'undefined' ? true : updateLocation;
            forceAjax = typeof forceAjax == 'undefined' ? false : forceAjax;

            // Alternative possible selectors from famous themes
            let altSel = [
                '.search-content',
                '#content', '#Content', 'div[role=main]',
                'main[role=main]', 'div.theme-content', 'div.td-ss-main-content',
                'main.l-content', '#primary'
            ];
            if ( selector != '#main' )
                altSel.unshift('#main');

            if ( $(selector).length < 1 ) {
                altSel.forEach(function(i, s){
                    if ( $(s).length > 0 ) {
                        selector = s;
                        return false;
                    }
                });
                if ( $(selector).length < 1 ) {
                    console.log('Ajax Search Pro: The live search selector does not exist on the page.');
                    return false;
                }
            }

            if ( selector.indexOf('asp_es_') > -1 ) {
                selector += ' .elementor-widget-container';
            }

            let $el = $(selector).first(),
                $this = this;

            $this.searchAbort();
            $el.css('opacity', 0.4);
            if (
                !forceAjax &&
                $this.n.searchsettings.find('input[name=filters_initial]').val() == 1 &&
                $this.n.text.val() == ''
            ) {
                window.WPD.intervalUntilExecute(function(){
                    process(ASP.pageHTML);
                }, function(){
                    return ASP.pageHTML != ''
                });
            } else {
                $this.post = $.fn.ajax({
                    url: url,
                    method: 'GET',
                    success: function(data){
                        process(data);
                    },
                    dataType: 'html',
                    fail: function(jqXHR){
                        $el.css('opacity', 1);
                        if ( jqXHR.aborted ) {
                            return;
                        }
                        $el.html("This request has failed. Please check your connection.");
                        $this.hideLoader();
                        $this.searching = false;
                        $this.n.proclose.css({
                            display: "block"
                        });
                    }
                });
            }
        },
        getCurrentLiveURL: function() {
            let $this = this;
            let url = 'asp_ls=' + helpers.nicePhrase( $this.n.text.val() ),
                start = '&',
                location = window.location.href;

            // Correct previous query arguments (in case of paginated results)
            location = location.indexOf('asp_ls=') > -1 ? location.slice(0, location.indexOf('asp_ls=')) : location;
            location = location.indexOf('asp_ls&') > -1 ? location.slice(0, location.indexOf('asp_ls&')) : location;

            // Was asp_ls missing but there are ASP related arguments? (ex. when using ASP.api('getStateURL'))
            location = location.indexOf('p_asid=') > -1 ? location.slice(0, location.indexOf('p_asid=')) : location;
            location = location.indexOf('asp_') > -1 ? location.slice(0, location.indexOf('asp_')) : location;

            if ( location.indexOf('?') === -1 ) {
                start = '?';
            }

            let final = location + start + url + "&asp_active=1&asp_force_reset_pagination=1&p_asid=" +
                $this.o.id + "&p_asp_data=1&" + $('form', $this.n.searchsettings).serialize();
            // Possible issue when the URL ends with '?' and the start is '&'
            final = final.replace('?&', '?');

            return final;
        },
        fixElementorPostPagination: function(url) {
            let $this = this, $es = $('.asp_es_' + $this.o.id);
            if ( $es.length > 0 ) {
                let i = url.indexOf('?');
                if ( i >= 0 ) {
                    let queryString = url.substring(i+1);
                    if ( queryString ) {
                        queryString = queryString.replace(/&asp_force_reset_pagination=1/gmi, '');
                        $es.find('.elementor-pagination a, .elementor-widget-container .woocommerce-pagination a').each(function(){
                            let a = $(this).attr('href');
                            if ( a.indexOf('asp_ls=') < 0 && a.indexOf('asp_ls&') < 0 ) {
                                if ( a.indexOf('?') < 0 ) {
                                    $(this).attr('href', a + '?' + queryString);
                                } else {
                                    $(this).attr('href', a + '&' + queryString);
                                }
                            }
                        });
                        if ( $es.length > 0 ) {
                            $es.find('.elementor-pagination a, .elementor-widget-container .woocommerce-pagination a').on('click', function(e){
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                e.stopPropagation();
                                $this.showLoader();
                                $this.liveLoad('.asp_es_' + $this.o.id, $(this).attr('href'), false, true);
                            });
                        }
                    }
                }
            }
        }
    }
    $.fn.extend(window.WPD.ajaxsearchpro.plugin, functions);
})(WPD.dom);