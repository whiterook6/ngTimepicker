(function(){
	angular
		.module('jkuri.timepicker', [])
		.directive('ngTimepicker', ['$document', function($document) {

			// Called at the start to pull in variables from the directive's element
			// also sets the time
			var setScopeValues = function (scope, attrs) {
				scope.initialTime = scope.time || '11:00';
				scope.step = attrs.step || '15';

				var sm = attrs.showMeridian || false;
				scope.showMeridian = (sm === 'true' || sm === true);

				scope.meridian = attrs.meridian || 'AM';
				scope.theme = attrs.theme || '';
				
				if (!attrs.editable || attrs.editable === 'false'){
					scope.editable = false;
				} else {
					scope.editable = true;
				}
			};

			// gets the position of right below the element
			var getPosition = function(element){
				var input_box = element.firstChild;
				
				var top = input_box.offsetTop + input_box.offsetHeight;
				var left = input_box.offsetLeft;

				return { top: top - 1, left: left };
			};

			// parse the date input into scope variables
			var initTime = function (scope) {
				var time = scope.initialTime.split(':');

				scope.hour = parseInt(time[0]) % 24;
				if (scope.showMeridian){
					if (scope.hour === 0){
						scope.hour = 12;
						scope.meridian = 'AM';
					} else if (scope.hour === 12){
						scope.hour = 12;
						scope.meridian = 'PM';
					} else if (scope.hour > 12 && scope.hour < 22){
						scope.hour = '0' + (scope.hour - 12);
						scope.meridian = 'PM';
					} else if (scope.hour >= 22){
						scope.hour = scope.hour - 12;
						scope.meridian = 'PM';
					} else {
						scope.hour = scope.hour;
						scope.meridian = 'AM';
					}
				}

				scope.minutes = time[1];
			};

			// make sure it's not NAN
			var isValid = function(scope){
				if (isNaN(scope.hour) || isNaN(scope.minutes)){
					return false;
				}

				return true;
			};

			// given the scope variables, build the time string
			var setTime = function (scope) {
				var time;
				if (!scope.showMeridian) {
					time = scope.hour + ':' + scope.minutes;
					scope.viewValue = time;
					scope.time = time;
				} else {
					time = scope.hour + ':' + scope.minutes;
					scope.viewValue = time + ' ' + scope.meridian;
					time = convertFromMeridianHour(scope) + ':' + scope.minutes;
					scope.time = time;
				}
			};

			// given a time with AM or PM, calculate 24 hour time
			var convertFromMeridianHour = function (scope) {
				var hour = parseInt(scope.hour, 10);

				// if it's 12AM or 12PM -> convert to 12 or 00
				if (hour === 12 && scope.meridian === 'PM') return 12;
				if (hour === 12 && scope.meridian === 'AM') return '00';

				if (scope.meridian === 'PM') {
					return hour + 12;
				} else if (hour === 0){
					return 12;
				} else if (hour < 10) {
					return '0' + hour;
				} else {
					return hour;
				}
			};

			return {
				restrict: 'EA',
				scope: {
					time: '='
				},
				link: function (scope, element, attrs) {
					setScopeValues(scope, attrs);
					scope.opened = false;
					var position = getPosition(element[0]);
					scope.left = position.left+'px';
					scope.top = position.top+'px';

					// show the box
					scope.showTimepicker = function () {
						scope.opened = true;
						var position = getPosition(element[0]);
						scope.left = position.left+'px';
						scope.top = position.top+'px';
					};

					// used when pressing an up key or hitting the up button on an hour
					scope.incrementHour = function () {
						if (!scope.showMeridian) {
							if (parseInt(scope.hour, 10) < 23) {
								scope.hour = parseInt(scope.hour, 10) + 1;
							} else {
								scope.hour = 0;
							}
						} else {
							if (parseInt(scope.hour, 10) === 12 ){
								scope.hour = 1;
							} else if (parseInt(scope.hour, 10) === 11) {
								scope.hour = 12;
								scope.toggleMeridian();
							} else {
								scope.hour = parseInt(scope.hour, 10) + 1;
							}
						}

						if (parseInt(scope.hour, 10) < 10) {
							scope.hour = '0' + scope.hour;
						}

						setTime(scope);
					};

					// same, but for downwards
					scope.decreaseHour = function () {
						if (!scope.showMeridian) {
							if (parseInt(scope.hour, 10) === 0) {
								scope.hour = 23;
							} else {
								scope.hour = parseInt(scope.hour, 10) - 1;
							}
						} else {
							if (parseInt(scope.hour, 10) === 1) {
								scope.hour = 12;
							} else if (parseInt(scope.hour, 10) === 12) {
								scope.hour = 11;
								scope.toggleMeridian();
							} else {
								scope.hour = parseInt(scope.hour, 10) - 1;
							}
						}

						if (parseInt(scope.hour, 10) < 10) {
							scope.hour = '0' + scope.hour;
						}

						setTime(scope);
					};

					// same as above, but for hours. Increments in scope.steps minutes (15 by default)
					scope.incrementMinutes = function () {
						scope.minutes = parseInt(scope.minutes, 10) + parseInt(scope.step, 10);
						if (scope.minutes > 59) {
							scope.minutes = '00';
							scope.incrementHour();
						}
						setTime(scope);
					};

					scope.decreaseMinutes = function () {
						scope.minutes = parseInt(scope.minutes, 10) - parseInt(scope.step, 10);
						if (parseInt(scope.minutes, 10) < 0) {
							scope.minutes = 60 - parseInt(scope.step, 10);
							scope.decreaseHour();
						}
						if (parseInt(scope.minutes, 10) === 0) {
							scope.minutes = '00';
						}
						setTime(scope);
					};

					// detect key press
					scope.keyDown = function (evt, which) {
						if(evt.keyCode === 40) { // decrement
							if (which == 'minutes'){
								scope.decreaseMinutes();
							} else {
								scope.decreaseHour();
							}
						} else if (evt.keyCode === 38) { // increment
							if (which == 'minutes'){
								scope.incrementMinutes();
							} else {
								scope.incrementHour();
							}
						}
					};

					// change am to pm
					scope.toggleMeridian = function () {
						scope.meridian = (scope.meridian === 'AM') ? 'PM' : 'AM';
						setTime(scope);
					};

					// if it's editable
					scope.edit = function () {
						if (scope.editable && isValid()){
							setTime(scope);
						}
					};

					// hide when something else is clickec on
					$document.on('click', function (e) {
						if (element !== e.target && !element[0].contains(e.target)) {
							scope.$apply(function () {
								scope.opened = false;
							});
						}
					});

					initTime(scope);
					setTime(scope);
				},
				template:
					'<input type="text" ng-focus="showTimepicker()" ng-value="viewValue" class="ng-timepicker-input" ng-readonly="true">' +
					'<div class="ng-timepicker" ng-show="opened" ng-style="{\'left\': left, \'top\': top}">' +
					'  <table>' +
					'    <tbody>' +
					'    <tr>' +
					'        <td class="act noselect" ng-click="incrementHour()"><i class="fa fa-angle-up"></i></td>' +
					'        <td></td>' +
					'        <td class="act noselect" ng-click="incrementMinutes()"><i class="fa fa-angle-up"></i></td>' +
					'        <td class="act noselect" ng-click="toggleMeridian()" ng-show="showMeridian"><i class="fa fa-angle-up"></i></td>' +
					'      </tr>' +
					'      <tr>' +
					'        <td><input type="text" ng-model="hour" ng-readonly="!editable" ng-keydown="keyDown($event, \'hours\');" ng-change="edit()"></td>' +
					'        <td>:</td>' +
					'        <td><input type="text" ng-model="minutes" ng-readonly="!editable" ng-keydown="keyDown($event, \'minutes\');" ng-change="edit()"></td>' +
					'        <td ng-show="showMeridian"><input type="text" ng-model="meridian" ng-readonly="true"></td>' +
					'      </tr>' +
					'      <tr>' +
					'        <td class="act noselect" ng-click="decreaseHour()"><i class="fa fa-angle-down"></i></td>' +
					'        <td></td>' +
					'        <td class="act noselect" ng-click="decreaseMinutes()"><i class="fa fa-angle-down"></i></td>' +
					'        <td class="act noselect" ng-click="toggleMeridian()" ng-show="showMeridian"><i class="fa fa-angle-down"></i></td>' +
					'      </tr>' +
					'  </table>' +
					'</div>'
			};
		}]);
}());
