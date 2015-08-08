pongApp.factory('deviceService', ['$rootScope', '$window', 'matchMedia',
function deviceServiceFactory($root, $window, matchMedia) {
    'use strict';

    function breakPoint(min, max) {
        return {
            min: min,
            max: max
        };
    }

    var breakPoints = {
            mobile: breakPoint(0, 767),
            tablet: breakPoint(768, 991),
            desktop: breakPoint(992, 1199),
            desktopWide: breakPoint(1200, Number.MAX_VALUE)
        },
        mediaQueries = {},
        service = {};

    mediaQueries.mobile = matchMedia('(max-width: ' + breakPoints.mobile.max + 'px)');
    mediaQueries.tablet = matchMedia('(min-width: ' + breakPoints.tablet.min + 'px)');
    mediaQueries.desktop = matchMedia('(min-width: ' + breakPoints.desktop.min + 'px)');
    mediaQueries.desktopWide = matchMedia('(min-width: ' + breakPoints.desktopWide.min + 'px)');

    service.mediaQueries = mediaQueries;

    service.getDeviceSize = getDeviceSize;

    $root.device = service.device = {
        breakpoint: getDeviceSize()
    };

    function getDeviceSize() {
        var size = 'mobile';

        if (mediaQueries.desktopWide.matches) {
            size = 'desktop-wide';
        } else if (mediaQueries.desktop.matches) {
            size = 'desktop';
        } else if (mediaQueries.tablet.matches) {
            size = 'tablet';
        }

        return size;
    }

    function updateDeviceSize() {
        var oldVal = $root.device.breakpoint,
            newVal = getDeviceSize();

        $root.device['isMobile'] = mediaQueries.mobile.matches;
        $root.device['isTablet'] = mediaQueries.tablet.matches;
        $root.device['isDesktop'] = mediaQueries.desktop.matches;
        $root.device['isDesktopWide'] = mediaQueries.desktopWide.matches;

        if (newVal !== oldVal) {

            $root.$apply(
                function screenSizeChanged() {
                    $root.device.breakpoint = newVal;

                    /**
                     * @ngdoc event
                     * @eventOf bb.ui.util:deviceService
                     * @name bb.ui.util:deviceService#screen.size.changed
                     * @eventType emit on $root
                     *
                     * @description
                     * Emits an event on root scope after `$root.screenSize` is updated. Passing in
                     * `newVal` and `oldVal` arguments.
                     *
                     */
                    $root.$emit('device.breakpoint.changed', newVal, oldVal);
                }
            );
        }
    }

    var handleResizeEvent = (function() {
        var frame;
        return function throttle() {
            frame = frame || $window.requestAnimationFrame(function() {
                frame = null;
                setTimeout(updateDeviceSize, 0);
            });
        };
    })();

    angular.element($window).on('resize orientationchange', handleResizeEvent);
    updateDeviceSize();

    return service;
}]);

// make sure it gets instantiated
pongApp.run(['deviceService', angular.noop]);
