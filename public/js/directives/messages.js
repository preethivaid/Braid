angular.module('messagesDirective', [])

    .controller('messageController', ['$scope', 'Messages', 'Strands', function($scope, Messages, Strands) {

        var vm = this;


        // initialization

        vm.messages = [];
        vm.strands = [];
        vm.selected_strand = undefined;
        vm.strand_map = {};
        vm.primed_messages = [];
        vm.message_text_focus = false;
        vm.forms = {
            newMessageFormData: {},
            newStrandFormData: {}
        };


        // define CRUD functions used in the template

        vm.createMessage = function() {
            if (vm.forms.newMessageFormData.text) {
                vm.forms.newMessageFormData.convo_id = vm.selected_convo._id;
                vm.forms.newMessageFormData.sender_id = vm.selected_user._id;
                if (vm.selected_convo.user_id_0 = vm.selected_user._id) {
                    vm.forms.newMessageFormData.receiver_id = vm.selected_convo.user_id_1;
                } else {
                    vm.forms.newMessageFormData.receiver_id = vm.selected_convo.user_id_0;
                };
                vm.forms.newMessageFormData.time_sent = new Date();

                // if responding to a new strand
                if (vm.primed_messages.length > 0) {
                    vm.forms.newStrandFormData.convo_id = vm.selected_convo._id;

                    // create a new strand
                    Strands.create(vm.forms.newStrandFormData)
                        .success(function(strand_data) {
                            vm.strands = strand_data.strands;
                            vm.forms.newMessageFormData.strand_id = strand_data.new_strand._id;
                            var message_ids = vm.primed_messages.map(function(message) {return message._id});

                            // update the primed messages to be part of the new strand
                            Messages.assignMessagesToStrand(message_ids, strand_data.new_strand._id, vm.selected_convo._id)
                                .success(function(assign_messages_data) {
                                    vm.messages = assign_messages_data;

                                    // create the new message as part of the new strand
                                    Messages.create(vm.forms.newMessageFormData)
                                        .success(function(create_messages_data) {
                                            vm.forms.newMessageFormData = {};
                                            vm.messages = create_messages_data.messages;
                                            vm.selected_strand = strand_data.new_strand;
                                            vm.primed_messages = [];
                                        });

                            });

                        });

                // if not responding to a new strand
                } else {
                    if (vm.selected_strand) {
                        vm.forms.newMessageFormData.strand_id = vm.selected_strand._id;
                    };

                    Messages.create(vm.forms.newMessageFormData)
                        .success(function(data) {
                            vm.forms.newMessageFormData = {};
                            vm.messages = data.messages;
                        });

                };
            };
        };

        vm.deleteMessage = function(message_id, convo_id) {

            Messages.delete(message_id, convo_id)
                .success(function(data) {
                    vm.messages = data;
                    vm.primed_messages = vm.primed_messages.filter(function(primed_message) {
                        return message_id !== primed_message._id;
                    });

                    if (vm.selected_strand) {
                        var strand_messages = vm.messages.filter(function(message) {
                            return message.strand_id === vm.selected_strand._id;
                        });

                        if (strand_messages.length === 0) {
                            vm.selected_strand = undefined;
                        };
                    };
                });

        };


        // define page control functions used in the template

        vm.messageIsPrimed = function(message) {
            var primed_message_ids = vm.primed_messages.map(function(primed_message) {
                return primed_message._id;
            });
            return $.inArray(message._id, primed_message_ids) !== -1;
        };

        vm.messageIsHidden = function(message) {
            if (vm.selected_strand) {
                return message.strand_id !== vm.selected_strand._id;
            } else {
                return vm.message_text_focus && vm.primed_messages.length > 0 && !vm.messageIsPrimed(message);
            };
        };

        vm.toggleMessage = function(message) {
            // if no strand is selected
            if (!vm.selected_strand) {
                // if the clicked message is already in a strand then we should select that strand
                if (message.strand_id) {
                    vm.selected_strand = vm.strand_map[message.strand_id];
                // if the clicked message does not already have a strand we should add or subtract it from the primed messages
                } else {
                    var primed_message_ids = vm.primed_messages.map(function(primed_message) {
                        return primed_message._id;
                    });
                    if ($.inArray(message._id, primed_message_ids) === -1) {
                        vm.primed_messages.push(message);
                    } else {
                        vm.primed_messages = vm.primed_messages.filter(function(primed_message) {
                            return message._id !== primed_message._id;
                        });
                    };
                };
            // if a strand is selected
            } else {
                // deselect the strand
                vm.selected_strand = undefined;
            };
        };

        vm.addMessageToStrand = function(message) {
            var primed_message_ids = vm.primed_messages.map(function(primed_message) {
                return primed_message._id;
            });
            //add the current list of primed messages to the currently selected strand
            Messages.assignMessagesToStrand(primed_message_ids, message.strand_id, vm.selected_convo._id)
                .success(function(assign_messages_data) {
                    vm.messages = assign_messages_data;
            });  
            // //clear the primed messages list
            vm.primed_messages = [];
        };

        vm.checkboxIsHidden = function(message) {
            //checkboxes should only appear on stranded messages if any messages are primed
            if (vm.primed_messages.length != 0) {
                return !message.strand_id;
            } else {
                return true;
            };
        };

        // register listeners

        var refreshMessages = function() {
            if (vm.selected_convo) {

                Messages.get(vm.selected_convo._id)
                    .success(function(data) {
                        vm.messages = data;
                    });

            } else {
                vm.messages = [];
            };
        };

        var clearPrimedMessages = function() {
            vm.primed_messages = [];
        };

        var refreshStrands = function() {
            if (vm.selected_convo) {

                Strands.get(vm.selected_convo._id)
                    .success(function(data) {
                        vm.strands = data;
                    });

            } else {
                vm.strands = [];
            };
        };

        var deselectStrand = function() {
            vm.selected_strand = undefined;
        };

        var refreshStrandMap = function() {
            var temp_strand_map = {};
            _.each(vm.strands, function(strand) {
                temp_strand_map[strand._id] = strand;
            });
            vm.strand_map = temp_strand_map;
        };

        var strands_watcher = function(scope) {return vm.strands;};
        var selected_strand_watcher = function(scope) {return vm.strands;};
        var selected_convo_watcher = function(scope) {return vm.selected_convo;};
        var selected_user_watcher = function(scope) {return vm.selected_user;};
        $scope.$watchGroup([selected_strand_watcher, selected_convo_watcher], refreshMessages);
        $scope.$watchGroup([selected_strand_watcher, selected_convo_watcher, selected_user_watcher], clearPrimedMessages);
        $scope.$watch(selected_convo_watcher, refreshStrands);
        $scope.$watchGroup([selected_convo_watcher, selected_user_watcher], deselectStrand);
        $scope.$watch(strands_watcher, refreshStrandMap);

    }])

    .directive('braidMessages', function() {
        return {
            restrict: 'E',
            scope: {
                selected_strand: '=selectedStrand',
                selected_convo: '=selectedConvo',
                selected_user: '=selectedUser',
                user_map: '=userMap'
            },
            templateUrl: 'views/messages.html',
            controller: 'messageController',
            controllerAs: 'messageCtrl',
            bindToController: true
        };
    });
