angular.module('myApp').controller('PrepareIpCtrl', function ($timeout, $scope, $window, $location, $sce, $http, myService, appConfig){
    var vm = this;
    $scope.redirectAdmin = function () {
        $window.location.href="/admin/";
    }
    $scope.isCollapsed = true;
    $scope.toggleCollapse = function (step) {
        if(step.isCollapsed) {
            step.isCollapsed = false;
        } else {
            step.isCollapsed = true;
        }
        console.log(step.isCollapsed);
        console.log(step);
    };
    // List view
    $scope.changePath= function(path) {
        myService.changePath(path);
    };
    $scope.stateClicked = function(row){
        if($scope.statusShow && $scope.ip== row){
            $scope.statusShow = false;
        } else {
            $scope.statusShow = true;
            $scope.edit = false;
            $scope.getStatusViewData(row);
        }
        $scope.subSelect = false;
        $scope.eventlog = false;
        $scope.select = false;
        $scope.ip= row;
    };

    $scope.ipTableClick = function(row) {
        console.log("ipobject clicked. row: "+row.Label);
        if($scope.select && $scope.ip== row){
            $scope.select = false;
            $scope.ipSelected = false;
        } else {
            $scope.select = true;
            $scope.ipSelected = true;
            $scope.getSaProfiles();
        }
        $scope.statusShow = false;
        $scope.ip= row;
    };

    $scope.eventsClick = function (row) {
      $scope.eventShow = true;
        if($scope.eventShow && $scope.ip== row){
            $scope.eventShow = false;
            $scope.ipSelected = false;
        } else {
            $scope.eventCollection = [];
            $http({
                method: 'GET',
                url: appConfig.djangoUrl+'events/'
            })
            .then(function successCallback(response) {
                // console.log(JSON.stringify(response.data));
                var data = response.data;
                for(i=0; i<data.length; i++){
                    if(data[i].ipObject == row.url)
                    $scope.eventCollection.push(data[i]);
                }
            }), function errorCallback(){
                alert('error');
            };
            $scope.eventShow = true;
            $scope.ipSelected = true;
        }
        $scope.statusShow = false;
        $scope.select = false;



        $scope.ip= row;
    };
    //Getting data for list view
    $scope.getListViewData = function() {
            $http({
                method: 'GET',
                url: appConfig.djangoUrl+'information-packages/'
            })
            .then(function successCallback(response) {
                // console.log(JSON.stringify(response.data));
                var data = response.data;
                $scope.ipRowCollection = data;
            }), function errorCallback(){
                alert('error');
            };
    };
    $scope.getListViewData();
    //updates every 5 seconds
    $scope.listViewUpdate = function(){
        $timeout(function() {
            $scope.getListViewData();
            $scope.listViewUpdate();
        }, 5000)
    };
    $scope.listViewUpdate();
    //Getting data for status view
    $scope.getStatusViewData = function(row) {
        var stepRows = [];
        var childSteps = [];
        for(i=0; i<row.steps.length; i++){
            $http({
                method: 'GET',
                url: row.steps[i]
            })
            .then(function successCallback(response) {
                var data = response.data;
                childSteps = getChildSteps(data.child_steps);
                stepRows.push(data);
                taskRows = getTasks(data);
                //console.log(childSteps);
                stepRows[stepRows.length-1].taskObjects = taskRows;
                stepRows[stepRows.length-1].child_steps = childSteps;
                stepRows[stepRows.length-1].isCollapsed = true;
                stepRows[stepRows.length-1].tasksCollapsed = true;
                console.log("steprows start");
                console.log(stepRows);
                console.log("steprows end");
            }), function errorCallback(){
                alert('error(getting steps)');
            }
        }
        $scope.parentStepsRowCollection = stepRows;

    };

    //Helper functions for getStatusViewData
    function getChildSteps(childSteps) {
        if(childSteps.length == 0) {
            return [];
        }
        var steps = [];
        for(i=0; i<childSteps.length; i++){
            $http({
                method: 'GET',
                url: childSteps[i]
            })
            .then(function successCallback(response) {
                response.data.isCollapsed = false;
                response.data.child_steps = getChildSteps(response.data.child_steps);
                response.data.taskObjects = getTasks(response.data);
                response.data.tasksCollapsed = true;
                steps.push(response.data);
                console.log(steps);
            }), function errorCallback(){
                alert('error(getting child steps)');
            }
        }
        childSteps = steps;
        return childSteps;
    };

    function getTasks(step) {
        var taskRows = [];
        for(i=0; i<step.tasks.length; i++){
            $http({
                method: 'GET',
                url: step.tasks[i]
            })
            .then(function successCallback(response) {
                var data = response.data;
                taskRows.push(data);
            }), function errorCallback(){
                alert('error(getting tasks)');
            }
        }
        return taskRows;
    };

    $scope.treeOptions = {
        nodeChildren: "child_steps",
        dirSelectable: true,
        injectClasses: {
            ul: "a1",
            li: "a2",
            liSelected: "a7",
            iExpanded: "a3",
            iCollapsed: "a4",
            iLeaf: "a5",
            label: "a6",
            labelSelected: "a8"
        }
    }

       //$scope.getStatusViewData();

    // Progress bar handler
    $scope.max = 100;
    //funcitons for select view
    $scope.profileClick = function(row){

        if ($scope.selectProfile == row && $scope.subSelect){
            $scope.subSelect = false;
            $scope.eventlog = false;
            $scope.edit = false;
        } else {
            $scope.subSelect = true;
            $scope.eventlog = true;
            $scope.edit = true;
            $scope.selectProfile = row;
            $scope.subSelectProfile = "profile";
            $http({
                method: 'OPTIONS',
                url: appConfig.djangoUrl+'tasks/'
            })
            .then(function successCallback(response) {
                // console.log(JSON.stringify(response.data));
                var data = response.data;
                $scope.subSelectOptions = data.actions.POST.name.choices;
            }), function errorCallback(){
                alert('error');
            };
/*
            $scope.subSelectOptions = [
                "option1",
                "option2",
                "option3"
            ];
            */
        }
        console.log($scope.selectProfile);
    };

    //populating select view
    $scope.selectRowCollection = [
    {
        entity: "PROFILE_SUBMISSION_AGREEMENT",
        profile: "standard profil",
        profiles: [
        ],
        state: "unspecified"
    }];
    $scope.getSaProfiles = function() {
        var sas = [];
        $http({
            method: 'GET',
            url: appConfig.djangoUrl+'submission-agreements'
        })
        .then(function successCallback(response) {
            // console.log(JSON.stringify(response.data));
            sas = response.data;
            $scope.submissionAgreements = sas;
            $scope.selectRowCollection[0].profileObjects = sas;
            for(i=0; i<sas.length; i++){
                $scope.selectRowCollection[0].profiles.push(sas[i].sa_name);
            }
            $scope.currentSa = sas[0];
            console.log($scope.currentSa);
        }), function errorCallback(){
            alert('error');
        };
    };
    $scope.getSelectCollection = function (submissionAgreement) {
        getProfile(submissionAgreement.profile_transfer_project[0]);
        console.log(selectRowCollapse);

    };
    function getProfile(profile) {
        $http({
            method: 'GET',
            url: profile
        })
        .then(function successCallback(response) {
            // console.log(JSON.stringify(response.data));
            selectRowCollapse.push(response.data);
        }), function errorCallback(){
            alert('error');
        };
    };
    var selectRowCollapse = [
    {
        entity: "PROFILE_TRANSFER_PROJECT",
        profile: "standard profile",
        profiles: [
            "default PTP"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_CONTENT_TYPE",
        profile: "standard profile",
        profiles: [
            "default PCT"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_DATA_SELECTION",
        profile: "standard profile",
        profiles: [
            "default PDS"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_CLASSIFICATION",
        profile: "standard profile",
        profiles: [
            "default PC"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_IMPORT",
        profile: "standard profile",
        profiles: [
            "default PCT"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_SUBMIT_DESCRIPTION",
        profile: "standard profile",
        profiles: [
            "default PSD"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_SUBMISSION INFORMATION PACKAGE",
        profile: "standard profile",
        profiles: [
            "default PSIP"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_ARCHIVAL INFORMATION PACKAGE",
        profile: "standard profile",
        profiles: [
            "default PAIP"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_DISSEMINATION INFORMATION PACKAGE",
        profile: "standard profile",
        profiles: [
            "default PDIP"
        ],
        state: "unspecified"
    },
    {
        entity: "PROFILE_WORKFLOW",
        profile: "standard profile",
        profiles: [
            "default PWF"
        ],
        state: "unspecified"
    }
    /* Profiles
     "PROFILE_SUBMISSION_AGREEMENT",
     "PROFILE_TRANSFER_PROJECT",
     "PROFILE_CONTENT_TYPE",
     "PROFILE_DATA_SELECTION",
     "PROFILE_CLASSIFICATION",
     "PROFILE_IMPORT",
     "PROFILE_SUBMIT_DESCRIPTION",
     "PROFILE_SUBMISSION INFORMATION PACKAGE",
     "PROFILE_ARCHIVAL INFORMATION PACKAGE",
     "PROFILE_DISSEMINATION INFORMATION PACKAGE",
     "PROFILE_WORKFLOW"
     */
        ];
        $scope.showHideAllProfiles = function() {
            if($scope.selectRowCollection.length == 1){
                for(i = 0; i < selectRowCollapse.length; i++){
                    $scope.selectRowCollection.push(selectRowCollapse[i]);
                }
            } else {
                $scope.selectRowCollection = [$scope.selectRowCollection[0]];
            }
        };
        //Populating edit view fields
        // Archivist
        // Organisation
        vm.archivistOrganisationModel = {
            ArchivistOrganisation: "Sigtuna Kommun",
            ArchivistOrganisationIdentity: "",
            ArchivistOrganisationSoftware: "",
            ArchivistOrganisationSoftwareIdentity: ""
        };
        vm.archivistOrganisationFields = [
    {
        key: "ArchivistOrganisation",
        type: "select",
        templateOptions: {
            label: "Archivist organisation",
            placeholder: "ArchivistOrganisation",
            options: [
            {
                name: "Petrus", value: "Petrus"
            },
            {
                name: "oskar", value: "oskar"
            },
            {
                name: "Sigtuna kommun", value: "Sigtuna kommun"
            }
            ]
        }
    },
    {
        key: 'ArchivistOrganisationIdentity',
        type: 'input',
        templateOptions: {
            label: 'Archivist organisation identity',
            placeholder: 'Archivist organisation identity'
        }
    },
    {
        key: 'ArchivistOrganisationSoftware',
        type: 'input',
        templateOptions: {
            label: 'Archivist organisation software',
            placeholder: 'Archivist organisation software'
        }
    },
    {
        key: 'ArchivistOrganisationSoftwareIdentity',
        type: 'input',
        templateOptions: {
            label: 'Archivist organisation software identity',
            placeholder: 'Archivist organisation software identity'
        }
    }
    ];

    // Creator
    // Organisation
    vm.creatorOrganisationModel = {
        CreatorOrganisation: "Riksarkivet",
        CreatorOrganisationIdentity: "",
        CreatorOrganisationSoftware: "",
        CreatorOrganisationSoftwareIdentity: ""
    };

    vm.creatorOrganisationFields = [

    {
        key: 'CreatorOrganisation',
        type: 'input',
        defaultValue: 'Riksarkivet',
        templateOptions: {
            label: 'Creator organisation',
            placeholder: 'Creator organisation'
        }
    },
    {
        key: 'CreatorOrganisationIdentity',
        type: 'input',
        templateOptions: {
            label: 'Creator organisation identity',
            placeholder: 'Creator organisation identity'
        }
    },
    {
        key: 'CreatorOrganisationSoftware',
        type: 'input',
        templateOptions: {
            label: 'Creator organisation software',
            placeholder: 'Creator organisation software'
        }
    },
    {
        key: 'CreatorOrganisationSoftwareIdentity',
        type: 'input',
        templateOptions: {
            label: 'Creator organisation software identity',
            placeholder: 'Creator organisation software identity'
        }
    }
    ];


    // Producer
    // organisation
    vm.producerOrganisationModel = {
        ProducerOrganisation: "",
        ProducerIndividual: "",
        ProducerOrganisationSoftware: "",
        ProducerOrganisationSoftwareIdentity: ""
    };

    vm.producerOrganisationFields = [
    {
        key: 'ProducerOrganisation',
        type: 'input',
        templateOptions: {
            label: 'Producer organisation',
            placeholder: 'Producer organisation'
        }
    },
    {
        key: 'ProducerIndividual',
        type: 'input',
        templateOptions: {
            label: 'Producer individual',
            placeholder: 'Producer individual'
        }
    },
    {
        key: 'ProducerOrganisationSoftware',
        type: 'input',
        templateOptions: {
            label: 'Producer organisation software',
            placeholder: 'Producer organisation software'
        }
    },
    {
        key: 'ProducerOrganisationSoftwareIdentity',
        type: 'input',
        templateOptions: {
            label: 'Producer organisation software identity',
            placeholder: 'Producer organisation software identity'
        }
    }
    ];


    // IP Owner
    // organisation
    vm.ipOwnerOrganisationModel = {
        IpOwnerOrganisation: "",
        IpOwnerIndividual: "",
        IpOwnerOrganisationSoftware: "",
        IpOwnerOrganisationSoftwareIdentity: ""
    };

    vm.ipOwnerOrganisationFields = [
    {
        key: 'ipOwnerOrganisation',
        type: 'input',
        templateOptions: {
            label: 'IP owner organisation',
            placeholder: 'IP owner organisation'
        }
    },
    {
        key: 'IpOwnerIndividual',
        type: 'input',
        templateOptions: {
            label: 'IP owner individual',
            placeholder: 'IP owner individual'
        }
    },
    {
        key: 'IpOwnerOrganisationSoftware',
        type: 'input',
        templateOptions: {
            label: 'IP owner organisation software',
            placeholder: 'IP owner organisation software'
        }
    },
    {
        key: 'IpOwnerOrganisationSoftwareIdentity',
        type: 'input',
        templateOptions: {
            label: 'IP owner organisation software identity',
            placeholder: 'IP owner organisation software identity'
        }
    }
    ];


    // Editor
    // organisation
    vm.editorOrganisationModel = {
        EditorOrganisation: "",
        EditorIndividual: "",
        EditorOrganisationSoftware: "",
        EditorOrganisationSoftwareIdentity: ""
    };

    vm.editorOrganisationFields = [
    {
        key: 'EditorOrganisation',
        type: 'input',
        templateOptions: {
            label: 'Editor organisation',
            placeholder: 'Editor organisation'
        }
    },
    {
        key: 'EditorIndividual',
        type: 'input',
        templateOptions: {
            label: 'Editor individual',
            placeholder: 'Editor indivivual'
        }
    },
    {
        key: 'EditorOrganisationSoftware',
        type: 'input',
        templateOptions: {
            label: 'Editor organisation software',
            placeholder: 'Editor organisation software'
        }
    },
    {
        key: 'EditorOrganisationSoftwareIdentity',
        type: 'input',
        templateOptions: {
            label: 'Editor organisation software identity',
            placeholder: 'Editor organisation software identity'
        }
    }
    ];


    // Preservation
    // organisation
    vm.preservationOrganisationModel = {
        PreservationOrganisation: "",
        PreservationIndividual: "",
        PreservationOrganisationSoftware: "",
        PreservationOrganisationSoftwareIdentity: ""
    };

    vm.preservationOrganisationFields = [
    {
        key: 'PreservationOrganisation',
        type: 'input',
        templateOptions: {
            label: 'Preservation organisation',
            placeholder: 'Preservation organisation'
        }
    },
    {
        key: 'PreservationIndividual',
        type: 'input',
        templateOptions: {
            label: 'Preservation individual',
            placeholder: 'Preservation individual'
        }
    },
    {
        key: 'PreservationOrganisationSoftware',
        type: 'input',
        templateOptions: {
            label: 'Preservation organisation software',
            placeholder: 'Preservation organisation software'
        }
    },
    {
        key: 'PreservationOrganisationSoftwareIdentity',
        type: 'input',
        templateOptions: {
            label: 'Preservation organisation software identity',
            placeholder: 'Preservation organisation software identity'
        }
    }
    ];

    $scope.exampleData = "1";
    $scope.exampleSelectData = [
        "1",
        "2",
        "3"
    ];
    // onSubmit function

    vm.onSubmit = function() {
        var params = {
            info: {
                "ArchivistOrganisation": vm.archivistOrganisationModel,
                "CreatorOrganisation": vm.creatorOrganisationModel,
                "ProducerOrganisation": vm.producerOrganisationModel,
                "IpOwnerOrganisation": vm.ipOwnerOrganisationModel,
                "EditorOrganisation": vm.editorOrganisationModel,
                "PreservationOrganisation": vm.preservationOrganisationModel
            }
        };
        var sendData = {"params": params, "name": "preingest.tasks.First", "processstep_pos": 1, "attempt": 1, "progress": 50, "processstep": appConfig.djangoUrl+"steps/16130473-dbcb-4ea1-b251-e9a1e9cb8185/", "task_id": "123"};
        //{"url": "http://0.0.0.0:8000/steps/f79355fc-bb1e-4bde-958c-8e6b66c91d5b/","id": "f69355fc-bb1e-4bde-958c-8e6b66c91d5b","name": "new stuff","result": null,"type": 100,"user": "petrus","status": 0,"progress": 50,"time_created": "2016-08-05T09:39:26.987468Z","parent_step": null,"ipobject": null,"tasks": [],"task_set": []};
        var uri = appConfig.djangoUrl+'tasks/';
        $http({
            method: 'POST',
            url: uri,
            data: sendData,
        })
        .success(function (response) {
            alert('success');
        })
        .error(function (response) {
            alert('error');
        });
    };

// Page selection
//      &
// ng-show code
    $scope.statusShow = false;
    $scope.eventShow = false;
    $scope.select = false;
    $scope.subSelect = false;
    $scope.edit = false;
    $scope.eventlog = false;
    $scope.htmlPopover = $sce.trustAsHtml('<font size="3" color="red">Currently disabled</font>');
    $scope.pages = ['Info', 'Prepare Ip', 'Selection', 'Extraction', 'Manage Data', 'IP Approval', 'IP Management'];
    $scope.selectedPage = $scope.pages[0];

    $scope.toggleSelectView = function () {
        if($scope.select == false){
            $scope.select = true;
        } else {
            $scope.select = false;
        }
    };
    $scope.toggleSubSelectView = function () {
        if($scope.subSelect == false){
            $scope.subSelect = true;
        } else {
            $scope.subSelect = false;
        }
    };
    $scope.toggleEditView = function () {
        if($scope.edit == false){
            $('.edit-view').show();
            $scope.edit = true;
            $scope.eventlog = true;
        } else {
            $('.edit-view').hide();
            $scope.edit = false;
            $scope.eventlog = false;
        }
    };
    $scope.toggleEventlogView = function() {
        if($scope.eventlog == false){
            $scope.eventlog = true;
        }else {
            $scope.eventlog = false;
        }
    }




});
