//------------------------Modules---------------------------//


//The 2nd parameter is an array of dependencies (things the module, controller or function will need)
//Ionic Dependency allows me to call all of Ionics built in services and directives

angular.module('chefApp', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar for the keyboard
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

//------------------------setup states---------------------------//


//Config - sets up ionics states, and allows the tabs to navigate between different states through templates, and the stateprovider.

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('tabs', {
      url: '/tab',
      abstract: true, //this allows the tabs to be a compontent of a page, rather than a whole page itself.
      templateUrl: 'templates/tabs.html'
    })

  //Home State
  
    .state('tabs.home', {
      url: '/home',
      views: {
        'home-tab' : {
          templateUrl: 'templates/home.html',
          controller: 'HomeController'
        }
      }
    })

  //Chefs State
  
    .state('tabs.chefs', {
      url: '/chefs',
      views: {
        'chefs-tab' : {
          templateUrl: 'templates/chefs.html',
          controller: 'ChefController'
        }
      }
    })
  
  //Chefs detail State

    .state('tabs.detail', {
      url: '/chefs/:aId',
      views: {
        'chefs-tab' : {
          templateUrl: 'templates/detail.html',
          controller: 'ChefController'
        }
      }
    })

  //Bookings State
  
    .state('tabs.bookings', {
      url: '/bookings',
      views: {
        'bookings-tab' : {
          templateUrl: 'templates/bookings.html',
          controller: 'BookingController'
        }
      }
    })


  $urlRouterProvider.otherwise('/tab/home');
})

//------------------------Factories-----------------------------//


//Booking factory

.factory('bookingFactory', [
        
    
        function() {
        //Stores array of bookings
          var bookings = [];
          var chefInfo = {};
            
            return {
              storeBooking: function(bookingInfo){
                //Adds booking to the booking array 
                bookings.push(bookingInfo);
              },
              
              getBookings: function(){
                //Retrieves the array of bookings stored
                return bookings;
              },
                
              storeChefInfo: function(chefInformation) {
                  //Stores the chef information of the chef we want to book with
                chefInfo = chefInformation;
              },
                
              getChefInfo: function(){
                  //Returns the chef information to be used in the modal
                return chefInfo;
              }

            };
        }
])

//------------------------Controllers---------------------------//

//Home controller

.controller('HomeController', ['$scope', '$http', '$state', '$ionicModal',
                               
    //This loads the data from my JSON document to display my profile
                               
    function($scope, $http, $state, $ionicModal) {
        
        //This loads my profile info from the JSON into my profile scope
        
        $http.get('js/data.json').success(function(data) {
        $scope.profile = data.profile; // This stores profile data into profile variable scope
        });  
        
        //For debugging
        $scope.test = {
        name: 'Mittens Cat',
        info: 'Tap anywhere on the card to open the modal'
          }

        $ionicModal.fromTemplateUrl('profile-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal
        })  

        $scope.openModal = function() {
            $scope.modal.show()
        }

        $scope.closeModal = function() {
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });
    }
                               
])

//Chef Controller

.controller('ChefController', ['$scope', '$http', '$state', '$ionicModal', 'bookingFactory',
                               
    //This loads the data from my JSON document to display the various chefs
                               
    function($scope, $http, $state, $ionicModal, bookingFactory) {
    $http.get('js/data.json').success(function(data) {
      $scope.chefs = data.chefs; //stores data from json into chef variable
      $scope.whichchef=$state.params.aId; //stores which chef is selected

      //Pull to refresh chef data to original state
      
      $scope.doRefresh =function() {
      $http.get('js/data.json').success(function(data) {
          $scope.chefs = data.chefs;
          $scope.$broadcast('scroll.refreshComplete'); 
        });
      }
    });
        
    

    $scope.openModal = function(item) {
        var chefInfo = {};
        
        //Groups the info of the current chef to store it in the modal
        chefInfo.name = item.name;
        chefInfo.shortname =item.shortname;
        chefInfo.cuisine = item.cuisine;
        chefInfo.availability =item.availability;
        
        bookingFactory.storeChefInfo(chefInfo);
        
        //Creates the modal and passes the chef info to its scope
        //and then opens it (Done it that order to have the data available in the modal
        $ionicModal.fromTemplateUrl('my-modal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
        }).then(function(modal) {
            $scope.booking = {};
            $scope.booking_chefInfo = bookingFactory.getChefInfo();
            $scope.modal = modal
            $scope.modal.show();
        })  

        }

        $scope.closeModal = function() {
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function() {
            //$destroy listens for the close of the Modal. If the modal isnt removed, it results in memory leak.
            $scope.modal.remove();
        });
}])

//Bookings controller

.controller('BookingController', ['$scope', '$http', '$state', 'bookingFactory',
    function($scope, $http, $state, bookingFactory) {   
        
        //Gets the list of bookings from the booking factory
        //stored using the modal
        $scope.bookings = bookingFactory.getBookings();
        //Data object that handles showing/hiding the delete icon
        $scope.data = {};
        $scope.data.showDelete = false;
        console.log($scope.bookings);

          //Pull to refresh scope data to original state
          $scope.doRefresh =function() { 
              $scope.bookings = bookingFactory.getBookings();
          }

          $scope.onItemDelete = function(itemIndex) { // when item is deleted it is removed from array list in the JSON
              //Delete function that removes the booking from the list
              console.log(itemIndex);
              console.log('deleting');
              $scope.bookings.splice(itemIndex, 1);
          }
}])

//Booking modal controller

.controller('BookModalController', ['$scope', '$ionicModal', 'bookingFactory', function($scope, $ionicModal, bookingFactory) {
        
    //This controller handles the booking modal. It displays the booking form, which creates and updates the bookings tab with a new booking event for the chef selected.
    
    $scope.closeAfterSave = function(){
        //Groups up all the needed booking info into variables
        var bookingChefName = $scope.booking_chefInfo.name,
            bookingChefShortname = $scope.booking_chefInfo.shortname,
            bookingCuisine = $scope.booking_chefInfo.cuisine,
            bookingWeekday = $scope.booking_chefInfo.availability,
            bookingTime = $scope.booking.time,
            bookingSpecialrequests = $scope.booking.specialrequests
        
         //Stores the variables into a single object
        $scope.booking = {
            name: bookingChefName,
            shortname: bookingChefShortname,
            cuisine: bookingCuisine,
            weekday: bookingWeekday,
            appointment_time: bookingTime,
            specialrequest: bookingSpecialrequests,
        }
        
        //Stores the booking in the array provided by the factory and closes the modal
        bookingFactory.storeBooking($scope.booking);
    
          
        $scope.modal.hide();
    }

}]);

/* Profile controller
.controller('ProfileController', ['$scope', '$ionicModal', function($scope, $ionicModal) {
    
    $ionicModal.fromTemplateUrl('profile-modal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
        }).then(function(modal) {
            $scope.modal = modal
            $scope.modal.show();
            
        })  

        }

        $scope.closeModal = function() {
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function() {
            //$destroy listens for the close of the Modal. If the modal isnt removed, it results in memory leak.
            $scope.modal.remove();
        });
}]);
*/


