require.config({
    paths: {
        text: "../app/FitbitAddonforSplunk/components/lib/text",
        'settingsTemplate' : '../app/FitbitAddonforSplunk/components/templates/settings.html',
        'settingsModel' : '../app/FitbitAddonforSplunk/components/models/settingsModel'
    }
});

define([
    "underscore",
    "backbone",
    "splunkjs/mvc",
    "jquery",
    "splunkjs/mvc/simplesplunkview",
    "text!settingsTemplate",
    "settingsModel"
], function( _, Backbone, mvc, $, SimpleSplunkView, SettingsTemplate, SettingsModel){

    var settingsView = SimpleSplunkView.extend({

        className: "FitbitConfigView",

        el: '#fitbitConfigWrapper',

        events: {
            "click #addKey" : "addKey",
            "click .deleteKey" : "deleteKey"
        },

        initialize: function() {
            this.options = _.extend({}, this.options);
            //this.eventBus = _.extend({}, Backbone.Events);
            this.model = SettingsModel;
            this.listenTo(this.model, 'change', this.render);
            //this.render();
        },

        _objectifyForm: function(formArray) {

            var returnArray = {};
            for (var i = 0; i < formArray.length; i++){
                returnArray[formArray[i]['name']] = formArray[i]['value'];
            }
            return returnArray;
        },

        _getSettings: function() {
            var service = mvc.createService();
            var that = this;
            var authCode = '';

            service.get('/servicesNS/nobody/FitbitAddonforSplunk/fitbit/fitbit_config', authCode,
                function(err, response) {

                    if(err) {
                        that.model.set({ failed : true, error : err, _method : "" });
                    } else {

                        var data = response.data.entry;
                        var keys = {};

                        //delete keys["eai:acl"];

                        _.each(data, function(v,k) {
                            var arr = [];
                            var realm_obj = {};
                            var realm = v.content.realm;
                            var username = v.content.username;
                            arr.push(realm_obj['username'] = username);
                            keys[realm] = arr;
                        });

                        console.log('All the datas: ', data);
                        console.log('Returned value: ', keys);

                        that.model.set({ keys : keys, loaded : true });

                    }
                }
            );
        },

        addKey: function(e) {
            e.preventDefault();

            var that = this;
            var service = mvc.createService();
            var key_name=$('#apiKeyName').val();
            var key_val=$('#apiKeyValue').val();
            var keys_obj = this.model.get("keys");
            var errors = false;

            var formArray = $('#fitbitKeyForm').serializeArray();
            var data = that._objectifyForm(formArray);
            var errors = false;

            $(document).find('div.error').remove();
            $(document).find('input').removeClass('error');

            //validation
            _.each(data, function(val,key) {
                if(val === '') {
                    $("<div class=\"error\">The " + key + " field cannot be empty.</div>").insertAfter("#" + key);
                    $("#" + key).addClass('error');
                    errors = true;
                }
            });

            keys_obj[key_name] = key_val;

            if(!errors) {

                service.post('/servicesNS/nobody/FitbitAddonforSplunk/fitbit/fitbit_config/edit/', {
                    "keys" : JSON.stringify(data), "method" : JSON.stringify({ "type" : "post" }) },

                    function(err, response) {

                        if(err) {

                            console.log('Error: ', err);

                            var text = err.data.messages[0].text;

                            that.model.set({ failed : true, error : text });

                        } else {

                            keys = that.model.get("keys");

                            console.log('Data????? ', data);

                            _.each(data, function(v,k) {
                                var arr = [];
                                var realm_obj = {};
                                var realm = data["apiKeyName"];
                                var username = data["apiKeyName"];
                                arr.push(realm_obj['username'] = username);
                                keys[realm] = arr;
                            });

                            console.log('All the datas: ', data);
                            console.log('Returned value: ', keys);

                            that.model.set({ keys : keys, failed : false, _method : "post" });

                            that.render();

                        }
                    }
                );
            }
        },

        deleteKey: function(e) {
            e.preventDefault();

            var that = this;
            var service = mvc.createService();
            var delete_item = $(e.currentTarget).data('delete');
            var keys_obj = this.model.get("keys");

            var data = { "apiKeyName" : delete_item };

            delete keys_obj[delete_item];

            service.post('/servicesNS/nobody/FitbitAddonforSplunk/fitbit/fitbit_config/edit', {
                "keys" : JSON.stringify(data), "method" : JSON.stringify({ "type" : "delete" }) },

                function(err, response) {

                    if(err) {
                        that.model.set({ failed : true, error : err });
                    } else {

                        keys = that.model.get("keys");

                        delete keys[delete_item];

                        that.model.set({ keys : keys, failed : false, _method : "delete" });

                        that.render();

                    }
                }
            );


        },

        render: function() {

            this.$el.html(_.template(SettingsTemplate, this.model.toJSON()));

            if(this.model.get('loaded') === false) {
                this._getSettings();
            }

            if(this.model.get("failed") === false) {
                setTimeout(function() {
                    $(document).find("#success-message").fadeOut();
                }, 3000);
            }

            return this;
        }

    });

    return settingsView;

});