var directive = ['$timeout', '$window', '$rootScope', '$filter', function($timeout, $window, $rootScope, $filter) {
  return {
    restrict: 'E',
    scope: {
      bodyHtml: '=',
      body: '=',
      quote: '=',
      resetSwitch: '=',
      focusSwitch: '=',
      exitSwitch: '=',
      dirty: '='
    },
    template: require('./editor.html'),
    controller: ['$scope', '$element', function($scope) {
      // quote insert
      $scope.$watch('quote', function(newQuote) {
        if (newQuote) { $scope.insertQuote(newQuote); }
      });

      // reset switch
      $scope.$watch('resetSwitch', function(newValue) {
        if (newValue === true) { $scope.resetEditor(); }
      });

      // autofocus switch
      $scope.$watch('focusSwitch', function(newValue) {
        if (newValue === true) { $scope.focusEditor(); }
      });

      // exit switch
      $scope.$watch('exitSwitch', function(newValue) {
        $scope.exitEditor(newValue);
      });
    }],
    link: function($scope, $element) {
      // editor input elements
      var editor = $element[0].getElementsByClassName('editor-input')[0];
      var $editor = angular.element(editor);

      // -- Images

      $scope.insertImageUrl = function(url) {
        $scope.preview = false; // show compose tab
        if (!url) { return; }
        editor.focus();
        var inserted = $editor.val() + '[img]' + url + '[/img]';
        $editor.val(inserted);
        editor.blur();
      };

      // -- Editor

      function parseInput() {
        // BBCode Parsing
        var rawText = $editor.val();
        var processed = rawText;
        $window.parsers.forEach(function(parser) {
          processed = parser.parse(processed);
        });

        // re-bind to scope
        $scope.bodyHtml = processed;
        $scope.body = rawText;
        $scope.dirty = $scope.originalText !== $scope.body;
        $scope.$apply();
      }

      // debounce parsing on input (250ms)
      var debounce;
      var onChange = function() {
        $timeout.cancel(debounce);
        debounce = $timeout(function() { parseInput(); }, 250);
      };
      $editor.on('blur', onChange);
      $editor.on('input', onChange);

      // -- Page Exit Eventing

      var confirmMessage = 'It looks like a post is being written.';
      var exitFunction = function() { if ($scope.dirty) { return confirmMessage; } };
      $window.onbeforeunload = exitFunction;

      var routeLeaveFunction = function() {
        return $rootScope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
          if (toState.url === fromState.url) { return; }
          if ($scope.dirty) {
            var message = confirmMessage + ' Are you sure you want to leave?';
            var answer = confirm(message);
            if (!answer) { e.preventDefault(); }
          }
        });
      };
      var destroyRouteBlocker = routeLeaveFunction();

      // -- Controller Functions

      // directive initialization and reset
      var initEditor = function() {
        // on load ng-model body to editor and preview
        $scope.preview = false; // show compose tab
        if ($scope.body && $scope.body.length > 0) {
          $scope.body = $filter('decode')($scope.body);
          $editor.val($scope.body);
          $scope.originalText = $scope.body;
        }
        else {
          $scope.bodyHtml = $filter('decode')($scope.bodyHtml);
          $editor.val($scope.bodyHtml);
          $scope.originalText = $scope.bodyHtml;
          $scope.body = $scope.bodyHtml;
        }
        onChange();
      };

      $scope.insertQuote = function(newQuote) {
        editor.focus();
        var quote = '[quote author=' + newQuote.username;
        quote += ' link=';
        quote += '/threads/' + newQuote.threadId + '/posts?page=' + newQuote.page + '#' + newQuote.postId;
        quote += ' date=' + newQuote.createdAt + ']';
        quote += newQuote.body;
        quote += '[/quote]';
        $editor.val($editor.val() + $filter('decode')(quote));
        $scope.quote = '';
        editor.blur();
      };

      // resets the editor
      $scope.resetImages = false;
      $scope.resetEditor = function() {
        initEditor();
        $scope.resetImages = true;
        $scope.resetSwitch = false;
      };

      // focus input on editor element
      $scope.focusEditor = function() {
        $timeout(function() { editor.focus(); }, 10);
        $scope.focusSwitch = false;
      };

      // turns off page exit events
      $scope.exitEditor = function(value) {
        if (value === true) {
          $window.onbeforeunload = undefined;
          if (destroyRouteBlocker) { destroyRouteBlocker(); }
        }
        else if (value === false) {
          $window.onbeforeunload = exitFunction;
          if (destroyRouteBlocker) { destroyRouteBlocker(); }
          destroyRouteBlocker = routeLeaveFunction();
        }
      };

      // -- Destroy

      $element.on('$destroy', function() {
        $window.onbeforeunload = undefined;
        if (destroyRouteBlocker) { destroyRouteBlocker(); }
      });
    }
  };
}];

module.exports = angular.module('ept.directives.epochtalk-editor', [])
.directive('epochtalkEditor', directive);
