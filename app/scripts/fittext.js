angular.module('fittext', [])

.directive('fittext', function() {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            element[0].style.display = 'inline-block';

            var parent = element.parent(),
                $window = angular.element(window),
                compressor = +attrs.fittext || 1,
                lines = element[0].querySelectorAll('[fittext-nl],[data-fittext-nl]').length || 1,
                minFontSize = parseFloat(attrs.fittextMin) || Number.NEGATIVE_INFINITY,
                maxFontSize = parseFloat(attrs.fittextMax) || Number.POSITIVE_INFINITY,
                parentWidth,
                _resize,
                resize,
                frame;

            _resize = function() {
                var ratio,
                    fontSize;

                if (parentWidth !== (parentWidth = parent[0].offsetWidth)) {
                    element[0].style.lineHeight = '1';
                    element[0].style.fontSize = '10px';

                    ratio = element[0].offsetHeight / element[0].offsetWidth / lines;
                    fontSize = Math.max(
                        Math.min((parentWidth - 4) * ratio * compressor, maxFontSize),
                        minFontSize
                    );

                    element[0].style.lineHeight = '';
                    element[0].style.fontSize = fontSize + 'px';
                }
            };

            resize = function() {
                frame = frame || window.requestAnimationFrame(function() {
                    frame = null;
                    _resize();
                });
            };

            if (attrs.ngModel) {
                $scope.$watch(attrs.ngModel, resize);
            } else if (!window.fontsLoaded) {
                $window.one('fonts.loaded', resize);
            } else {
                resize();
            }

            angular.element(window).on('resize', resize);

            $scope.$on('$destroy', function() {
                angular.element(window).off('resize fonts.loaded', resize);
            });
        }
    }
});
