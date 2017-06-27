/*
    ESSArch is an open source archiving and digital preservation system

    ESSArch Tools for Producer (ETP)
    Copyright (C) 2005-2017 ES Solutions AB

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see <http://www.gnu.org/licenses/>.

    Contact information:
    Web - http://www.essolutions.se
    Email - essarch@essolutions.se
*/

angular.module('myApp').controller('PrepareSipCtrl', function ($log, $uibModal, $timeout, $scope, $rootScope, $window, $location, $sce, $http, myService, appConfig, $state, $stateParams, listViewService, $interval, Resource, $q, $translate, $anchorScroll, PermPermissionStore, $cookies, $controller){
    var vm = this;
    var ipSortString = "Created,Submitting,Submitted";
    $controller('BaseCtrl', { $scope: $scope, vm: vm, ipSortString: ipSortString });

    //Click function for ip table
    $scope.ipTableClick = function(row) {
        if($scope.edit && $scope.ip.id== row.id){
            $scope.edit = false;
            $scope.eventlog = false;
            $scope.ip = null;
            $rootScope.ip = null;
        } else {
            $scope.ip = row;
            $rootScope.ip = row;
            var ip = row;
            if (ip.profile_submit_description) {
                $http({
                    method: 'GET',
                    url: ip.profile_submit_description.profile,
                    params: {
                        'ip': ip.id
                    }
                }).then(function(response) {
                    vm.informationModel= response.data.specification_data;
                    vm.informationFields = response.data.template;
                    vm.informationFields.forEach(function(field) {
                        field.type = 'input';
                        field.templateOptions.disabled = true;
                    });
                    if(ip.profile_transfer_project) {
                        $http({
                            method: 'GET',
                            url: ip.profile_transfer_project.profile,
                            params: {
                                'ip': ip.id
                            }
                        }).then(function(response) {
                            vm.dependencyModel= response.data.specification_data;
                            vm.dependencyFields = response.data.template;
                            vm.dependencyFields.forEach(function(field) {
                                field.type = 'input';
                                field.templateOptions.disabled = true;
                            });
                            listViewService.getFileList(ip).then(function(result) {
                                $scope.fileListCollection = result;
                                $scope.getPackageProfiles(row);
                                $scope.edit = true;
                                $scope.eventlog = true;
                            });
                        });
                    }

                }, function(response) {
                    console.log(response.status);
                });
            }
        }
        $scope.submitDisabled = false;
        $scope.eventShow = false;
        $scope.statusShow = false;
    };

    // Populate file list view
    vm.options = {
        formState: {
        }
    };
    //Get list of files in ip
    $scope.getFileList = function(ip) {
        listViewService.getFileList(ip).then(function(result) {
            $scope.fileListCollection = result;
        });
    };
    //Get package dependencies for ip(transfer_project profile)
    $scope.getPackageDependencies = function(ip) {
        if(ip.profile_transfer_project) {
            $http({
                method: 'GET',
                url: ip.profile_transfer_project.profile,
                params: {
                    'ip': ip.id
                }
            }).then(function(response) {
                vm.dependencyModel= response.data.specification_data;
                vm.dependencyFields = response.data.template;
                vm.dependencyFields.forEach(function(field) {
                    field.templateOptions.disabled = true;
                });
            });
        }
    }
    vm.profileFields = [];
    vm.profileModel = {
    };
    //Get lock-status from profiles
    $scope.getPackageProfiles = function(ip) {
        vm.profileFields = [];
        vm.profileModel = {};
        if(ip.profile_transfer_project){
            vm.profileModel.transfer_project = ip.profile_transfer_project.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "transfer_project",
                    disabled: true
                },
                type: "checkbox",
                key: "transfer_project"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_submit_description){
            vm.profileModel.submit_description = ip.profile_submit_description.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "submit_description",
                    disabled: true
                },
                type: "checkbox",
                key: "submit_description"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_sip){
            vm.profileModel.sip = ip.profile_sip.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "sip",
                    disabled: true
                },
                type: "checkbox",
                key: "sip"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_aip){
            vm.profileModel.aip = ip.profile_aip.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "aip",
                    disabled: true
                },
                type: "checkbox",
                key: "aip"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_dip){
            vm.profileModel.dip = ip.profile_dip.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "dip",
                    disabled: true
                },
                type: "checkbox",
                key: "dip"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_content_type){
            vm.profileModel.content_type = ip.profile_content_type.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "content_type",
                    disabled: true
                },
                type: "checkbox",
                key: "content_type"
            }
            vm.profileFields.push(field);
        };

        if(ip.profile_authority_information){
            vm.profileModel.authority_information = ip.profile_authority_information.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "authority_information",
                    disabled: true
                },
                type: "checkbox",
                key: "authority_information"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_archival_description){
            vm.profileModel.archival_description = ip.profile_archival_description.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "archival_description",
                    disabled: true
                },
                type: "checkbox",
                key: "archival_description"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_preservation_metadata){
            vm.profileModel.preservation_metadata = ip.profile_preservation_metadata.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "preservation_metadata",
                    disabled: true
                },
                type: "checkbox",
                key: "preservation_metadata"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_event){
            vm.profileModel.event = ip.profile_event.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "event",
                    disabled: true
                },
                type: "checkbox",
                key: "event"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_data_selection){
            vm.profileModel.data_selection = ip.profile_data_selection.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "data_selection",
                    disabled: true
                },
                type: "checkbox",
                key: "data_selection"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_import){
            vm.profileModel.import = ip.profile_import.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "import",
                    disabled: true
                },
                type: "checkbox",
                key: "import"
            };
            vm.profileFields.push(field);
        }
        if(ip.profile_workflow){
            vm.profileModel.workflow = ip.profile_workflow.LockedBy != null;
            var field = {
                templateOptions: {
                    label: "workflow",
                    disabled: true
                },
                type: "checkbox",
                key: "workflow"
            };
            vm.profileFields.push(field);
        }
    }
    //Get package information(submit-description)
    $scope.getPackageInformation = function(ip) {
        if (ip.profile_submit_description) {
            $http({
                method: 'GET',
                url: ip.profile_submit_description.profile,
                params: {
                    'ip': ip.id
                }
            }).then(function(response) {
                vm.informationModel= response.data.specification_data;
                vm.informationFields = response.data.template;
                vm.informationFields.forEach(function(field) {
                    field.templateOptions.disabled = true;
                });
            }, function(response) {
                console.log(response.status);
            });
        }
    };
    //Get active profile
    function getActiveProfile(profiles) {

        return profiles.active;
    }
    $scope.submitDisabled = false;
    $scope.submitSip = function(ip, email) {
        if(!email) {
            var sendData = {validators: vm.validatorModel}
        } else {
            var sendData = {validators: vm.validatorModel, subject: email.subject, body: email.body}
        }
        $scope.submitDisabled = true;
        $http({
            method: 'POST',
            url: ip.url+'submit/',
            data: sendData
        }).then(function(response) {
            $scope.eventlog = false;
            $scope.edit = false;
            $timeout(function() {
                $scope.getListViewData();
                vm.updateListViewConditional();
            }, 1000);
            $scope.submitDisabled = false;
            $anchorScroll();
        }, function(response) {
            $scope.submitDisabled = false;
        });
    }

    $scope.emailModal = function (profiles) {
        if(vm.dependencyModel.preservation_organization_receiver_email) {
            var modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'static/frontend/views/email_modal.html',
                scope: $scope,
                size: 'lg',
                controller: 'ModalInstanceCtrl',
                controllerAs: '$ctrl'
            })
            modalInstance.result.then(function (data) {
                $scope.submitSip($scope.ip, data.email);
            }, function () {
                $log.info('modal-component dismissed at: ' + new Date());
            });
        } else {
            $scope.submitSip($scope.ip);
        }
    }
});
